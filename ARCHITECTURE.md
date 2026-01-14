# Architecture Overview

This document explains how Adamastor works. Read this first before diving into the code.

## The 30-Second Summary

```
Parliament API → Watcher (fetches + transforms) → Supabase DB → Web App → Citizens
```

**Watcher** fetches Parliament data daily, transforms it, and stores it in a database.
**Web** reads that database and displays deputy performance to users.

---

## How Data Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. FETCH (daily at 06:00 UTC via GitHub Actions)                           │
│     ┌──────────────────┐                                                    │
│     │ Parliament API   │ ──→ 4 JSON files (deputies, initiatives, etc.)    │
│     └──────────────────┘                                                    │
│              ↓                                                              │
│  2. VALIDATE                                                                │
│     ┌──────────────────┐                                                    │
│     │ JSON Schemas     │ ──→ Reject invalid data before processing          │
│     └──────────────────┘                                                    │
│              ↓                                                              │
│  3. ARCHIVE                                                                 │
│     ┌──────────────────┐                                                    │
│     │ Backblaze B2     │ ──→ Raw snapshots for audit trail                  │
│     └──────────────────┘                                                    │
│              ↓                                                              │
│  4. TRANSFORM (8-step pipeline)                                             │
│     ┌──────────────────────────────────────────────────────────────┐        │
│     │ parties → districts → deputies → initiatives → activities    │        │
│     │     → attendance → biographies → stats                       │        │
│     └──────────────────────────────────────────────────────────────┘        │
│              ↓                                                              │
│  5. STORE                                                                   │
│     ┌──────────────────┐                                                    │
│     │ Supabase         │ ──→ PostgreSQL with indexes and views              │
│     └──────────────────┘                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WEB APPLICATION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  React Query (data fetching) → React Components → User Browser              │
│                                                                             │
│  Features:                                                                  │
│  • Report Card: Enter postal code → see your deputies' grades               │
│  • Rankings: National and district leaderboards                             │
│  • Battle: Compare two deputies head-to-head                                │
│  • Waste Calculator: Calculate cost of underperformance                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
adamastor/
│
├── apps/
│   ├── watcher/          # Data pipeline (runs on schedule)
│   │   ├── index.ts          # Entry: fetch → validate → upload
│   │   ├── src/
│   │   │   ├── fetcher.ts        # Downloads Parliament API data
│   │   │   ├── validator.ts      # JSON schema validation
│   │   │   ├── supabase.ts       # Database client
│   │   │   ├── transform/        # Data transformation (see below)
│   │   │   └── *-scraper.ts      # HTML scrapers for extra data
│   │   └── schemas/          # JSON validation schemas
│   │
│   └── web/              # React frontend (user-facing)
│       ├── src/
│       │   ├── App.tsx           # Routes
│       │   ├── pages/            # One folder per page
│       │   ├── components/       # Reusable UI
│       │   ├── services/         # Data fetching hooks
│       │   └── lib/              # Utilities
│       └── public/           # Static assets
│
├── packages/
│   └── shared/           # Shared TypeScript types
│
├── supabase/
│   ├── migrations/       # Database schema (SQL files)
│   └── seed.sql          # Initial data (districts, parties)
│
├── specs/                # Feature specifications
│   └── data/             # Data pipeline documentation
│
└── docs/                 # Setup guides
```

---

## The Transform Pipeline

The heart of data processing. Runs in sequence because each step depends on the previous.

**File:** `apps/watcher/src/transform/index.ts`

| Step | What it does | Output |
|------|--------------|--------|
| 1. **Parties** | Upsert party records | party ID → name mapping |
| 2. **Districts** | Match districts to seed data | district ID mapping |
| 3. **Deputies** | Create deputy records with party/district links | deputy ID mappings |
| 4. **Initiatives** | Create bills, link authors | author proposal counts |
| 5. **Activities** | Count interventions per party, distribute to deputies | intervention counts |
| 6. **Attendance** | Scrape plenary meeting attendance | attendance records |
| 7. **Biographies** | Scrape deputy profiles (birth date, profession) | biography records |
| 8. **Stats** | Calculate work scores, grades, rankings | deputy_stats table |

### The Work Score Formula

```
Work Score = weighted average of:
  - 40% attendance rate
  - 30% proposal authorship (vs average)
  - 20% interventions (vs average)
  - 10% questions (vs average)

Grade:
  A = score ≥ 85
  B = score ≥ 70
  C = score ≥ 55
  D = score ≥ 40
  F = score < 40
```

---

## Database Schema (Key Tables)

```sql
-- Core entities
deputies          -- Name, party, district, photo URL
parties           -- Acronym, full name, color
districts         -- Name, postal code prefixes

-- Activity tracking
initiatives       -- Bills and proposals
party_votes       -- How each party voted (API only gives party-level)
plenary_attendance -- Per-deputy meeting attendance (scraped)

-- Computed metrics
deputy_stats      -- Work score, grade, national rank, district rank
deputy_biographies -- Birth date, profession, education (scraped)

-- Views (pre-joined for fast queries)
deputy_details    -- Everything about a deputy in one query
rankings          -- Active deputies ordered by work score
```

---

## Key Concepts

### ID Mapping Complexity

Parliament uses different IDs for the same deputy in different contexts:

| ID Type | Where it's used | Example |
|---------|-----------------|---------|
| `DepId` | Photos, external reference | 7489 |
| `DepCadId` | Initiative authors | 7489 |
| `biography_id` (BID) | Attendance pages, biography pages | 7489 |

The transform pipeline maintains mappings between these IDs.

### Scrapers vs API

Some data isn't in the official API:
- **Attendance** → Scraped from Parliament website HTML
- **Biographies** → Scraped from deputy profile pages

Scrapers are in `apps/watcher/src/*-scraper.ts`.

### React Query Pattern

All data fetching in the web app uses React Query:

```tsx
// In services/reportCard/useDeputy.ts
export function useDeputy(id: string) {
  return useQuery({
    queryKey: ['deputy', id],
    queryFn: () => supabase.from('deputy_details').select('*').eq('id', id)
  });
}

// In components
const { data, isLoading, error } = useDeputy(deputyId);
```

---

## Running Locally

### Prerequisites
- [Bun](https://bun.sh) (runtime)
- [Docker](https://docker.com) (for Supabase)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Start local Supabase
npx supabase start

# 3. Run the transform pipeline (populate database)
cd apps/watcher
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<key-from-supabase-start> \
bun run transform <snapshot-timestamp>

# 4. Start the web app
cd apps/web
bun dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions.

---

## Common Tasks

### Add a new data source
1. Add URL to `apps/watcher/src/config.ts`
2. Create JSON schema in `apps/watcher/schemas/`
3. Add transform module in `apps/watcher/src/transform/`
4. Add database migration in `supabase/migrations/`

### Add a new web page
1. Create folder in `apps/web/src/pages/YourPage/`
2. Add route in `apps/web/src/App.tsx`
3. Add data hook in `apps/web/src/services/yourFeature/`

### Modify the work score formula
1. Update `calculate_work_score()` in `supabase/migrations/20241224000003_functions.sql`
2. Update weights in `packages/shared/src/types.ts` (for UI display)
3. Run migration: `npx supabase db reset`

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Runtime | Bun | Fast, TypeScript-native |
| Frontend | React 19 + Vite | Modern, fast HMR |
| Styling | Tailwind CSS v4 | Utility-first, no CSS files |
| State | React Query + Zustand | Server state vs client state |
| Database | Supabase (PostgreSQL) | Open source, real-time, great DX |
| Storage | Backblaze B2 | Cheap cold storage for audit trail |
| Hosting | Vercel (web) + GitHub Actions (pipeline) | Free tier friendly |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

---

## Navigating the Codebase (for AI Agents)

This section helps AI agents understand how to find and modify code effectively.

### Entry Points

**Data Pipeline:**
- Main entry: `apps/watcher/index.ts` → `src/commands/sync.ts`
- Transform pipeline: `apps/watcher/src/transform/index.ts` (8-step sequence)
- Individual transforms: `apps/watcher/src/transform/*.ts` (one file per step)

**Web Application:**
- Main entry: `apps/web/src/main.tsx` → `App.tsx`
- Pages: `apps/web/src/pages/` (one folder per page)
- Components: `apps/web/src/components/` (reusable UI)
- Data hooks: `apps/web/src/services/` (React Query hooks)

**Shared Types:**
- Location: `packages/shared/src/types.ts`
- Used by: Both `watcher` and `web` apps
- Changes here affect both apps - test thoroughly

### Finding Related Code

**When modifying a transform step:**
1. Check `apps/watcher/src/transform/index.ts` for pipeline order
2. Understand dependencies (e.g., `transformDeputies` needs `partyMap` and `districtMap`)
3. Check for tests: `apps/watcher/src/transform/your-step.test.ts`
4. Check database schema: `supabase/migrations/` (look for related tables)

**When modifying a React component:**
1. Find the component: `apps/web/src/components/YourComponent/`
2. Find where it's used: `grep -r "YourComponent" apps/web/src/`
3. Check for data hooks: `apps/web/src/services/yourFeature/`
4. Check for tests: `apps/web/src/components/YourComponent/YourComponent.test.tsx`

**When modifying work score calculation:**
1. Database function: `supabase/migrations/*_functions.sql` → `calculate_work_score()`
2. TypeScript helper: `apps/watcher/src/data-consistency/helpers.ts` → `calculateWorkScore()`
3. Shared types: `packages/shared/src/types.ts` (for UI display)
4. **Keep all three in sync!**

### Common Patterns

**Transform Pipeline Pattern:**
```typescript
// apps/watcher/src/transform/your-step.ts
export async function transformYourData(
  input: YourInput[],
  dependencies: DependencyMap
): Promise<ResultMap> {
  const result = new Map();
  // Transform logic
  return result;
}
```

**React Query Hook Pattern:**
```typescript
// apps/web/src/services/yourFeature/useYourData.ts
export function useYourData(id: string) {
  return useQuery({
    queryKey: ['yourData', id],
    queryFn: () => supabase.from('your_table').select('*').eq('id', id).single()
  });
}
```

**Component Pattern:**
```typescript
// apps/web/src/components/YourComponent/YourComponent.tsx
export function YourComponent({ prop }: Props) {
  const { data, isLoading } = useYourData(prop.id);
  // Render logic
}
```

### ID Mapping Complexity

Parliament uses different IDs for the same deputy:
- `DepId` - Used in photos, external references
- `DepCadId` (Cadastro ID) - Used in initiatives (author references)
- `biography_id` (BID) - Used in attendance pages, biography pages

**Where mappings are maintained:**
- `apps/watcher/src/transform/deputies/index.ts` - Creates initial mappings
- `apps/watcher/src/transform/deputies/helpers.ts` - Helper functions for ID lookups
- Transform steps use these mappings to link data correctly

**When modifying ID logic:**
- Test with real data (some deputies may have missing IDs)
- Check all transform steps that use ID mappings
- Verify database foreign keys match ID types

### Testing Locations

**Watcher tests:**
- Unit tests: `apps/watcher/src/**/*.test.ts`
- Data consistency: `apps/watcher/src/data-consistency/*.test.ts`

**Web tests:**
- Unit tests: `apps/web/src/**/*.test.tsx` (Vitest + Testing Library)
- E2E tests: `apps/web/e2e/*.spec.ts` (Playwright)

**Running tests:**
```bash
# All tests
bun test

# Watcher only
bun --filter watcher test

# Web only
bun --filter web test

# E2E only
bun --filter web e2e
```

### Database Schema

**Migrations location:** `supabase/migrations/`
- Naming: `YYYYMMDDHHMMSS_description.sql`
- Never modify existing migrations (create new ones)
- Test locally: `npx supabase db reset`

**Key tables:**
- `deputies` - Core deputy records
- `deputy_stats` - Computed metrics (work score, grade, rankings)
- `initiatives` - Bills and proposals
- `plenary_attendance` - Meeting attendance records
- `deputy_biographies` - Scraped biography data

**Views (pre-joined for performance):**
- `deputy_details` - Everything about a deputy in one query
- `rankings` - Active deputies ordered by work score

### Monorepo Commands

**App-specific:**
```bash
bun --filter watcher <command>
bun --filter web <command>
```

**Root-level (all apps):**
```bash
bun lint          # Lint all apps
bun typecheck     # Type check all apps
bun test          # Run all tests
```

**When changing shared code:**
1. Make change in `packages/shared/`
2. Test watcher: `bun --filter watcher test`
3. Test web: `bun --filter web test`
4. Build both: `bun --filter '*' build`

### Common AI-Assisted Tasks

**Adding a new transform step:**
1. Create `apps/watcher/src/transform/your-step.ts`
2. Add to pipeline in `apps/watcher/src/transform/index.ts`
3. Add tests: `apps/watcher/src/transform/your-step.test.ts`
4. Create migration if new tables needed

**Adding a new web page:**
1. Create `apps/web/src/pages/YourPage/YourPage.tsx`
2. Add route in `apps/web/src/App.tsx`
3. Create data hook in `apps/web/src/services/yourFeature/`
4. Add navigation in `apps/web/src/components/MainNav.tsx`

**Modifying work score formula:**
1. Update `calculate_work_score()` in `supabase/migrations/*_functions.sql`
2. Update `calculateWorkScore()` in `apps/watcher/src/data-consistency/helpers.ts`
3. Update shared types if thresholds change: `packages/shared/src/types.ts`
4. Add tests for edge cases
5. Run migration: `npx supabase db reset`

For more detailed guidance, see [docs/AI_AGENTS.md](docs/AI_AGENTS.md).
# Architecture Overview

This document explains how gov-perf works. Read this first before diving into the code.

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
gov-perf/
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

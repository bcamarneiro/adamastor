# Contributing to Adamastor

Thank you for your interest in improving transparency in Portuguese politics!

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- [Docker Desktop](https://docker.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)

### Setup

```bash
# Clone the repo
git clone https://github.com/bcamarneiro/adamastor.git
cd adamastor

# Install dependencies
bun install

# Start local database
npx supabase start

# Note the service role key from the output, then:
cd apps/watcher
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<your-key> \
bun run transform <snapshot-folder>  # e.g., 2025-12-25T21-12-45Z

# Start the web app
cd ../web
bun dev
```

Open http://localhost:3000

---

## Project Structure

```
adamastor/
├── apps/watcher/     # Data pipeline (TypeScript/Bun)
├── apps/web/         # Frontend (React/Vite)
├── packages/shared/  # Shared types
├── supabase/         # Database migrations
├── specs/            # Feature specs
└── docs/             # Documentation
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed explanation.

---

## Development Workflow

### Branching Strategy

```text
staging (default) ──► main (production)
    │
    └── feature/your-feature (your PR)
```

- **Always branch from `staging`** - it's the default branch
- PRs merge to `staging` first
- Maintainers deploy `staging` → `main` for releases

### 1. Create a branch

```bash
git checkout staging
git pull origin staging
git checkout -b feature/your-feature
# or
git checkout -b fix/issue-description
```

### 2. Make changes

- **Frontend**: Changes in `apps/web/` hot-reload automatically
- **Database**: Run `npx supabase db reset` after migration changes
- **Pipeline**: Re-run `bun run transform <snapshot>` after transform changes

### 3. Test your changes

```bash
# Lint
bun lint

# Type check
bun --filter '*' tsc --noEmit

# Unit tests
bun test

# Manual testing
bun dev  # Check the UI
```

### 4. Submit a PR

- Write a clear description of what changed and why
- Link any related issues
- Ensure CI passes

---

## Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting.

```bash
# Check
bun lint

# Fix automatically
bun --filter '*' lint:fix
```

### Conventions

- **TypeScript**: Strict mode enabled
- **Naming**: `camelCase` for variables, `PascalCase` for components/types
- **Files**: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- **Comments**: Only where logic isn't self-evident

---

## Common Tasks

### Add a new transform step

1. Create `apps/watcher/src/transform/your-step.ts`
2. Export main function: `export async function transformYourData(...)`
3. Import in `apps/watcher/src/transform/index.ts`
4. Add to pipeline sequence
5. Create migration if new tables needed

### Add a new web page

1. Create `apps/web/src/pages/YourPage/YourPage.tsx`
2. Add route in `apps/web/src/App.tsx`
3. Create data hook in `apps/web/src/services/yourFeature/`
4. Add navigation in `apps/web/src/components/MainNav.tsx`

### Add a database migration

```bash
# Create migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql

# Edit the file with your SQL

# Apply
npx supabase db reset
```

### Run the full pipeline locally

```bash
cd apps/watcher

# 1. Fetch fresh data
bun run start  # Creates snapshot in snapshots/<timestamp>/

# 2. Transform to database
SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<key> \
bun run transform <timestamp>
```

---

## Architecture Decisions

### Why Bun?
Fast startup, native TypeScript, good monorepo support.

### Why separate watcher and web?
- **watcher** runs on schedule (GitHub Actions) - no user interaction
- **web** serves users - needs to be fast and always available
- Decoupling allows independent deployment and testing

### Why Supabase?
Open-source PostgreSQL with great DX, real-time subscriptions, auto-generated API.

### Why scrapers for some data?
Parliament API doesn't expose per-deputy attendance or biography details. We scrape these from the public website.

---

## Testing

### Unit tests
```bash
bun test
```

### Manual testing checklist

Before submitting a PR:
- [ ] Landing page loads
- [ ] Postal code lookup works
- [ ] Deputy detail page displays correctly
- [ ] Rankings page loads
- [ ] No console errors

---

## Using AI Assistance

This repository is optimized for AI collaboration (Cursor, GitHub Copilot, Claude Code, GitHub Copilot Reviews). When using AI assistance:

### Principles

- **Keep changes small and focused** - One feature, one bug fix per PR
- **Write clear prompts** - Be specific about what you want to change
- **Always run tests** - `bun test` before committing
- **Update tests when behavior changes** - Tests are safety nets
- **Never commit secrets** - No API keys, tokens, or sensitive data

### Writing Good Prompts

**✅ Good:**
- "Add unit tests for `transformParties()` in `apps/watcher/src/transform/parties.ts`"
- "Fix TypeScript error in `apps/web/src/services/reportCard/useDeputy.ts` line 45"
- "Refactor `DeputyCard` component: extract `GradeCircle` into separate file, add tests"

**❌ Bad:**
- "Fix the transform" (too vague)
- "Make the UI better" (no scope)
- "Add tests" (for what? where?)

### Monorepo Considerations

When using AI to change code:

1. **If touching `packages/shared/`**: Test in both `watcher` and `web`
   ```bash
   bun --filter watcher test
   bun --filter web test
   ```

2. **Use workspace commands**: `bun --filter watcher build`, `bun --filter web dev`

3. **Be aware of cross-app dependencies**: Changes to shared types affect both apps

### PR Descriptions for AI Reviewers

When submitting a PR, write a clear description to help AI reviewers (especially GitHub Copilot Reviews):

- **What** changed (summary)
- **Why** it changed (context/motivation)
- **How** it works (implementation details)
- **Risks** (breaking changes, performance, data consistency)
- **Testing** (what was tested, coverage added)

See [docs/AI_AGENTS.md](docs/AI_AGENTS.md) for detailed guidelines and examples.

---

## Getting Help

- **Questions**: Open a [Discussion](https://github.com/bcamarneiro/adamastor/discussions)
- **Bugs**: Open an [Issue](https://github.com/bcamarneiro/adamastor/issues)
- **Security**: Email directly (don't open public issue)
- **AI assistance**: See [docs/AI_AGENTS.md](docs/AI_AGENTS.md)

---

## Political Neutrality

This project tracks **performance metrics only** (attendance, proposals, interventions). We do not:
- Endorse any political party
- Make ideological judgments
- Rate deputies on policy positions

The goal is **transparency**, not advocacy.

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

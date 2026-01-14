# Copilot Instructions for Adamastor

## Project Overview

Adamastor is a Portuguese Parliament transparency platform that tracks deputy attendance and performance. It's a **Turborepo monorepo** with:

- `apps/watcher` - Data pipeline (Bun/TypeScript) that fetches Parliament API data daily
- `apps/web` - React SPA (Vite) for displaying deputy rankings and stats
- `packages/shared` - Shared TypeScript types used by both apps
- `supabase/` - Database migrations and seed data

## Tech Stack

- **Runtime**: Bun (for watcher), Vite (for web)
- **Language**: TypeScript (strict mode)
- **Testing**: Bun test (watcher), Vitest + Playwright E2E (web)
- **Linting**: Biome (formatting + linting)
- **Database**: Supabase (PostgreSQL)
- **UI**: React + Radix UI + Tailwind CSS

## Build & Test Commands

```bash
# Root level
bun install          # Install all dependencies
bun lint             # Lint all packages (Biome)
bun typecheck        # Type check all packages

# App-specific
bun --filter watcher test    # Run watcher unit tests
bun --filter web test        # Run web unit tests
bun --filter web build       # Build web app

# E2E tests
cd apps/web && npx playwright test
```

## Key Conventions

### Branching
- All PRs target `staging` branch (never `main` directly)
- Branch naming: `fix/issue-<n>-<desc>`, `feat/issue-<n>-<desc>`

### Code Style
- Use Biome for formatting (not Prettier/ESLint)
- Prefer `const` over `let`, avoid `any` types
- Use descriptive variable names (Portuguese context: `deputado`, `distrito`, `partido`)
- Keep functions small and focused

### Testing
- Watcher tests use `bun:test` with `describe/it/expect`
- Web tests use Vitest with Testing Library
- E2E tests use Playwright, located in `apps/web/e2e/`
- Bug fixes should include E2E regression tests

### React Patterns
- Use React Query (`@tanstack/react-query`) for data fetching
- Use Radix UI primitives for accessible components
- Use Tailwind with custom Radix color scale (`neutral-1` to `neutral-12`, `accent-*`, etc.)

## Critical Code Areas

### Transform Pipeline (`apps/watcher/src/transform/`)
Core data processing. Changes here affect data accuracy. Key files:
- `districts.ts` - District/postal code mapping
- `deputies/` - Deputy data transformation
- `parties.ts` - Party color and data mapping

### Work Score Calculation
Formula determines deputy grades (A-F). Located in:
- `supabase/migrations/*_functions.sql` (database function)
- `packages/shared/src/types.ts` (grade thresholds)

### Postal Code Mapping (`apps/watcher/src/transform/district-data.ts`)
Maps Portuguese postal codes to districts. Very sensitive - errors cause wrong district assignments.

## Common Review Points

When reviewing code, pay attention to:

1. **Type safety** - No `any` types, proper null checks
2. **Error handling** - Network calls should have try/catch, meaningful error messages
3. **Test coverage** - New features need tests, bug fixes need regression tests
4. **Portuguese context** - Data relates to Portuguese Parliament (deputies, parties, districts)
5. **Cache times** - React Query `staleTime` values (data syncs daily at 6-7 AM UTC)
6. **Accessibility** - Use semantic HTML, proper ARIA attributes

## File Patterns

- `*.test.ts` / `*.test.tsx` - Unit tests (co-located with source)
- `apps/web/e2e/*.spec.ts` - E2E tests
- `supabase/migrations/*.sql` - Database migrations (never modify existing ones)
- `packages/shared/src/types.ts` - Shared TypeScript types

## Portuguese Parliament Context

- **Legislatura** - Legislative term (currently XVII / 17th)
- **Deputado** - Deputy/Member of Parliament
- **Distrito** - Electoral district (22 total including islands and diaspora)
- **Partido** - Political party (PS, PSD, CH, IL, BE, PCP, L, PAN, etc.)
- **Work Score** - Performance metric (0-100) based on attendance, proposals, interventions

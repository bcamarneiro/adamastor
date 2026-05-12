# AI Agent Collaboration Guidelines

This document provides guidelines for AI agents (Cursor, GitHub Copilot, Claude Code, GitHub Copilot Reviews) and humans using AI assistance to work effectively with the Adamastor repository.

## General Principles

### Code Quality

- **Keep functions small and focused** - Single responsibility principle
- **Use descriptive names** - Function and variable names should clearly express intent
- **Add docstrings** - Document complex logic, especially in transform pipeline steps
- **Update tests when behavior changes** - Tests are safety nets for AI-driven changes
- **Never commit secrets** - No API keys, tokens, or sensitive data in code or commits

### Monorepo Awareness

- **Respect workspace structure** - Use `bun --filter` for app-specific commands
- **Be aware of cross-app dependencies** - Changes to `packages/shared/` affect both `watcher` and `web`
- **Test changes in affected apps** - When touching shared code, verify both apps still work
- **Use workspace commands** - `bun --filter watcher test`, `bun --filter web build`

### Change Scope

- **Small, focused changes** - One feature, one bug fix, one refactor per PR
- **Clear commit messages** - Describe what changed and why
- **Incremental improvements** - Build up complex features in small steps

### Branching Strategy

- **All PRs target `staging`** - Never create PRs directly to `main`
- **Create feature branches from `staging`** - `git checkout staging && git pull && git checkout -b <type>/issue-<n>-<desc>`
- **Branch naming**: `fix/`, `feat/`, `refactor/`, `docs/`, `chore/` + issue number + short description

---

## Architecture Decision Records (ADRs)

Before making significant changes, **read the relevant ADRs** to understand existing architectural patterns and decisions:

- **[ADR-001: Monorepo Structure](architecture/ADR-001-monorepo.md)** - Bun workspaces, workspace dependencies, project organization
- **[ADR-002: React + Vite Architecture Patterns](architecture/ADR-002-nextjs-patterns.md)** - Routing (React Router v6), component structure, data fetching (React Query), service layer patterns
- **[ADR-003: Supabase Integration Patterns](architecture/ADR-003-supabase.md)** - Database schema, client configuration, RLS policies, data sync patterns
- **[ADR-004: Testing Strategy](architecture/ADR-004-testing.md)** - Testing pyramid, Vitest (unit), Playwright (E2E), CI integration

**When to reference ADRs:**
- Making changes to monorepo structure or workspace configuration → Read ADR-001
- Adding new routes, pages, or data fetching logic → Read ADR-002
- Modifying database queries or Supabase integration → Read ADR-003
- Adding tests or changing test patterns → Read ADR-004

**When to update ADRs:**
- Making architectural decisions that affect future development
- Changing core patterns (routing, data fetching, testing)
- Introducing new technologies or frameworks
- Deprecating or replacing existing patterns

See [docs/architecture/README.md](architecture/README.md) for the complete ADR index and template.

---

## Tool-Specific Guidance

### Inline Assistants (GitHub Copilot, Cursor Inline)

**Best for:**
- Single function changes
- Component prop additions
- Type definitions
- Small utility functions

**Example prompts:**
- ✅ "Add a `formatDate` function that converts ISO dates to Portuguese format"
- ✅ "Add a `loading` prop to the `DeputyCard` component"
- ❌ "Refactor the entire transform pipeline" (too broad)

### IDE/Chat Agents (Cursor Agent Mode, Claude Code)

**Best for:**
- Multi-file changes
- Refactoring across modules
- Adding test coverage
- Documentation updates

**Example prompts:**
- ✅ "Add unit tests for `transformParties()` in `apps/watcher/src/transform/parties.ts`"
- ✅ "Refactor `DeputyCard` component to extract `GradeCircle` into a separate file, add tests"
- ✅ "Update ARCHITECTURE.md to document the new attendance scraping incremental logic"
- ❌ "Make the UI better" (too vague, no scope)

### PR Reviewers (GitHub Copilot Reviews)

**Best for:**
- Code review feedback
- Identifying potential bugs
- Suggesting improvements

**To help AI reviewers:**
- Write clear PR descriptions (see [PR Template](../.github/PULL_REQUEST_TEMPLATE.md))
- Include "What", "Why", "How", and "Testing" sections
- Link related issues
- Highlight risks and breaking changes

### Responding to PR Review Comments

When reviewing PRs or addressing Copilot comments, **always leave a reply** on each comment:

1. **Reply format for addressed comments**:

   ```text
   Fixed in commit <sha>. <brief description of the fix>
   ```

2. **Reply format for intentionally skipped comments**:

   ```text
   Intentionally not addressed: <reasoning why the current approach is correct>
   ```

3. **Never silently skip comments** - Every Copilot comment must have a response so the user knows the status

---

## Critical Paths (Handle with Extra Care)

These areas require extra attention when making changes:

### 1. Transform Pipeline (`apps/watcher/src/transform/`)

**Why critical:** This is the core data processing logic. Errors here affect data accuracy.

**Guidelines:**
- Test each transform step independently
- Understand step dependencies (see [ARCHITECTURE.md](../ARCHITECTURE.md#the-transform-pipeline))
- Maintain ID mappings correctly (DepId, DepCadId, biography_id)
- Add tests when modifying transform logic

**Example safe change:**
```typescript
// Adding a new field to party transform
export async function transformParties(parties: PartyData[]) {
  return parties.map(p => ({
    id: p.id,
    acronym: p.acronym,
    name: p.name,
    color: p.color,
    // ✅ Safe: Adding a new optional field
    website: p.website || null,
  }));
}
```

**Example risky change (requires approval):**
```typescript
// ❌ Risky: Changing ID mapping logic
// This affects downstream steps - requires careful testing
```

### 2. Work Score Calculation

**Why critical:** This determines deputy grades and rankings. Formula changes affect all deputies.

**Locations:**
- Database function: `supabase/migrations/*_functions.sql` → `calculate_work_score()`
- TypeScript helper: `apps/watcher/src/data-consistency/helpers.ts` → `calculateWorkScore()`
- Shared types: `packages/shared/src/types.ts` (for UI display)

**Guidelines:**
- Keep database function and TypeScript helper in sync
- Update both when changing the formula
- Add tests for edge cases (null values, zero averages, outliers)
- Document formula changes in PR description

**Current formula:**
```
Work Score = 
  40% attendance_rate +
  30% (proposals / avg_proposals) * 100 (capped at 200%) +
  20% (interventions / avg_interventions) * 100 (capped at 200%) +
  10% (questions / avg_questions) * 100 (capped at 200%)
```

### 3. Database Schema (`supabase/migrations/`)

**Why critical:** Schema changes affect production data and require migrations.

**Guidelines:**
- Always create migrations for schema changes
- Test migrations locally: `npx supabase db reset`
- Never modify existing migrations (create new ones)
- Document breaking changes in migration comments

### 4. Shared Types (`packages/shared/`)

**Why critical:** Changes affect both `watcher` and `web` apps.

**Guidelines:**
- Test changes in both apps
- Avoid breaking changes (use optional fields, versioning)
- Update TypeScript references if needed

---

## Common Tasks

### Adding a New Transform Step

1. Create `apps/watcher/src/transform/your-step.ts`
2. Export main function: `export async function transformYourData(...)`
3. Add to pipeline in `apps/watcher/src/transform/index.ts`
4. Add tests: `apps/watcher/src/transform/your-step.test.ts`
5. Create migration if new tables needed

**Example:**
```typescript
// apps/watcher/src/transform/your-step.ts
export async function transformYourData(data: YourData[]): Promise<Map<string, string>> {
  // Transform logic
  const result = new Map();
  for (const item of data) {
    // Process item
  }
  return result;
}
```

### Adding Tests

**Watcher (Bun test):**
```typescript
// apps/watcher/src/transform/parties.test.ts
import { describe, it, expect } from 'bun:test';
import { transformParties } from './parties';

describe('transformParties', () => {
  it('should transform party data correctly', () => {
    const input = [{ id: 1, acronym: 'PS', name: 'Partido Socialista' }];
    const result = transformParties(input);
    expect(result.get(1)).toBe('PS');
  });
});
```

**Web (Vitest + Testing Library):**
```typescript
// apps/web/src/components/ReportCard/GradeCircle.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradeCircle } from './GradeCircle';

describe('GradeCircle', () => {
  it('should display grade A correctly', () => {
    render(<GradeCircle grade="A" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
```

### Writing Good PR Descriptions

**Structure:**
1. **Summary** - One sentence describing what changed
2. **Context / Motivation** - Why this change is needed
3. **Implementation Details** - How it works, key design decisions
4. **Affected Apps/Packages** - watcher, web, shared, supabase, or multiple
5. **Risks / Trade-offs** - Breaking changes, performance, data consistency
6. **Testing** - What was tested, test coverage added

**Example:**
```markdown
## Summary
Adds incremental attendance scraping to reduce pipeline runtime.

## Context
Attendance scraping was taking 15+ minutes. This change only scrapes new meetings since last run.

## Implementation Details
- Added `last_scraped_at` tracking in `plenary_meetings` table
- Modified `fetchAllAttendance()` to skip meetings already in database
- Added migration to backfill `last_scraped_at` for existing meetings

## Affected Apps/Packages
- `apps/watcher` (attendance scraper, transform step)
- `supabase/migrations` (new migration)

## Risks / Trade-offs
- Low risk: Only affects scraping logic, not data transformation
- Migration is safe (adds nullable column, backfills data)

## Testing
- ✅ Unit tests added for incremental logic
- ✅ Manual test: Ran pipeline twice, second run skipped existing meetings
- ✅ Verified data consistency (attendance counts unchanged)
```

---

## Examples: Good vs Bad Prompts

### ✅ Good Prompts

**Specific and actionable:**
- "Add unit tests for `transformParties()` function in `apps/watcher/src/transform/parties.ts`. Test edge cases: empty array, duplicate IDs, missing required fields."
- "Refactor `DeputyCard` component: extract `GradeCircle` into `apps/web/src/components/ReportCard/GradeCircle.tsx`, add tests, update imports."
- "Update `ARCHITECTURE.md` to document the incremental attendance scraping logic added in PR #123."

**Clear scope:**
- "Fix TypeScript error in `apps/web/src/services/reportCard/useDeputy.ts` line 45: `deputy` may be null."
- "Add error handling to `apps/watcher/src/fetcher.ts` for network timeouts (retry 3 times with exponential backoff)."

### ❌ Bad Prompts

**Too vague:**
- "Fix the transform" (which transform? what's wrong?)
- "Make the UI better" (what needs improvement? which page?)
- "Add tests" (for what? where?)

**Too broad:**
- "Refactor everything" (breaks down into many smaller tasks)
- "Optimize the pipeline" (which part? what's the goal?)

**Missing context:**
- "Fix the bug" (what bug? where?)
- "Update the function" (which function? what change?)

---

## Testing Patterns

### Arrange-Act-Assert

```typescript
describe('transformParties', () => {
  it('should handle empty input', () => {
    // Arrange
    const input: PartyData[] = [];
    
    // Act
    const result = transformParties(input);
    
    // Assert
    expect(result.size).toBe(0);
  });
});
```

### Test One Thing Per Test

```typescript
// ✅ Good: One test, one assertion
it('should map party ID to acronym', () => {
  const result = transformParties([{ id: 1, acronym: 'PS' }]);
  expect(result.get(1)).toBe('PS');
});

// ❌ Bad: Multiple unrelated assertions
it('should transform parties correctly', () => {
  // Tests ID mapping
  // Tests acronym handling
  // Tests color parsing
  // Too many things!
});
```

### Use Fixtures for Common Setup

```typescript
// apps/watcher/src/transform/__fixtures__/parties.ts
export const mockParties = [
  { id: 1, acronym: 'PS', name: 'Partido Socialista', color: '#FF0000' },
  { id: 2, acronym: 'PSD', name: 'Partido Social Democrata', color: '#0000FF' },
];

// In test file
import { mockParties } from './__fixtures__/parties';
```

### Avoid Silent-Pass Anti-Patterns

A test that passes when broken is worse than no test — it manufactures
false confidence. Watch for these patterns and prefer `it.skipIf` or
explicit assertions instead.

```typescript
// ❌ Bad: silent pass when env not configured
it('queries deputies', async () => {
  if (!supabase) return; // ← test reports as PASS with zero assertions
  const { data } = await supabase.from('deputies').select();
  expect(data?.length).toBeGreaterThan(0);
});

// ✅ Good: skip is loud, pass means assertions ran
const hasSupabase = await isSupabaseReachable();
it.skipIf(!hasSupabase)('queries deputies', async () => {
  const { data } = await supabase.from('deputies').select();
  expect(data?.length).toBeGreaterThan(0);
});
```

```typescript
// ❌ Bad: comparing full URL to relative path is always truthy
expect(page.url() !== '/what-happened').toBeTruthy();

// ❌ Bad: getByRole/getByText already throws if not found,
// then .toBeTruthy() adds nothing — and worse, in non-strict mode
// can match unrelated elements
expect(screen.getByText('A')).toBeTruthy();

// ✅ Good: explicit visibility / title / count assertions
await expect(page).toHaveTitle(/Página não encontrada/i);
await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
```

```typescript
// ❌ Bad: conditional assertion — silently passes if data is missing
if ((await badge.count()) > 0) {
  expect(await badge.first().textContent()).not.toContain('ª');
}

// ✅ Good: assert presence first, then content
await expect(badge.first()).toBeVisible();
expect(await badge.first().textContent()).not.toContain('ª');
```

### Beware Eager Imports When Extracting Constants

When a module has top-level side effects (e.g. `apps/watcher/src/supabase.ts`
throws if env vars are missing), don't add new exports to it for tests to
import — the import alone triggers the side effect. Extract to a sibling
module instead.

```typescript
// ❌ Bad: tests now load supabase just to read color constants
// parties.ts
import { supabase } from '../supabase.js'; // throws without env
export const PARTY_COLORS = { ... };
export async function transformParties(...) { /* uses supabase */ }

// ✅ Good: pure constants live in a side-effect-free file
// parties-colors.ts ← no supabase import
export const PARTY_COLORS = { ... };
export function getPartyColor(acronym: string) { ... }

// parties.ts ← unchanged behavior, re-exports for backwards compat
import { supabase } from '../supabase.js';
import { getPartyColor } from './parties-colors.js';
export { PARTY_COLORS, getPartyColor } from './parties-colors.js';
```

### E2E Regression Tests for Bug Fixes

**Location:** Add tests to the appropriate thematic spec file in `apps/web/e2e/`:

- `home.spec.ts` - Homepage-related bugs
- `navigation.spec.ts` - Navigation and page accessibility bugs
- `leaderboard.spec.ts` - Ranking page bugs
- `postal-codes.spec.ts` - Postal code mapping bugs
- `parties.spec.ts` - Party page bugs

When fixing user-reported bugs, **always add an E2E regression test** to prevent the bug from returning:

```typescript
// Issue #116: Postal code 3700 shows wrong district
// @see https://github.com/bcamarneiro/adamastor/issues/116
test('postal code 3700 should map to Aveiro district', async ({ page }) => {
  await page.goto('/');
  // ... test implementation
});
```

**Pattern:**

1. Add a comment with `// Issue #XX: Title` and `// @see <github-url>`
2. Test the specific user flow that was broken
3. Skip tests gracefully if prerequisite UI elements don't exist

**Bug-fixing workflow checklist:**

- [ ] Fix the bug
- [ ] Add E2E test to the appropriate spec file referencing the issue
- [ ] Verify test passes locally: `cd apps/web && npx playwright test <spec-file>`
- [ ] Create PR targeting `staging` and linking to the issue

### E2E Data Contract Testing

**Location:** `apps/web/e2e/data-contracts/`

Data contract tests validate that **rendered UI data matches API/database responses**. Unlike traditional E2E tests that only check element existence, these tests ensure data accuracy and prevent silent data transformation bugs.

#### What Are Data Contract Tests?

Data contract tests verify:
1. **API schema correctness** - Response data has expected structure and types
2. **UI rendering accuracy** - Displayed data matches API response
3. **Data transformation integrity** - No bugs between API → UI

**Example bug prevented:**
```typescript
// API returns: { name: "João Silva", rank: 42 }
// UI displays: "João Silva #24" ← BUG! Rank reversed
// Data contract test catches this mismatch immediately
```

#### The Pattern: Intercept → Validate → Compare

All data contract tests follow this 4-step pattern:

```typescript
import { expect, test } from '../fixtures';
import { DeputySchema, validateArray } from '../helpers/schemas';

test('leaderboard renders deputy data correctly', async ({ page }) => {
  // Step 1: Intercept API call and capture response
  let apiDeputies: any[] = [];
  await page.route('**/rest/v1/deputies*', async (route) => {
    const response = await route.fetch();
    apiDeputies = await response.json();
    await route.fulfill({ response });
  });

  // Step 2: Navigate to page and wait for data load
  await page.goto('/ranking');
  await page.waitForLoadState('networkidle');

  // Step 3: Skip gracefully if no data
  if (!apiDeputies || apiDeputies.length === 0) {
    test.skip();
    return;
  }

  // Step 4: Validate API schema
  validateArray(apiDeputies, DeputySchema, 1);

  // Step 5: Validate UI renders API data (sample-based: 3-5 items)
  const sampleSize = Math.min(3, apiDeputies.length);
  for (let i = 0; i < sampleSize; i++) {
    const deputy = apiDeputies[i];
    const card = page.locator('[data-testid="deputy-card"]').nth(i);

    // Verify name matches
    await expect(card.locator('h3')).toContainText(deputy.name);

    // Verify rank matches
    await expect(card).toContainText(`#${deputy.national_rank}`);

    // Verify grade matches
    await expect(card).toContainText(deputy.grade);
  }
});
```

#### Key Pattern Elements

**1. API Interception (Playwright route)**
```typescript
await page.route('**/rest/v1/deputies*', async (route) => {
  const response = await route.fetch();  // Make real API call
  apiData = await response.json();       // Capture response
  await route.fulfill({ response });     // Pass to page
});
```

**2. Graceful Degradation**
```typescript
// Always skip if data unavailable (prevents flaky failures)
if (!apiData || apiData.length === 0) {
  test.skip();
  return;
}
```

**3. Sample-Based Validation**
```typescript
// Validate 3-5 items instead of all (faster, still catches bugs)
const sampleSize = Math.min(3, apiData.length);
for (let i = 0; i < sampleSize; i++) {
  // ... validate item ...
}
```

**4. Wait for Network Idle**
```typescript
// Ensure all API calls complete before validation
await page.goto('/ranking');
await page.waitForLoadState('networkidle'); // Critical!
```

#### Schema Validators

**Location:** `apps/web/e2e/helpers/schemas.ts`

Schema validators ensure API responses have correct structure and types:

```typescript
// Available validators:
import {
  DeputySchema,        // Deputies list/detail
  PartySchema,         // Party data
  DistrictSchema,      // District data
  InitiativeSchema,    // Initiatives/proposals
  DeputyStatsSchema,   // Deputy statistics
  validateArray,       // Array validator helper
} from '../helpers/schemas';

// Usage:
DeputySchema.validate(deputy);           // Basic fields
DeputySchema.validateWithStats(deputy);  // With stats join
validateArray(deputies, DeputySchema);   // Validate array (samples first 3)
```

**Example validator implementation:**
```typescript
export const DeputySchema = {
  validate(deputy: unknown) {
    // Required fields
    expect(deputy).toHaveProperty('id');
    expect(deputy).toHaveProperty('name');
    expect(deputy).toHaveProperty('external_id');
    expect(deputy).toHaveProperty('is_active');

    // Type checks
    expect(typeof (deputy as any).id).toBe('string');
    expect(typeof (deputy as any).name).toBe('string');
    expect(typeof (deputy as any).is_active).toBe('boolean');
  },

  validateWithStats(deputy: unknown) {
    this.validate(deputy);

    // Stats fields (from deputy_stats join)
    if ((deputy as any).national_rank !== undefined) {
      expect(typeof (deputy as any).national_rank).toBe('number');
    }
    if ((deputy as any).grade !== undefined) {
      expect((deputy as any).grade).toMatch(/^[A-F]$/);
    }
  },
};
```

#### Supabase API Patterns

Adamastor uses Supabase's REST API with this URL pattern:

```
**/rest/v1/{table}*
```

**Common endpoints:**
- `**/rest/v1/deputies*` - Deputies list/detail
- `**/rest/v1/parties*` - Parties list
- `**/rest/v1/districts*` - Districts list
- `**/rest/v1/initiatives*` - Initiatives/proposals
- `**/rest/v1/deputy_stats*` - Deputy statistics

**Query parameters:**
```typescript
// Supabase adds query params (select, order, filters)
// Example: /rest/v1/deputies?select=*,deputy_stats(*)&order=national_rank.asc
// Pattern matches: **/rest/v1/deputies* (wildcard catches all variations)
```

#### Test Organization

Tests are organized by page/feature:

```
apps/web/e2e/data-contracts/
├── README.md                    # Quick reference guide
├── schema-validation.spec.ts    # Leaderboard validation (current)
├── homepage.spec.ts             # Homepage featured deputies (future)
├── deputy-profile.spec.ts       # Individual deputy pages (future)
├── parties.spec.ts              # Party pages (future)
├── districts.spec.ts            # District pages (future)
├── initiatives.spec.ts          # Initiatives/proposals (future)
└── search.spec.ts               # Search results (future)
```

**Current coverage (as of Jan 2026):**
- ✅ Leaderboard (`/ranking`) - Deputy rankings validation

**Future coverage planned:**
- ⏳ Homepage (`/`) - Featured deputies
- ⏳ Deputy Profile (`/deputado/:id`) - Individual deputy data
- ⏳ Parties (`/partidos`) - Party aggregations
- ⏳ Districts (`/distritos`) - District comparisons
- ⏳ Initiatives (`/iniciativas`) - Proposals and voting
- ⏳ Search - Search results validation

#### Maintenance Guide

**When API schema changes:**

1. **Update schema validators** in `apps/web/e2e/helpers/schemas.ts`
   ```typescript
   // Example: Adding new field to DeputySchema
   export const DeputySchema = {
     validate(deputy: unknown) {
       // ... existing validations ...

       // Add new field validation
       if ((deputy as any).photo_url) {
         expect(typeof (deputy as any).photo_url).toBe('string');
       }
     },
   };
   ```

2. **Update affected test files** in `apps/web/e2e/data-contracts/`
   ```typescript
   // Add new field validation to test
   await expect(card.locator('img')).toHaveAttribute('src', deputy.photo_url);
   ```

3. **Run tests locally** to verify changes
   ```bash
   cd apps/web
   npx playwright test data-contracts/
   ```

4. **Commit with descriptive message**
   ```bash
   git add apps/web/e2e/helpers/schemas.ts apps/web/e2e/data-contracts/*.spec.ts
   git commit -m "test(e2e): update data contract tests for photo_url field"
   ```

**Adding new data contract tests:**

1. **Create new spec file** following naming convention
   ```bash
   # Example: Testing party page
   touch apps/web/e2e/data-contracts/parties.spec.ts
   ```

2. **Follow the established pattern** (see example above)
   - Import fixtures and schemas
   - Intercept API call
   - Navigate and wait for networkidle
   - Skip if no data
   - Validate schema
   - Validate rendered UI (sample 3-5 items)

3. **Add data-testid attributes** to components if needed
   ```tsx
   // In component file
   <div data-testid="party-card">
     <h3 data-testid="party-name">{party.name}</h3>
   </div>
   ```

4. **Test locally** before committing
   ```bash
   npx playwright test data-contracts/parties.spec.ts
   ```

5. **Verify in CI** after pushing

#### Running Tests

```bash
# Run all data contract tests
cd apps/web
npx playwright test data-contracts/

# Run specific test file
npx playwright test data-contracts/schema-validation.spec.ts

# Run in UI mode for debugging
npx playwright test --ui data-contracts/

# Show browser during test (headed mode)
npx playwright test --headed data-contracts/schema-validation.spec.ts

# Run with verbose output
npx playwright test --reporter=list data-contracts/
```

#### Common Issues & Solutions

**Issue: Test timeout**
```typescript
// Problem: Test times out waiting for networkidle
await page.goto('/ranking');
await page.waitForLoadState('networkidle'); // Times out after 30s

// Solution 1: Increase timeout
test.setTimeout(90000); // 90 seconds

// Solution 2: Use 'load' instead of 'networkidle' (less strict)
await page.waitForLoadState('load');

// Solution 3: Wait for specific selector
await page.waitForSelector('[data-testid="deputy-card"]');
```

**Issue: Selector not found**
```typescript
// Problem: Element not found
const card = page.locator('[data-testid="deputy-card"]').first();
await expect(card).toBeVisible(); // Fails

// Solution: Add data-testid attribute to component
// In component file (e.g., DeputyCard.tsx):
<div data-testid="deputy-card">
  {/* ... */}
</div>
```

**Issue: API pattern doesn't match**
```typescript
// Problem: API call not intercepted
await page.route('**/rest/v1/deputies', async (route) => { ... });
//                                    ^ Missing wildcard!

// Solution: Add wildcard to match query params
await page.route('**/rest/v1/deputies*', async (route) => { ... });
//                                     ^ Wildcard matches all params
```

**Issue: Schema validation fails**
```typescript
// Problem: Unexpected field type
expect(typeof deputy.rank).toBe('number'); // Fails: rank is string

// Solution: Check actual API response and update validator
// Use console.log to debug:
console.log('Deputy data:', JSON.stringify(deputy, null, 2));

// Update schema validator to match reality:
expect(typeof deputy.rank).toBe('string'); // Correct
```

**Issue: Flaky test (sometimes passes, sometimes fails)**
```typescript
// Problem: Race condition - data loads after validation starts
await page.goto('/ranking');
const card = page.locator('[data-testid="deputy-card"]').first();
await expect(card).toContainText(deputy.name); // Sometimes fails

// Solution: Wait for network idle before validation
await page.goto('/ranking');
await page.waitForLoadState('networkidle'); // Ensures data loaded
const card = page.locator('[data-testid="deputy-card"]').first();
await expect(card).toContainText(deputy.name); // More reliable
```

#### Known Limitations

1. **Sample-based validation only**
   - Tests validate 3-5 items per page, not full dataset
   - Trade-off: Speed vs completeness
   - Catches most bugs (95%+) while keeping tests fast (<60s)

2. **Network timing sensitivity**
   - Tests may be slower on CI or slow connections
   - Mitigated by `networkidle` wait and timeouts

3. **Data freshness dependency**
   - Tests assume staging/production data is valid
   - Invalid source data causes test failures
   - Consider seeding known test data for critical flows

4. **Hard-coded API patterns**
   - Supabase REST API patterns (`/rest/v1/`) are hard-coded
   - If API architecture changes, all tests need updates
   - Consider extracting patterns to shared config

5. **Component selector coupling**
   - Tests depend on `data-testid` attributes
   - Removing attributes breaks tests
   - Document required test IDs in component props

6. **Browser-specific**
   - Tests run in Chromium by default
   - Not tested across all browsers (Firefox, WebKit)
   - Unlikely to have browser-specific data rendering bugs

7. **No real-time validation**
   - Tests capture API response at page load only
   - Don't validate dynamic updates or websocket data
   - Consider adding tests for real-time features if needed

#### Best Practices

1. **Always use `test.skip()` for graceful degradation**
   ```typescript
   if (!apiData || apiData.length === 0) {
     test.skip(); // Better than failing
     return;
   }
   ```

2. **Use `data-testid` for stable selectors**
   ```tsx
   // ✅ Good - stable selector
   <div data-testid="deputy-card">

   // ❌ Bad - fragile selector
   <div className="bg-white rounded-lg shadow">
   ```

3. **Validate types, not just values**
   ```typescript
   // ✅ Good - validates structure
   expect(typeof deputy.rank).toBe('number');

   // ❌ Bad - only validates specific value
   expect(deputy.rank).toBe(42);
   ```

4. **Keep tests fast with sample-based validation**
   ```typescript
   // ✅ Good - validate 3 items
   for (let i = 0; i < Math.min(3, data.length); i++)

   // ❌ Bad - validate all 230 items (slow!)
   for (const item of data)
   ```

5. **Document API patterns in comments**
   ```typescript
   // Matches: /rest/v1/deputies?select=*&order=rank
   await page.route('**/rest/v1/deputies*', ...)
   ```

6. **Use schema validators consistently**
   ```typescript
   // ✅ Good - reusable validation
   DeputySchema.validate(deputy);

   // ❌ Bad - ad-hoc validation (not reusable)
   expect(deputy).toHaveProperty('name');
   expect(deputy).toHaveProperty('rank');
   ```

#### Debugging Tips

**View captured API data:**
```typescript
let apiData;
await page.route('**/rest/v1/deputies*', async (route) => {
  const response = await route.fetch();
  apiData = await response.json();
  console.log('API Response:', JSON.stringify(apiData, null, 2));
  await route.fulfill({ response });
});
```

**Pause test execution:**
```typescript
await page.goto('/ranking');
await page.pause(); // Opens Playwright Inspector
```

**Screenshot on failure:**
```typescript
// Auto-captured by Playwright
// Location: test-results/{test-name}/test-failed-1.png
```

**Network logs:**
```bash
# See all network requests
DEBUG=pw:api npx playwright test data-contracts/
```

#### References

- **Data Contract Tests README**: `apps/web/e2e/data-contracts/README.md`
- **Schema Validators**: `apps/web/e2e/helpers/schemas.ts`
- **Playwright Network API**: https://playwright.dev/docs/network
- **Epic #168**: https://github.com/bcamarneiro/adamastor/issues/168
- **Supabase REST API**: https://supabase.com/docs/guides/api

---

## Monorepo-Specific Patterns

### Running Commands

```bash
# App-specific
bun --filter watcher test
bun --filter web build

# Root-level (all apps)
bun lint
bun typecheck
```

### Cross-App Dependencies

When changing `packages/shared/`:
1. Make the change
2. Test in watcher: `bun --filter watcher test`
3. Test in web: `bun --filter web test`
4. Build both: `bun --filter '*' build`

### TypeScript Project References

The monorepo uses TypeScript project references. When adding new files:
- Ensure `tsconfig.json` includes the new files
- Run `bun typecheck` to verify references are correct

---

## Security & Secrets

**Never commit:**
- API keys
- Database credentials
- Service account tokens
- Private keys
- `.env` files (they're in `.gitignore`, but double-check)

**Use environment variables:**
```typescript
// ✅ Good
const apiKey = process.env.PARLIAMENT_API_KEY;

// ❌ Bad
const apiKey = 'sk_live_abc123...';
```

---

## Getting Help

- **Architectural patterns**: See [docs/architecture/](architecture/) (ADRs for monorepo, React patterns, Supabase, testing)
- **Project structure and data flow**: See [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Setup issues**: See [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Testing guidance**: See [docs/TESTING.md](TESTING.md)
- **GitHub Discussions**: For general questions
- **GitHub Issues**: For bugs and feature requests

---

## Summary Checklist

Before submitting a PR with AI assistance:

- [ ] Changes are small and focused
- [ ] Tests added/updated (if behavior changed)
- [ ] Documentation updated (if needed)
- [ ] No secrets committed
- [ ] Both apps tested (if touching shared code)
- [ ] PR description is clear and complete
- [ ] CI passes (`bun lint`, `bun typecheck`, `bun test`)

---

**Remember:** AI agents are powerful collaborators, but they need clear guidance. Be specific, test thoroughly, and document your changes well.


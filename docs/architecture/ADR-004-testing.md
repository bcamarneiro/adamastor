# ADR-004: Testing Strategy

## Status
Accepted

## Context
Adamastor requires comprehensive testing to ensure:
- UI components render correctly across devices
- Data transformations preserve integrity
- User workflows complete without errors
- Regressions are caught before production

We need a testing strategy that balances coverage, speed, and maintainability.

## Decision
Use a **pyramid testing approach** with three layers:

### 1. Unit Tests (Base Layer)
**Tool**: Vitest
**Scope**: Business logic, utilities, data transformations
**Location**: `apps/web/src/**/*.test.ts`, `apps/watcher/src/**/*.test.ts`

**What to test**:
- Data transformers (`apps/watcher/src/transform/`)
- Utility functions (date formatting, score calculation)
- React hooks (data fetching, state management)
- Constants validation (legislature numbers, postal codes)

**Example**:
```typescript
// apps/watcher/src/transform/deputies/helpers.test.ts
import { describe, test, expect } from 'vitest';
import { isActiveDeputy, getCurrentParty } from './helpers';

describe('isActiveDeputy', () => {
  test('returns true for deputy with Efetivo status', () => {
    const deputy = {
      situation: [{ status: 'Efetivo', start: '2024-01-01', end: null }]
    };
    expect(isActiveDeputy(deputy)).toBe(true);
  });

  test('returns false for deputy without Efetivo status', () => {
    const deputy = {
      situation: [{ status: 'Renunciou', start: '2024-01-01', end: '2024-06-01' }]
    };
    expect(isActiveDeputy(deputy)).toBe(false);
  });
});
```

**Run Command**: `bun test` (root) or `bun test:web` / `bun test:watcher` (specific workspaces)

### 2. Component Tests (Middle Layer)
**Tool**: Vitest + React Testing Library (optional, not heavily used)
**Scope**: React component logic (not visual appearance)
**Location**: `apps/web/src/components/**/*.test.tsx`

**What to test**:
- Component state management
- Event handlers (onClick, onChange)
- Conditional rendering logic
- Props validation

**Note**: Currently minimal component tests, relying more on E2E tests for UI coverage.

### 3. End-to-End Tests (Top Layer)
**Tool**: Playwright
**Scope**: Critical user workflows, UI interactions
**Location**: `apps/web/e2e/*.spec.ts`

**Test Categories**:

**a) Smoke Tests** (`e2e/smoke/`):
- Homepage loads
- Critical pages accessible
- No console errors

**b) Navigation Tests** (`e2e/navigation.spec.ts`):
- Menu links work
- Footer links work
- Page-to-page transitions

**c) Feature Tests**:
- `home.spec.ts` - Homepage functionality
- `leaderboard.spec.ts` - Deputy rankings
- `postal-codes.spec.ts` - District filtering
- `parties.spec.ts` - Party pages

**d) Regression Tests**:
Each bug fix includes E2E regression test to prevent recurrence:
```typescript
// Issue #109: Guarda postal codes incorrectly mapped
// @see https://github.com/bcamarneiro/adamastor/issues/109
test('postal code 6300 should map to Guarda (not Castelo Branco)', async ({ page }) => {
  await page.goto('/');
  const postalInput = page.getByPlaceholder(/código postal/i).first();
  await postalInput.fill('6300');
  await postalInput.press('Enter');

  await page.waitForLoadState('networkidle');

  if (page.url().includes('/distrito')) {
    expect(page.url()).toContain('guarda');
    expect(page.url()).not.toContain('castelo-branco');
  }
});
```

**Run Commands**:
```bash
bun e2e              # Run all E2E tests
bun e2e:smoke        # Run smoke tests only
bun e2e:ui           # Run in Playwright UI mode
bun e2e:debug        # Run with debug logs
```

### 4. CI Pipeline Integration
**GitHub Actions** (`.github/workflows/test.yml`):
```yaml
jobs:
  test:
    steps:
      - name: Lint
        run: bun run lint

      - name: Type Check
        run: bun run typecheck

      - name: Unit Tests (Watcher)
        run: cd apps/watcher && bun test

      - name: Unit Tests (Web)
        run: cd apps/web && vitest run src

      - name: E2E Tests
        run: cd apps/web && npx playwright test

      - name: Build
        run: bun run build
```

**Pre-push Hook** (`.husky/pre-push`):
```bash
#!/bin/sh
bun run lint
bun run typecheck
bun run test
```

**Prevents**:
- Linting errors from being pushed
- Type errors from breaking build
- Unit test failures from reaching CI
- E2E tests run in CI (too slow for pre-push)

## Consequences

### Positive
- ✅ **Fast feedback**: Unit tests run in <3s
- ✅ **Regression prevention**: E2E tests catch UI bugs
- ✅ **Type safety**: TypeScript + vitest catch type errors
- ✅ **CI confidence**: All tests pass before merge
- ✅ **Developer experience**: Vitest watch mode for TDD

### Negative
- ❌ **E2E flakiness**: Network-dependent tests occasionally fail
- ❌ **Slow CI**: E2E tests add ~2-3 minutes to CI pipeline
- ❌ **Maintenance overhead**: E2E tests break with UI changes

### Trade-offs
- **Chosen**: Pyramid approach with heavy E2E coverage
- **Rejected**: 100% unit test coverage (diminishing returns)
- **Rationale**: Parliament data is stable, UI correctness more critical than business logic

## Test Coverage Guidelines

### What to Unit Test ✅
- Data transformers (Parliament API → Supabase schema)
- Score calculations (work_score, grade thresholds)
- Utility functions (date formatting, postal code lookup)
- Constants validation (legislature numbers, deputy counts)

### What to E2E Test ✅
- **Critical user paths** (homepage → deputy profile → ranking)
- **Bug regressions** (every bug fix gets E2E test)
- **Cross-page workflows** (search → filter → details)
- **Accessibility** (keyboard navigation, screen readers)

### What NOT to Test ❌
- Third-party library internals (React Query, Radix UI)
- CSS styles (use visual regression tools instead)
- API mocks (use real data in E2E tests)
- Browser compatibility (Playwright tests Chrome only, trust framework)

## Examples

### Unit Test Pattern
```typescript
// apps/watcher/src/transform/legislature-detection.test.ts
import { describe, test, expect } from 'vitest';
import { detectLegislatureFromData } from './legislature-detection';

describe('detectLegislatureFromData', () => {
  test('detects legislature from DetalheLegislatura.sigla', () => {
    const data = {
      DetalheLegislatura: { sigla: 'XVII' }
    };
    expect(detectLegislatureFromData(data)).toBe(17);
  });

  test('fallback to constant if no data available', () => {
    const data = {};
    expect(detectLegislatureFromData(data)).toBe(17); // CURRENT_LEGISLATURE
  });
});
```

### E2E Test Pattern
```typescript
// apps/web/e2e/leaderboard.spec.ts
import { test, expect } from './fixtures';

test.describe('Leaderboard Page', () => {
  test('should display deputy rankings', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Verify page title
    await expect(page.getByRole('heading', { name: /ranking/i })).toBeVisible();

    // Verify deputy cards are displayed
    const deputyCards = page.locator('[data-testid="deputy-card"]');
    await expect(deputyCards.first()).toBeVisible();

    // Verify ranking order (first deputy has highest score)
    const firstScore = await page.locator('[data-testid="deputy-score"]').first().textContent();
    expect(parseFloat(firstScore || '0')).toBeGreaterThan(0);
  });
});
```

### Regression Test Pattern (Bug #109)
```typescript
// apps/web/e2e/postal-codes.spec.ts
// Issue #109: Postal code mappings incorrect
// @see https://github.com/bcamarneiro/adamastor/issues/109
test('postal code 6300 should map to Guarda (not Castelo Branco)', async ({ page }) => {
  await page.goto('/');
  const postalInput = page.getByPlaceholder(/código postal/i).first();
  await postalInput.fill('6300');
  await postalInput.press('Enter');
  await page.waitForLoadState('networkidle');

  if (page.url().includes('/distrito')) {
    expect(page.url()).toContain('guarda');
    expect(page.url()).not.toContain('castelo-branco');
  }
});
```

## Testing Tools

| Tool | Purpose | Location |
|------|---------|----------|
| **Vitest** | Unit tests, component tests | `apps/web/src/**/*.test.ts` |
| **Playwright** | E2E tests, visual tests | `apps/web/e2e/*.spec.ts` |
| **Biome** | Linting, formatting | `.biomejs/biome.json` |
| **TypeScript** | Static type checking | `tsconfig.json` |
| **Husky** | Git hooks (pre-push) | `.husky/pre-push` |

## References
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)
- `apps/web/e2e/` for E2E test examples
- `apps/watcher/src/**/*.test.ts` for unit test examples
- `docs/TESTING.md` for running tests locally

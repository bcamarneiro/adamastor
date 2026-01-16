# Data Contract Tests

This directory contains E2E tests that validate **data contracts** - ensuring that data from the API matches what's rendered in the UI.

## What Are Data Contract Tests?

Data contract tests verify that:
1. The API returns correctly shaped data (schema validation)
2. The UI renders the data it receives from the API
3. No data transformation bugs exist between API → UI

Unlike traditional E2E tests that just check "page loaded" or "button clicked", data contract tests intercept API calls and compare response data to rendered content.

## Pattern

All data contract tests follow this pattern:

```typescript
import { expect, test } from '../fixtures';
import { DeputySchema, validateArray } from '../helpers/schemas';

test('page renders API data correctly', async ({ page }) => {
  // 1. Intercept API call and capture response
  let apiData;
  await page.route('**/rest/v1/deputies*', async (route) => {
    const response = await route.fetch();
    apiData = await response.json();
    await route.fulfill({ response });
  });

  // 2. Navigate to page
  await page.goto('/ranking');
  await page.waitForLoadState('networkidle');

  // 3. Validate API response schema
  validateArray(apiData, DeputySchema, 1);

  // 4. Validate UI renders API data (sample-based, 3-5 items)
  for (let i = 0; i < Math.min(3, apiData.length); i++) {
    const deputy = apiData[i];
    const card = page.locator('[data-testid="deputy-card"]').nth(i);

    await expect(card.locator('h3')).toContainText(deputy.name);
    await expect(card).toContainText(`#${deputy.national_rank}`);
  }
});
```

## Schema Validators

Available validators in [`../helpers/schemas.ts`](../helpers/schemas.ts):

- **DeputySchema**: Validates deputy objects from `/rest/v1/deputies`
- **PartySchema**: Validates party objects from `/rest/v1/parties`
- **DistrictSchema**: Validates district objects from `/rest/v1/districts`
- **InitiativeSchema**: Validates initiative objects from `/rest/v1/initiatives`
- **DeputyStatsSchema**: Validates deputy_stats joins

Each validator checks:
- Required fields exist
- Field types are correct
- Optional fields are validated if present

## API Interception

### Supabase REST API Pattern

Adamastor uses Supabase's REST API with this URL pattern:
```
**/rest/v1/{table}*
```

Common endpoints:
- `**/rest/v1/deputies*` - Deputies list/detail
- `**/rest/v1/parties*` - Parties list
- `**/rest/v1/districts*` - Districts list
- `**/rest/v1/initiatives*` - Initiatives/proposals

### Interception Example

```typescript
// Capture API response
let apiDeputies;
await page.route('**/rest/v1/deputies*', async (route) => {
  const response = await route.fetch();
  apiDeputies = await response.json();
  await route.fulfill({ response });
});
```

**Key points:**
- `page.route()` intercepts network requests
- `route.fetch()` makes the actual request
- `route.fulfill()` passes the response to the page
- We capture `apiDeputies` for validation

## Sample-Based Validation

We validate **3-5 items** instead of all items:
- Faster test execution
- Catches most data transformation bugs
- Reduces flakiness

```typescript
// Validate first 3 deputies
const sampleSize = Math.min(3, apiData.length);
for (let i = 0; i < sampleSize; i++) {
  const deputy = apiData[i];
  const card = page.locator('[data-testid="deputy-card"]').nth(i);
  // ... validate card matches deputy ...
}
```

## Graceful Degradation

Tests should skip gracefully when data is unavailable:

```typescript
test('homepage featured deputies', async ({ page }) => {
  let apiData;
  await page.route('**/rest/v1/deputies*', async (route) => {
    const response = await route.fetch();
    apiData = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiData || apiData.length === 0) {
    test.skip();
    return;
  }

  // ... validate data ...
});
```

## Test Organization

Tests are organized by page:
- `homepage.spec.ts` - Homepage featured content
- `leaderboard.spec.ts` - Rankings page
- `deputy-profile.spec.ts` - Individual deputy pages
- `parties.spec.ts` - Party pages
- `districts.spec.ts` - District pages
- `initiatives.spec.ts` - Initiatives/proposals
- `search.spec.ts` - Search results

## Running Tests

```bash
# Run all data contract tests
cd apps/web
npx playwright test data-contracts/

# Run specific page tests
npx playwright test data-contracts/leaderboard.spec.ts

# Run in UI mode for debugging
npx playwright test --ui data-contracts/

# Show browser during test
npx playwright test --headed data-contracts/leaderboard.spec.ts
```

## Debugging

### View API responses
```typescript
// Log captured data
console.log('API returned:', JSON.stringify(apiData, null, 2));
```

### Screenshot on failure
```typescript
// Auto-captured by Playwright on failure
// Located in: test-results/{test-name}/test-failed-1.png
```

### Slow down test
```typescript
await page.goto('/ranking', { waitUntil: 'networkidle' });
await page.pause(); // Opens Playwright Inspector
```

## Common Pitfalls

### 1. Forgetting `waitForLoadState`
```typescript
// ❌ Bad - may not be fully loaded
await page.goto('/ranking');
const card = page.locator('[data-testid="deputy-card"]').first();

// ✅ Good - wait for network idle
await page.goto('/ranking');
await page.waitForLoadState('networkidle');
const card = page.locator('[data-testid="deputy-card"]').first();
```

### 2. Not handling missing data
```typescript
// ❌ Bad - fails if no data
const deputy = apiData[0];
await expect(card).toContainText(deputy.name);

// ✅ Good - skip if no data
if (!apiData || apiData.length === 0) {
  test.skip();
  return;
}
```

### 3. Validating all items (slow)
```typescript
// ❌ Bad - validates 230 deputies
for (const deputy of apiData) {
  // ... validate ...
}

// ✅ Good - validates 3 deputies
for (let i = 0; i < Math.min(3, apiData.length); i++) {
  // ... validate ...
}
```

## References

- [Playwright API Interception](https://playwright.dev/docs/network#handle-requests)
- [Architecture Patterns](.claude/context/architecture.md)
- [AI Collaboration Guidelines](docs/AI_AGENTS.md)
- [Epic #168](https://github.com/bcamarneiro/adamastor/issues/168) - Data contract testing epic

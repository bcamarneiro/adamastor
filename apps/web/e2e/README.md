# E2E Tests

End-to-end tests using Playwright to verify critical user flows and functionality.

## Running Tests

### Local Development (Default)
Run tests against a local dev server:

```bash
# Start dev server
bun run dev

# In another terminal, run tests
cd apps/web
bun run e2e

# Or run with UI mode for debugging
bun run e2e:ui

# Or run in headed mode
bun run e2e:headed
```

### Against Local Build
Test the production build locally:

```bash
# Build the app
bun run build

# Run tests (will serve the dist folder automatically)
cd apps/web
bun run e2e
```

### Against Live Staging
Test the deployed staging environment:

```bash
cd apps/web
PLAYWRIGHT_BASE_URL=https://staging.adamastor.pt bun run e2e
```

### Against Custom URL
Test any deployment:

```bash
cd apps/web
PLAYWRIGHT_BASE_URL=https://your-preview-url.vercel.app bun run e2e
```

## CI/CD Integration

### Pull Requests
- E2E tests run automatically against local build with controlled test fixtures
- Uses local Supabase with seed data from `supabase/seed-e2e.sql`
- Fast, isolated, and predictable

### On-Demand Staging Tests
Run manually via GitHub Actions:
1. Go to Actions → "E2E Tests - Staging"
2. Click "Run workflow"
3. Optionally specify a custom staging URL

### Production Release Gate
- E2E tests run **automatically** against staging before production deployment
- Production release will **fail** if staging e2e tests fail
- Ensures staging is fully functional before promoting to production

## Test Philosophy

### Local Tests (PR CI)
- Use controlled test fixtures
- Fast and isolated
- Ideal for debugging and development
- Run against local Supabase with known data

### Live Tests (Staging/Production Gate)
- Test real deployed environment
- Verify deployment succeeded
- Catch environment-specific issues
- Work with real data (must be data-agnostic where possible)

## Writing Tests

### Data-Agnostic Tests
When writing tests that will run against live environments, make them resilient:

```typescript
// ❌ Bad - assumes specific data
test('should show deputy José Silva', async ({ page }) => {
  await expect(page.getByText('José Silva')).toBeVisible();
});

// ✅ Good - works with any data
test('should display deputy names', async ({ page }) => {
  const deputies = page.locator('[data-testid="deputy-name"]');
  await expect(deputies.first()).toBeVisible();
});
```

### Fixture-Dependent Tests
For tests that need specific test data:

```typescript
// These tests only run with local fixtures
test('postal code 3700 should map to Aveiro', async ({ page }) => {
  // This relies on seed-e2e.sql data
  // Will be skipped when PLAYWRIGHT_SKIP_FIXTURE_TESTS=true
});
```

## Debugging

### UI Mode (Recommended)
```bash
cd apps/web
bun run e2e:ui
```

### Headed Mode
```bash
cd apps/web
bun run e2e:headed
```

### Debug Mode
```bash
cd apps/web
bun run e2e:debug
```

### View Test Reports
After a test run:
```bash
cd apps/web
npx playwright show-report
```

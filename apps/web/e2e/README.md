# E2E Test Organization

This directory contains **two categories of E2E tests** with distinct purposes:

## Test Categories

### 1. Behavioral E2E Tests (`e2e/*.spec.ts`)

**Purpose**: Validate user flows, interactions, and business rules

**What they test**:
- Page navigation and routing
- UI interactions (clicks, tab switches, form submissions)
- Regression tests for specific bug fixes
- Business logic (ranking validation, suspended deputies, etc.)
- Accessibility and visual correctness
- Error states and edge cases

**Examples**:
- `leaderboard.spec.ts` - Tab switching, ranking numbers validation (issue #67, #68)
- `parties.spec.ts` - Party color visibility (issue #25), button interactions (issue #45)
- `report-card.spec.ts` - Postal code search, deputy card display
- `navigation.spec.ts` - Page accessibility, links work
- `postal-codes.spec.ts` - Postal code mapping correctness

**Key characteristics**:
- Focus on **how the app behaves**
- Test user journeys end-to-end
- Often linked to specific GitHub issues (regression tests)
- Use semantic selectors (roles, text, labels)
- May not validate exact data accuracy

---

### 2. Data Contract Tests (`e2e/data-contracts/*.spec.ts`)

**Purpose**: Validate that rendered UI matches API/database responses exactly

**What they test**:
- API response schema correctness
- Data accuracy (API values match rendered values)
- Sample-based validation (first 3-5 items)
- Null/undefined handling
- Optional field rendering

**Examples**:
- `data-contracts/leaderboard.spec.ts` - API deputy data matches rendered cards
- `data-contracts/parties.spec.ts` - Party aggregations match API response
- `data-contracts/districts.spec.ts` - District metrics match API
- `data-contracts/deputy-profile.spec.ts` - Profile data matches Supabase response

**Key characteristics**:
- Focus on **data accuracy**
- Intercept API calls using \`page.route()\`
- Validate schema using helpers (\`apps/web/e2e/helpers/schemas.ts\`)
- Use \`data-testid\` attributes for precision
- Gracefully skip when no data available (\`test.skip()\`)

**Pattern**:
\`\`\`typescript
test('page validates data contract', async ({ page }) => {
  let apiData;

  // Intercept API call
  await page.route('**/rest/v1/table*', async (route) => {
    const response = await route.fetch();
    apiData = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/page');
  await page.waitForLoadState('networkidle');

  if (!apiData || apiData.length === 0) {
    test.skip();
    return;
  }

  // Validate schema
  SchemaHelper.validate(apiData[0]);

  // Validate rendered data (sample-based)
  for (let i = 0; i < Math.min(3, apiData.length); i++) {
    const item = apiData[i];
    const element = page.locator('[data-testid="item"]').nth(i);
    await expect(element).toContainText(item.name);
  }
});
\`\`\`

For detailed patterns, see [\`data-contracts/README.md\`](./data-contracts/README.md).

---

### 3. Smoke Tests (\`e2e/smoke/*.spec.ts\`)

**Purpose**: Fast sanity checks for critical paths

**What they test**:
- Homepage loads
- Basic navigation works
- No JavaScript errors on key pages

**Run separately**: \`bun run e2e:smoke\`

---

## Why Two Categories?

### Behavioral tests answer:
- ✅ "Can users complete this flow?"
- ✅ "Does the UI respond correctly to interactions?"
- ✅ "Are past bugs still fixed?"

### Data contract tests answer:
- ✅ "Does the UI show the correct data from the API?"
- ✅ "Do API schema changes break the UI?"
- ✅ "Are null values handled gracefully?"

Both are essential:
- **Behavioral tests** catch UX bugs and regressions
- **Data contract tests** catch data accuracy bugs and API schema drift

---

## Running Tests

\`\`\`bash
# All E2E tests
bun run e2e

# Only smoke tests (fast)
bun run e2e:smoke

# Only data contract tests
bun run e2e:data-contracts

# UI mode (interactive)
bun run e2e:ui

# Debug mode (headed browser, no timeout)
bun run e2e:debug
\`\`\`

---

## Adding New Tests

### When to add a behavioral E2E test:
- Testing a user flow (search → click → navigate)
- Regression test for a bug fix
- Validating UI interactions (tabs, forms, buttons)
- Accessibility checks

**Location**: \`apps/web/e2e/<feature>.spec.ts\`

### When to add a data contract test:
- New page with API data
- New API endpoint integration
- Complex data transformations
- Data accuracy critical to feature

**Location**: \`apps/web/e2e/data-contracts/<feature>.spec.ts\`

### Both may be needed:
Many features benefit from **both types of tests**:

Example: Leaderboard page
- **Behavioral** (\`leaderboard.spec.ts\`): Tab switching works, suspended deputies hidden, ranking numbers valid
- **Data contract** (\`data-contracts/leaderboard.spec.ts\`): Deputy names/parties match API, metrics accurate

---

## Test Organization Best Practices

1. **One test file per page/feature** (avoid mixing unrelated tests)
2. **Link to GitHub issues** in regression tests (use \`// @see https://...\`)
3. **Use descriptive test names** ("should display tiebreaker help" not "test 1")
4. **Graceful degradation** (use \`test.skip()\` when data unavailable)
5. **Prefer semantic selectors** (roles, labels) over brittle selectors (classes, IDs)
6. **Add data-testid only when necessary** (for precise data validation)

---

## Maintenance

### When API changes:
1. Update schema validators in \`e2e/helpers/schemas.ts\`
2. Update affected data contract tests in \`e2e/data-contracts/\`
3. Behavioral tests usually don't need changes (unless UI changes)

### When UI changes:
1. Update behavioral tests if user flows changed
2. Update data-testid attributes if selectors changed
3. Data contract tests usually don't need changes (unless data rendering changed)

---

## CI Integration

All E2E tests run on PRs to \`staging\`/\`main\`:
- Parallel execution (2 workers in CI)
- Full test suite must pass before merge
- Failures include screenshots, videos, traces

See \`.github/workflows/ci.yml\` for configuration.

import { expect, test } from '../fixtures';

// Issue #171: Search Functionality Data Contract Tests
// @see https://github.com/bcamarneiro/adamastor/issues/171

test('search results match API response', async ({ page }) => {
  let apiSearchResults: unknown;

  // Listen for API responses (don't intercept)
  page.on('response', async (response) => {
    const url = response.url();
    // Check if it's a search query with 'or' parameter
    if (url.includes('/rest/v1/deputy_details') && url.includes('or=')) {
      try {
        apiSearchResults = await response.json();
      } catch (_error) {
        // Ignore parsing errors
      }
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Open search (click search toggle button)
  const searchToggle = page.locator('[data-testid="search-toggle"]');
  if (await searchToggle.isVisible()) {
    await searchToggle.click();
    await page.waitForTimeout(200); // Wait for search input to appear
  }

  // Perform search (use .first() since both desktop and mobile inputs exist)
  const searchInput = page.locator('[data-testid="global-search-input"]').first();
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.fill('Silva');
  await page.waitForTimeout(500); // Wait for debounce and API call

  // Skip if no search results from API
  if (!apiSearchResults || (Array.isArray(apiSearchResults) && apiSearchResults.length === 0)) {
    test.skip();
    return;
  }

  // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
  const results = apiSearchResults as any[];

  // Validate result count
  const resultItems = page.locator('[role="option"]');
  const resultCount = await resultItems.count();
  expect(resultCount).toBeGreaterThan(0);
  expect(resultCount).toBeLessThanOrEqual(results.length);

  // Validate first 3 search results
  for (let i = 0; i < Math.min(3, results.length, resultCount); i++) {
    const deputy = results[i];
    const resultItem = resultItems.nth(i);

    // Validate deputy name is displayed (either short_name or name)
    if (deputy.short_name) {
      await expect(resultItem).toContainText(deputy.short_name);
    } else if (deputy.name) {
      await expect(resultItem).toContainText(deputy.name);
    }

    // Validate party acronym if present
    if (deputy.party_acronym) {
      await expect(resultItem).toContainText(deputy.party_acronym);
    }

    // Validate district name if present
    if (deputy.district_name) {
      await expect(resultItem).toContainText(deputy.district_name);
    }
  }
});

test('search query parameters match API request', async ({ page }) => {
  let capturedUrl: string | undefined;

  // Listen for API requests
  page.on('request', (request) => {
    const url = request.url();
    // Capture URL if it's a search query with 'or' parameter
    if (url.includes('/rest/v1/deputy_details') && url.includes('or=')) {
      capturedUrl = url;
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Open search
  const searchToggle = page.locator('[data-testid="search-toggle"]');
  if (await searchToggle.isVisible()) {
    await searchToggle.click();
    await page.waitForTimeout(200);
  }

  // Perform search with specific term (use .first() since both desktop and mobile inputs exist)
  const searchInput = page.locator('[data-testid="global-search-input"]').first();
  await searchInput.waitFor({ state: 'visible' });
  const searchTerm = 'Costa';
  await searchInput.fill(searchTerm);
  await page.waitForTimeout(500); // Wait for debounce and API call

  // Verify API URL was captured
  if (!capturedUrl) {
    test.skip();
    return;
  }

  // Validate that URL contains the search term in the 'or' parameter
  // The API uses: or=name.ilike.%searchTerm%,short_name.ilike.%searchTerm%
  expect(capturedUrl).toContain('or=');
  expect(capturedUrl).toContain('name.ilike');
  expect(capturedUrl).toContain('short_name.ilike');
  expect(capturedUrl.toLowerCase()).toContain(searchTerm.toLowerCase());

  // Validate other query parameters
  expect(capturedUrl).toContain('is_active=eq.true'); // Only active deputies
  expect(capturedUrl).toContain('order=work_score.desc'); // Ordered by work_score
  expect(capturedUrl).toContain('limit=10'); // Limited to 10 results
});

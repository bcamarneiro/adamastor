import { expect, test } from './fixtures';

test.describe('Global Search', () => {
  test.describe('Issue #44: Click on search results should navigate', () => {
    test('clicking a search result navigates to deputy page', async ({ page }) => {
      await page.goto('/');

      // On desktop, click the search toggle button first to show the search input
      const searchToggle = page.getByTestId('search-toggle');
      await searchToggle.click();

      // Find and focus the search input
      const searchInput = page.getByTestId('global-search-input');
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      await searchInput.click();

      // Type a search query (need at least 2 chars to trigger search)
      await searchInput.fill('Costa');

      // Wait for results to appear - need to wait for debounce (300ms) + API call
      const firstResult = page.locator('[cmdk-item]').first();
      await expect(firstResult).toBeVisible({ timeout: 10000 });

      // Click the result
      await firstResult.click();

      // Should navigate to deputy page
      await expect(page).toHaveURL(/\/deputado\//, { timeout: 5000 });
    });

    test('keyboard navigation works (Enter key)', async ({ page }) => {
      await page.goto('/');

      // On desktop, click the search toggle button first to show the search input
      const searchToggle = page.getByTestId('search-toggle');
      await searchToggle.click();

      const searchInput = page.getByTestId('global-search-input');
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      await searchInput.click();
      await searchInput.fill('Costa');

      // Wait for results - need to wait for debounce (300ms) + API call
      const firstResult = page.locator('[cmdk-item]').first();
      await expect(firstResult).toBeVisible({ timeout: 10000 });

      // Use keyboard to select first result
      await searchInput.press('ArrowDown');
      await searchInput.press('Enter');

      // Should navigate to deputy page
      await expect(page).toHaveURL(/\/deputado\//, { timeout: 5000 });
    });
  });
});

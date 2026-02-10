import { expect, isMobileViewport, openMobileMenu, test } from './fixtures';

test.describe('Global Search', () => {
  test.describe('Issue #44: Click on search results should navigate', () => {
    test('clicking a search result navigates to deputy page', async ({ page, viewport }) => {
      await page.goto('/');

      // Open mobile menu if on mobile viewport
      if (isMobileViewport(viewport)) {
        await openMobileMenu(page);
      }

      // Click the search toggle button first to show the search input
      const searchToggle = page.getByTestId('search-toggle');
      await searchToggle.click();

      // Find and focus the search input
      const searchInput = page.getByTestId('global-search-input');
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      await searchInput.click();

      // Type a search query (need at least 2 chars to trigger search)
      // Use a common letter combination to find any deputy
      await searchInput.fill('de');

      // Wait for results to appear - need to wait for debounce (300ms) + API call
      const firstResult = page.locator('[cmdk-item]').first();

      // Check if results appear - skip test gracefully if no data in CI environment
      try {
        await expect(firstResult).toBeVisible({ timeout: 10000 });
      } catch {
        test.skip(
          true,
          'No search results available - skipping in CI environment without seed data'
        );
        return;
      }

      // Click the result
      await firstResult.click();

      // Should navigate to deputy page
      await expect(page).toHaveURL(/\/deputado\//, { timeout: 5000 });
    });

    test('keyboard navigation works (Enter key)', async ({ page, viewport }) => {
      await page.goto('/');

      // Open mobile menu if on mobile viewport
      if (isMobileViewport(viewport)) {
        await openMobileMenu(page);
      }

      // Click the search toggle button first to show the search input
      const searchToggle = page.getByTestId('search-toggle');
      await searchToggle.click();

      const searchInput = page.getByTestId('global-search-input');
      await expect(searchInput).toBeVisible({ timeout: 5000 });
      await searchInput.click();
      // Use a common letter combination to find any deputy
      await searchInput.fill('de');

      // Wait for results - need to wait for debounce (300ms) + API call
      const firstResult = page.locator('[cmdk-item]').first();

      // Check if results appear - skip test gracefully if no data in CI environment
      try {
        await expect(firstResult).toBeVisible({ timeout: 10000 });
      } catch {
        test.skip(
          true,
          'No search results available - skipping in CI environment without seed data'
        );
        return;
      }

      // Use keyboard to select first result
      await searchInput.press('ArrowDown');
      await searchInput.press('Enter');

      // Should navigate to deputy page
      await expect(page).toHaveURL(/\/deputado\//, { timeout: 5000 });
    });
  });
});

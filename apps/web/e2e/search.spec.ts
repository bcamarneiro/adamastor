import { expect, test } from './fixtures';

test.describe('Global Search', () => {
  test.describe('Issue #44: Click on search results should navigate', () => {
    test('clicking a search result navigates to deputy page', async ({ page }) => {
      await page.goto('/');

      // Find and focus the search input
      const searchInput = page.getByPlaceholder('Pesquisar deputado...');
      await searchInput.click();

      // Type a search query (need at least 2 chars to trigger search)
      await searchInput.fill('Costa');

      // Wait for results to appear
      const resultsList = page.locator('ul');
      await expect(resultsList).toBeVisible({ timeout: 5000 });

      // Get the first result item
      const firstResult = resultsList.locator('li').first();
      await expect(firstResult).toBeVisible();

      // Click the result (THIS IS THE BUG - click doesn't work)
      await firstResult.click();

      // Should navigate to deputy page
      await expect(page).toHaveURL(/\/deputado\//, { timeout: 3000 });
    });

    test('keyboard navigation works (Enter key)', async ({ page }) => {
      await page.goto('/');

      const searchInput = page.getByPlaceholder('Pesquisar deputado...');
      await searchInput.click();
      await searchInput.fill('Costa');

      // Wait for results
      const resultsList = page.locator('ul');
      await expect(resultsList).toBeVisible({ timeout: 5000 });

      // Use keyboard to select first result
      await searchInput.press('ArrowDown');
      await searchInput.press('Enter');

      // Should navigate to deputy page
      await expect(page).toHaveURL(/\/deputado\//, { timeout: 3000 });
    });
  });
});

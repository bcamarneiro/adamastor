import { expect, test } from '@playwright/test';

test.describe('Leaderboard Page', () => {
  test('should load the leaderboard page', async ({ page }) => {
    await page.goto('/ranking');

    // Page should load without errors
    await expect(page).toHaveURL(/\/ranking/);
  });

  test('should display top workers section', async ({ page }) => {
    await page.goto('/ranking');

    // Should have a section for top workers
    await expect(page.getByText(/mais trabalhadores/i)).toBeVisible();
  });

  test('should display bottom workers section', async ({ page }) => {
    await page.goto('/ranking');

    // Should have a section for bottom workers
    await expect(page.getByText(/menos trabalhadores/i)).toBeVisible();
  });

  test('should be able to switch between tabs', async ({ page }) => {
    await page.goto('/ranking');

    // Look for tab controls if they exist
    const tabList = page.getByRole('tablist');
    if (await tabList.isVisible()) {
      const tabs = tabList.getByRole('tab');
      const tabCount = await tabs.count();

      if (tabCount > 1) {
        // Click on second tab
        await tabs.nth(1).click();

        // Verify tab changed
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
      }
    }
  });
});

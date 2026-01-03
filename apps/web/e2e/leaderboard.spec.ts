import { expect, test } from './fixtures';

test.describe('Leaderboard Page', () => {
  test('should load the leaderboard page', async ({ page }) => {
    await page.goto('/ranking');

    // Page should load without errors
    await expect(page).toHaveURL(/\/ranking/);
  });

  test('should display high activity section', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Should have a section for high activity deputies
    await expect(page.getByText(/maior atividade parlamentar/i).first()).toBeVisible();
  });

  test('should display low activity section', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Should have a section for low activity deputies
    await expect(page.getByText(/menor atividade parlamentar/i).first()).toBeVisible();
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

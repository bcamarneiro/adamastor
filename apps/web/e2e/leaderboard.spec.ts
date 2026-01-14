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

  // Issue #67: Ranking numbers exceed deputy count
  // @see https://github.com/bcamarneiro/adamastor/issues/67
  test('no ranking position should exceed 230', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    const rankElements = page.locator('text=/#\\d+/');
    const ranks = await rankElements.allTextContents();

    for (const rankText of ranks) {
      const match = rankText.match(/#(\d+)/);
      if (match) {
        const rank = Number.parseInt(match[1], 10);
        expect(rank).toBeLessThanOrEqual(230);
      }
    }
  });

  // Issue #68: Suspended deputies in ranking
  // @see https://github.com/bcamarneiro/adamastor/issues/68
  test('should not show suspended deputies in low activity section', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    const lowActivitySection = page.locator('section, div').filter({
      hasText: /menor atividade|ranking de preguiça/i,
    });

    if ((await lowActivitySection.count()) === 0) {
      test.skip();
      return;
    }

    const suspendedBadges = lowActivitySection.getByText(/suspenso|suspens/i);
    const suspendedCount = await suspendedBadges.count();

    expect(suspendedCount).toBe(0);
  });

  // Issue #76: Explain tiebreaker criteria in rankings
  // @see https://github.com/bcamarneiro/adamastor/issues/76
  test('full rankings should display tiebreaker help', async ({ page }) => {
    await page.goto('/ranking/completo');
    await page.waitForLoadState('networkidle');

    // Check that the tiebreaker help button is visible
    const tiebreakerButton = page.getByRole('button', { name: /critério de desempate/i });
    await expect(tiebreakerButton).toBeVisible();

    // Verify the Info icon is present (SVG inside the button)
    const infoIcon = tiebreakerButton.locator('svg');
    await expect(infoIcon).toBeVisible();
  });
});

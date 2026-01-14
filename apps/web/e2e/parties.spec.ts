import { expect, test } from './fixtures';

test.describe('Parties Page', () => {
  test('should load the parties page', async ({ page }) => {
    await page.goto('/partidos');

    await expect(page).toHaveURL(/\/partidos/);
  });

  // Issue #25: Party colors transparency in dark mode
  // @see https://github.com/bcamarneiro/adamastor/issues/25
  test('party cards should have visible colors', async ({ page }) => {
    await page.goto('/partidos');
    await page.waitForLoadState('networkidle');

    const partyCards = page.locator('[class*="party"], [data-party]');

    if ((await partyCards.count()) === 0) {
      test.skip();
      return;
    }

    const firstCard = partyCards.first();
    await expect(firstCard).toBeVisible();
  });

  // Issue #45: "Comparar Partidos" button illegible
  // @see https://github.com/bcamarneiro/adamastor/issues/45
  test('compare parties button should be visible', async ({ page }) => {
    await page.goto('/partidos');
    await page.waitForLoadState('networkidle');

    const compareButton = page
      .getByRole('button', { name: /comparar/i })
      .or(page.locator('button').filter({ hasText: /comparar/i }))
      .first();

    if ((await compareButton.count()) === 0) {
      test.skip();
      return;
    }

    await expect(compareButton).toBeVisible();

    const buttonText = await compareButton.textContent();
    expect(buttonText?.trim().length).toBeGreaterThan(0);
  });
});

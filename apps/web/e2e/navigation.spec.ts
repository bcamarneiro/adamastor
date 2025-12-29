import { expect, test } from './fixtures';

test.describe('Navigation', () => {
  test('should navigate to leaderboard page', async ({ page }) => {
    await page.goto('/');

    // Click on leaderboard link (labeled "Ranking" in MainNav)
    await page
      .getByRole('link', { name: /ranking/i })
      .first()
      .click();

    // Should be on leaderboard page
    await expect(page).toHaveURL(/\/ranking/);
  });

  test('should navigate to battle page', async ({ page }) => {
    await page.goto('/');

    // Click on battle link (labeled "Battle Royale" in MainNav)
    await page
      .getByRole('link', { name: /battle royale/i })
      .first()
      .click();

    // Should be on battle page
    await expect(page).toHaveURL(/\/batalha/);
  });

  test('should navigate to waste calculator page', async ({ page }) => {
    await page.goto('/');

    // Click on waste calculator link (labeled "Calculadora" in MainNav)
    await page
      .getByRole('link', { name: /calculadora/i })
      .first()
      .click();

    // Should be on waste calculator page
    await expect(page).toHaveURL(/\/desperdicio/);
  });

  test('should return to home page when clicking logo', async ({ page }) => {
    await page.goto('/ranking');

    // Click on logo/home link
    await page
      .getByRole('link', { name: /Debaixo d'olho/i })
      .first()
      .click();

    // Should be back on home page
    await expect(page).toHaveURL('/');
  });
});

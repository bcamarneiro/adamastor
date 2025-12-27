import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to leaderboard page', async ({ page }) => {
    await page.goto('/');

    // Click on leaderboard link
    await page.getByRole('link', { name: /ranking/i }).click();

    // Should be on leaderboard page
    await expect(page).toHaveURL(/\/ranking/);
  });

  test('should navigate to battle page', async ({ page }) => {
    await page.goto('/');

    // Click on battle link
    await page.getByRole('link', { name: /batalha/i }).click();

    // Should be on battle page
    await expect(page).toHaveURL(/\/batalha/);
  });

  test('should navigate to waste calculator page', async ({ page }) => {
    await page.goto('/');

    // Click on waste calculator link
    await page.getByRole('link', { name: /desperdício/i }).click();

    // Should be on waste calculator page
    await expect(page).toHaveURL(/\/desperdicio/);
  });

  test('should return to home page when clicking logo', async ({ page }) => {
    await page.goto('/ranking');

    // Click on logo/home link
    await page
      .getByRole('link', { name: /adamastor/i })
      .first()
      .click();

    // Should be back on home page
    await expect(page).toHaveURL('/');
  });
});

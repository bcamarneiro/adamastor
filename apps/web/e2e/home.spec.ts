import { expect, test } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Adamastor/i);
  });

  test('should display the main navigation', async ({ page }) => {
    await page.goto('/');

    // Check for navigation links
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should display the footer', async ({ page }) => {
    await page.goto('/');

    // Check footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

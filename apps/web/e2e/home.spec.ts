import { expect, test } from './fixtures';

test.describe('Home Page', () => {
  // Run tests serially to share browser context and reduce startup overhead
  test.describe.configure({ mode: 'serial' });
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Debaixo d'olho/i);
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

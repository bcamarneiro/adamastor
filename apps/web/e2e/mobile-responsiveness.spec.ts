import { expect, test } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  // Use the iPhone 13 Pro viewport
  test.use({ viewport: { width: 390, height: 844 } });

  test('Homepage should render correctly on mobile', async ({ page }) => {
    await page.goto('/');
    // Check for the main heading
    await expect(page.getByRole('heading', { name: 'adamastor', level: 1 })).toBeVisible();
    // Check that the main content is present
    await expect(page.getByRole('main')).toBeVisible();
    // Check for the footer
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});

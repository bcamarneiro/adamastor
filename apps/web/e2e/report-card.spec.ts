import { test, expect } from '@playwright/test';

test.describe('Report Card (Postal Code Lookup)', () => {
  test('should display postal code input on home page', async ({ page }) => {
    await page.goto('/');

    // Should have postal code input
    const postalCodeInput = page.getByPlaceholder('1000-001');
    await expect(postalCodeInput).toBeVisible();
  });

  test('should format postal code input correctly', async ({ page }) => {
    await page.goto('/');

    // Type a postal code
    const postalCodeInput = page.getByPlaceholder('1000-001');
    await postalCodeInput.fill('1000001');

    // Should be formatted as XXXX-XXX
    await expect(postalCodeInput).toHaveValue('1000-001');
  });

  test('should enable submit button when postal code is valid', async ({ page }) => {
    await page.goto('/');

    // Find the submit button (should be disabled initially)
    const submitButton = page.getByRole('button', { name: /ver/i });

    // Type a valid postal code
    const postalCodeInput = page.getByPlaceholder('1000-001');
    await postalCodeInput.fill('1000');

    // Button should be enabled now
    await expect(submitButton).toBeEnabled();
  });

  test('should keep submit button disabled for invalid postal code', async ({ page }) => {
    await page.goto('/');

    // Find the submit button
    const submitButton = page.getByRole('button', { name: /ver/i });

    // Type an invalid (too short) postal code
    const postalCodeInput = page.getByPlaceholder('1000-001');
    await postalCodeInput.fill('100');

    // Button should still be disabled
    await expect(submitButton).toBeDisabled();
  });
});

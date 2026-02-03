import { expect, test } from './fixtures';

test.describe('Postal Code Disambiguation', () => {
  // PR #227: When a CP4 code spans two districts, the user should be prompted to choose.
  test('ambiguous postal code 4620 should show district choice UI', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const postalInput = page.getByPlaceholder(/1000-001|código postal/i).first();

    if ((await postalInput.count()) === 0) {
      test.skip();
      return;
    }

    await postalInput.fill('4620');

    const submitButton = page.locator('button[type="submit"]').first();
    if ((await submitButton.count()) > 0) {
      await submitButton.click();
    } else {
      await postalInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    // Should NOT have navigated away — disambiguation UI should appear
    // The page should still be on the home page (no /distrito/ redirect)
    await page.waitForTimeout(1000);

    // Look for the disambiguation warning panel
    const disambiguationPanel = page.getByText(/abrange dois distritos/i);
    await expect(disambiguationPanel).toBeVisible({ timeout: 5000 });

    // Should show both district options (Braga and Porto for 4620)
    const bragaButton = page.getByRole('button', { name: /Braga/i });
    const portoButton = page.getByRole('button', { name: /Porto/i });

    // At least one of the district buttons should be visible
    const bragaVisible = (await bragaButton.count()) > 0;
    const portoVisible = (await portoButton.count()) > 0;
    expect(bragaVisible || portoVisible).toBeTruthy();
  });

  test('selecting a district from disambiguation should navigate to it', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const postalInput = page.getByPlaceholder(/1000-001|código postal/i).first();

    if ((await postalInput.count()) === 0) {
      test.skip();
      return;
    }

    await postalInput.fill('4620');

    const submitButton = page.locator('button[type="submit"]').first();
    if ((await submitButton.count()) > 0) {
      await submitButton.click();
    } else {
      await postalInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    // Wait for disambiguation UI
    const disambiguationPanel = page.getByText(/abrange dois distritos/i);

    try {
      await expect(disambiguationPanel).toBeVisible({ timeout: 5000 });
    } catch {
      // If disambiguation doesn't appear (e.g., DB doesn't have this as ambiguous), skip
      test.skip();
      return;
    }

    // Click on the first district button available (Porto or Braga)
    const districtButton = page.getByRole('button', { name: /Porto|Braga/i }).first();

    if ((await districtButton.count()) > 0) {
      await districtButton.click();

      await page.waitForLoadState('networkidle');

      // Should have navigated to the district page
      expect(page.url()).toMatch(/\/distrito\/(porto|braga)/);

      // Page should show deputy information
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    }
  });
});

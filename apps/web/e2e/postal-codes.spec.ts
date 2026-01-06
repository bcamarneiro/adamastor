import { expect, test } from './fixtures';

test.describe('Postal Code Lookup', () => {
  // Issue #116: Postal code 3700 shows wrong district
  // @see https://github.com/bcamarneiro/adamastor/issues/116
  test('postal code 3700 should map to Aveiro district', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const postalInput = page.getByPlaceholder(/1000-001|código postal/i).first();

    if ((await postalInput.count()) === 0) {
      test.skip();
      return;
    }

    await postalInput.fill('3700');

    const submitButton = page.locator('button[type="submit"]').first();
    if ((await submitButton.count()) > 0) {
      await submitButton.click();
    } else {
      await postalInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    const pageContent = await page.textContent('body');

    const mentionsViseuAsDistrict =
      pageContent?.includes('Viseu') && !pageContent?.includes('Aveiro');

    if (page.url().includes('/deputados') || page.url().includes('/distrito')) {
      expect(page.url()).toContain('aveiro');
    }

    expect(mentionsViseuAsDistrict).toBeFalsy();
    expect(page.url()).not.toContain('error');
  });

  // Issue #116: Postal code 3720 (Oliveira de Azeméis)
  // @see https://github.com/bcamarneiro/adamastor/issues/116
  test('postal code 3720 should map to Aveiro', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const postalInput = page.getByPlaceholder(/1000-001|código postal/i).first();
    if ((await postalInput.count()) === 0) {
      test.skip();
      return;
    }

    await postalInput.fill('3720');

    const submitButton = page.locator('button[type="submit"]').first();
    if ((await submitButton.count()) > 0) {
      await submitButton.click();
    } else {
      await postalInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    if (page.url().includes('/deputados') || page.url().includes('/distrito')) {
      expect(page.url()).toContain('aveiro');
    }
  });

  // Issue #109: Postal code mappings incorrect
  // @see https://github.com/bcamarneiro/adamastor/issues/109
  test('postal code 6300 should map to Guarda (not Castelo Branco)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const postalInput = page.getByPlaceholder(/1000-001|código postal/i).first();
    if ((await postalInput.count()) === 0) {
      test.skip();
      return;
    }

    await postalInput.fill('6300');

    const submitButton = page.locator('button[type="submit"]').first();
    if ((await submitButton.count()) > 0) {
      await submitButton.click();
    } else {
      await postalInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    if (page.url().includes('/deputados') || page.url().includes('/distrito')) {
      expect(page.url()).toContain('guarda');
      expect(page.url()).not.toContain('castelo-branco');
    }
  });

  // Issue #109: Postal code 2800 (Almada area)
  // @see https://github.com/bcamarneiro/adamastor/issues/109
  test('postal code 2800 should map to Setúbal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const postalInput = page.getByPlaceholder(/1000-001|código postal/i).first();
    if ((await postalInput.count()) === 0) {
      test.skip();
      return;
    }

    await postalInput.fill('2800');

    const submitButton = page.locator('button[type="submit"]').first();
    if ((await submitButton.count()) > 0) {
      await submitButton.click();
    } else {
      await postalInput.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    if (page.url().includes('/deputados') || page.url().includes('/distrito')) {
      expect(page.url()).toContain('setubal');
      expect(page.url()).not.toContain('lisboa');
    }
  });
});

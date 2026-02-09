/**
 * E2E Tests for District and Party Comparison Filtering
 * Issue #14: Test filtering and sorting on comparison pages
 * @see https://github.com/bcamarneiro/adamastor/issues/14
 */
import { expect, test } from './fixtures';
import {
  DISTRICT_CONFIG,
  DROPDOWN_BUTTON_SELECTOR,
  PARTY_CONFIG,
  checkComparisonResults,
  clearSelection,
  clickCompareButton,
  clickResetButton,
  getOptionCount,
  openSelector,
  searchInSelector,
  selectFirstOption,
  selectSecondOption,
} from './helpers/comparison-helpers';

test.describe('District Comparison - Selection and Filtering', () => {
  test('should allow selecting two different districts', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first district
    const firstDistrictName = await selectFirstOption(page, DISTRICT_CONFIG);
    if (!firstDistrictName) {
      test.skip();
      return;
    }

    // Verify first district is selected
    await expect(page.locator(`text=${firstDistrictName}`).first()).toBeVisible();

    // Select second district
    const secondDistrictName = await selectSecondOption(page, DISTRICT_CONFIG);
    if (!secondDistrictName) {
      test.skip();
      return;
    }

    // Verify second district is selected
    await expect(page.locator(`text=${secondDistrictName}`).first()).toBeVisible();

    // Verify compare button appears
    const compareButton = page.getByRole('button', { name: DISTRICT_CONFIG.compareButtonText });
    await expect(compareButton).toBeVisible();
  });

  test('should filter districts by search term', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    await openSelector(page, 0, DISTRICT_CONFIG);

    // Get initial count of districts
    const initialCount = await getOptionCount(page, DISTRICT_CONFIG);
    if (initialCount === 0) {
      test.skip();
      return;
    }

    // Type search term
    await searchInSelector(page, 0, 'Lisboa', DISTRICT_CONFIG);

    // Get filtered count
    const filteredCount = await getOptionCount(page, DISTRICT_CONFIG);

    // Should have fewer results (or same if only Lisboa exists)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Should show Lisboa in results
    if (filteredCount > 0) {
      const firstResult = page.locator(DROPDOWN_BUTTON_SELECTOR).first();
      const resultText = await firstResult.locator('div.font-semibold').textContent();
      expect(resultText?.toLowerCase()).toContain('lisboa');
    }
  });

  test('should prevent selecting same district twice', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first district
    const selectedDistrictName = await selectFirstOption(page, DISTRICT_CONFIG);
    if (!selectedDistrictName) {
      test.skip();
      return;
    }

    // Try to select same district in second selector (now at index 0 since first selector shows selected card)
    await searchInSelector(page, 0, selectedDistrictName, DISTRICT_CONFIG);

    // Should show "Nenhum distrito encontrado" or not show the excluded district
    const districtButtons = page.locator(DROPDOWN_BUTTON_SELECTOR);
    const count = await districtButtons.count();

    if (count > 0) {
      // If any districts are shown, none should match the selected one
      for (let i = 0; i < count; i++) {
        const districtName = await districtButtons
          .nth(i)
          .locator('div.font-semibold')
          .textContent();
        expect(districtName).not.toBe(selectedDistrictName);
      }
    }
  });

  test('should allow clearing selected district', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Select a district
    const districtName = await selectFirstOption(page, DISTRICT_CONFIG);
    if (!districtName) {
      test.skip();
      return;
    }

    // Find and click clear button (X icon)
    await clearSelection(page, 0);

    // Should show search input again
    const searchInput = page
      .locator(`input[placeholder*="${DISTRICT_CONFIG.searchPlaceholder}"]`)
      .first();
    await expect(searchInput).toBeVisible();
  });

  test('should display comparison results after comparing', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first district
    const firstDistrictName = await selectFirstOption(page, DISTRICT_CONFIG);
    if (!firstDistrictName) {
      test.skip();
      return;
    }

    // Select second district
    const secondDistrictName = await selectSecondOption(page, DISTRICT_CONFIG);
    if (!secondDistrictName) {
      test.skip();
      return;
    }

    // Click compare button
    await clickCompareButton(page, DISTRICT_CONFIG);

    // Check all comparison results are visible
    const results = await checkComparisonResults(page);
    expect(results.hasWinnerSection).toBe(true);
    expect(results.hasComparisonHeading).toBe(true);
    expect(results.hasResetButton).toBe(true);
  });

  test('should reset comparison and allow new selection', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Select and compare two districts
    const firstDistrictName = await selectFirstOption(page, DISTRICT_CONFIG);
    if (!firstDistrictName) {
      test.skip();
      return;
    }

    const secondDistrictName = await selectSecondOption(page, DISTRICT_CONFIG);
    if (!secondDistrictName) {
      test.skip();
      return;
    }

    await clickCompareButton(page, DISTRICT_CONFIG);

    // Click reset
    await clickResetButton(page);

    // Should show selection inputs again
    const searchInputs = page.locator(`input[placeholder*="${DISTRICT_CONFIG.searchPlaceholder}"]`);
    expect(await searchInputs.count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Party Comparison - Selection and Filtering', () => {
  test('should allow selecting two different parties', async ({ page }) => {
    await page.goto('/partidos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first party
    const firstPartyName = await selectFirstOption(page, PARTY_CONFIG);
    if (!firstPartyName) {
      test.skip();
      return;
    }

    // Verify first party is selected
    await expect(page.locator(`text=${firstPartyName}`).first()).toBeVisible();

    // Select second party
    const secondPartyName = await selectSecondOption(page, PARTY_CONFIG);
    if (!secondPartyName) {
      test.skip();
      return;
    }

    // Verify second party is selected
    await expect(page.locator(`text=${secondPartyName}`).first()).toBeVisible();

    // Verify compare button appears
    const compareButton = page.getByRole('button', { name: PARTY_CONFIG.compareButtonText });
    await expect(compareButton).toBeVisible();
  });

  test('should filter parties by search term', async ({ page }) => {
    await page.goto('/partidos/comparar');
    await page.waitForLoadState('networkidle');

    await openSelector(page, 0, PARTY_CONFIG);

    // Get initial count
    const initialCount = await getOptionCount(page, PARTY_CONFIG);
    if (initialCount === 0) {
      test.skip();
      return;
    }

    // Type search term - search for common party like "PS" or "PSD"
    await searchInSelector(page, 0, 'PS', PARTY_CONFIG);

    // Get filtered count
    const filteredCount = await getOptionCount(page, PARTY_CONFIG);

    // Should have fewer or equal results
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // If results exist, should contain "PS"
    if (filteredCount > 0) {
      const firstResult = page.locator(DROPDOWN_BUTTON_SELECTOR).first();
      const resultText = await firstResult.locator('div.font-semibold').textContent();
      expect(resultText?.toUpperCase()).toContain('PS');
    }
  });

  test('should display party comparison results', async ({ page }) => {
    await page.goto('/partidos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first party
    const firstPartyName = await selectFirstOption(page, PARTY_CONFIG);
    if (!firstPartyName) {
      test.skip();
      return;
    }

    // Select second party
    const secondPartyName = await selectSecondOption(page, PARTY_CONFIG);
    if (!secondPartyName) {
      test.skip();
      return;
    }

    // Click compare button
    await clickCompareButton(page, PARTY_CONFIG);

    // Check all comparison results are visible
    const results = await checkComparisonResults(page);
    expect(results.hasWinnerSection).toBe(true);
    expect(results.hasComparisonHeading).toBe(true);
  });

  test('should prevent selecting same party twice', async ({ page }) => {
    await page.goto('/partidos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first party
    const selectedPartyName = await selectFirstOption(page, PARTY_CONFIG);
    if (!selectedPartyName) {
      test.skip();
      return;
    }

    // Try to select same party in second selector (now at index 0 since first selector shows selected card)
    await searchInSelector(page, 0, selectedPartyName, PARTY_CONFIG);

    // Should not show the excluded party
    const partyButtons = page.locator(DROPDOWN_BUTTON_SELECTOR);
    const count = await partyButtons.count();

    if (count > 0) {
      // If any parties are shown, none should match the selected one
      for (let i = 0; i < count; i++) {
        const partyName = await partyButtons.nth(i).locator('div.font-semibold').textContent();
        expect(partyName).not.toBe(selectedPartyName);
      }
    }
  });
});

/**
 * E2E Tests for District and Party Comparison Filtering
 * Issue #14: Test filtering and sorting on comparison pages
 * @see https://github.com/bcamarneiro/adamastor/issues/14
 */
import { expect, test } from './fixtures';

test.describe('District Comparison - Selection and Filtering', () => {
  test('should allow selecting two different districts', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Open first district selector
    const firstInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await firstInput.click();

    // Wait for districts to load
    await page.waitForTimeout(500);

    // Select first district from dropdown
    const firstDistrictOption = page.locator('button:has-text("deputados")').first();
    if ((await firstDistrictOption.count()) === 0) {
      test.skip();
      return;
    }

    const firstDistrictName = await firstDistrictOption
      .locator('div.font-semibold')
      .first()
      .textContent();
    await firstDistrictOption.click();

    // Verify first district is selected
    await expect(page.locator(`text=${firstDistrictName}`).first()).toBeVisible();

    // Open second district selector
    const secondInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await secondInput.click();
    await page.waitForTimeout(500);

    // Select second district (different from first)
    const secondDistrictOption = page.locator('button:has-text("deputados")').nth(1);
    if ((await secondDistrictOption.count()) === 0) {
      test.skip();
      return;
    }

    const secondDistrictName = await secondDistrictOption
      .locator('div.font-semibold')
      .first()
      .textContent();
    await secondDistrictOption.click();

    // Verify second district is selected
    await expect(page.locator(`text=${secondDistrictName}`).first()).toBeVisible();

    // Verify compare button appears
    const compareButton = page.getByRole('button', { name: /comparar distritos/i });
    await expect(compareButton).toBeVisible();
  });

  test('should filter districts by search term', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    const firstInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    // Get initial count of districts
    const initialCount = await page.locator('button:has-text("deputados")').count();
    if (initialCount === 0) {
      test.skip();
      return;
    }

    // Type search term
    await firstInput.fill('Lisboa');
    await page.waitForTimeout(300);

    // Get filtered count
    const filteredCount = await page.locator('button:has-text("deputados")').count();

    // Should have fewer results (or same if only Lisboa exists)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Should show Lisboa in results
    if (filteredCount > 0) {
      const firstResult = page.locator('button:has-text("deputados")').first();
      const resultText = await firstResult.locator('div.font-semibold').textContent();
      expect(resultText?.toLowerCase()).toContain('lisboa');
    }
  });

  test('should prevent selecting same district twice', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first district
    const firstInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    const firstDistrictOption = page.locator('button:has-text("deputados")').first();
    if ((await firstDistrictOption.count()) === 0) {
      test.skip();
      return;
    }

    const selectedDistrictName = await firstDistrictOption
      .locator('div.font-semibold')
      .first()
      .textContent();
    await firstDistrictOption.click();

    // Try to select same district in second selector
    const secondInput = page.locator('input[placeholder*="Procurar distrito"]').nth(1);
    await secondInput.click();
    await page.waitForTimeout(500);

    // Search for the same district
    await secondInput.fill(selectedDistrictName || '');
    await page.waitForTimeout(300);

    // Should show "Nenhum distrito encontrado" or not show the excluded district
    const districtButtons = page.locator('button:has-text("deputados")');
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
    const firstInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    const firstDistrictOption = page.locator('button:has-text("deputados")').first();
    if ((await firstDistrictOption.count()) === 0) {
      test.skip();
      return;
    }

    await firstDistrictOption.click();

    // Find and click clear button (X icon)
    const clearButton = page.locator('button[aria-label*="Limpar"]').first();
    await expect(clearButton).toBeVisible();
    await clearButton.click();

    // Should show search input again
    const searchInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should display comparison results after comparing', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first district
    const firstInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    const firstDistrictOption = page.locator('button:has-text("deputados")').first();
    if ((await firstDistrictOption.count()) === 0) {
      test.skip();
      return;
    }
    await firstDistrictOption.click();

    // Select second district
    const secondInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await secondInput.click();
    await page.waitForTimeout(500);

    const secondDistrictOption = page.locator('button:has-text("deputados")').nth(1);
    if ((await secondDistrictOption.count()) === 0) {
      test.skip();
      return;
    }
    await secondDistrictOption.click();

    // Click compare button
    const compareButton = page.getByRole('button', { name: /comparar distritos/i });
    await compareButton.click();

    // Wait for results
    await page.waitForTimeout(500);

    // Should show winner declaration or tie
    const winnerSection = page.locator('text=/venceu|Empate/i').first();
    await expect(winnerSection).toBeVisible();

    // Should show comparison details
    const comparisonHeading = page.getByRole('heading', { name: /comparacao detalhada/i });
    await expect(comparisonHeading).toBeVisible();

    // Should show reset button
    const resetButton = page.getByRole('button', { name: /nova comparacao/i });
    await expect(resetButton).toBeVisible();
  });

  test('should reset comparison and allow new selection', async ({ page }) => {
    await page.goto('/distritos/comparar');
    await page.waitForLoadState('networkidle');

    // Select and compare two districts
    const firstInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    const firstDistrictOption = page.locator('button:has-text("deputados")').first();
    if ((await firstDistrictOption.count()) === 0) {
      test.skip();
      return;
    }
    await firstDistrictOption.click();

    const secondInput = page.locator('input[placeholder*="Procurar distrito"]').first();
    await secondInput.click();
    await page.waitForTimeout(500);

    const secondDistrictOption = page.locator('button:has-text("deputados")').nth(1);
    if ((await secondDistrictOption.count()) === 0) {
      test.skip();
      return;
    }
    await secondDistrictOption.click();

    const compareButton = page.getByRole('button', { name: /comparar distritos/i });
    await compareButton.click();
    await page.waitForTimeout(500);

    // Click reset
    const resetButton = page.getByRole('button', { name: /nova comparacao/i });
    await resetButton.click();

    // Should show selection inputs again
    const searchInputs = page.locator('input[placeholder*="Procurar distrito"]');
    expect(await searchInputs.count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Party Comparison - Selection and Filtering', () => {
  test('should allow selecting two different parties', async ({ page }) => {
    await page.goto('/partidos/comparar');
    await page.waitForLoadState('networkidle');

    // Open first party selector
    const firstInput = page.locator('input[placeholder*="Procurar partido"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    // Select first party from dropdown
    const firstPartyOption = page.locator('button:has-text("deputados")').first();
    if ((await firstPartyOption.count()) === 0) {
      test.skip();
      return;
    }

    const firstPartyName = await firstPartyOption
      .locator('div.font-semibold')
      .first()
      .textContent();
    await firstPartyOption.click();

    // Verify first party is selected
    await expect(page.locator(`text=${firstPartyName}`).first()).toBeVisible();

    // Open second party selector
    const secondInput = page.locator('input[placeholder*="Procurar partido"]').first();
    await secondInput.click();
    await page.waitForTimeout(500);

    // Select second party (different from first)
    const secondPartyOption = page.locator('button:has-text("deputados")').nth(1);
    if ((await secondPartyOption.count()) === 0) {
      test.skip();
      return;
    }

    const secondPartyName = await secondPartyOption
      .locator('div.font-semibold')
      .first()
      .textContent();
    await secondPartyOption.click();

    // Verify second party is selected
    await expect(page.locator(`text=${secondPartyName}`).first()).toBeVisible();

    // Verify compare button appears
    const compareButton = page.getByRole('button', { name: /comparar partidos/i });
    await expect(compareButton).toBeVisible();
  });

  test('should filter parties by search term', async ({ page }) => {
    await page.goto('/partidos/comparar');
    await page.waitForLoadState('networkidle');

    const firstInput = page.locator('input[placeholder*="Procurar partido"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    // Get initial count
    const initialCount = await page.locator('button:has-text("deputados")').count();
    if (initialCount === 0) {
      test.skip();
      return;
    }

    // Type search term - search for common party like "PS" or "PSD"
    await firstInput.fill('PS');
    await page.waitForTimeout(300);

    // Get filtered count
    const filteredCount = await page.locator('button:has-text("deputados")').count();

    // Should have fewer or equal results
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // If results exist, should contain "PS"
    if (filteredCount > 0) {
      const firstResult = page.locator('button:has-text("deputados")').first();
      const resultText = await firstResult.locator('div.font-semibold').textContent();
      expect(resultText?.toUpperCase()).toContain('PS');
    }
  });

  test('should display party comparison results', async ({ page }) => {
    await page.goto('/partidos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first party
    const firstInput = page.locator('input[placeholder*="Procurar partido"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    const firstPartyOption = page.locator('button:has-text("deputados")').first();
    if ((await firstPartyOption.count()) === 0) {
      test.skip();
      return;
    }
    await firstPartyOption.click();

    // Select second party
    const secondInput = page.locator('input[placeholder*="Procurar partido"]').first();
    await secondInput.click();
    await page.waitForTimeout(500);

    const secondPartyOption = page.locator('button:has-text("deputados")').nth(1);
    if ((await secondPartyOption.count()) === 0) {
      test.skip();
      return;
    }
    await secondPartyOption.click();

    // Click compare button
    const compareButton = page.getByRole('button', { name: /comparar partidos/i });
    await compareButton.click();
    await page.waitForTimeout(500);

    // Should show winner or tie
    const winnerSection = page.locator('text=/venceu|Empate/i');
    await expect(winnerSection).toBeVisible();

    // Should show comparison details
    const comparisonHeading = page.getByText(/comparacao detalhada/i);
    await expect(comparisonHeading).toBeVisible();
  });

  test('should prevent selecting same party twice', async ({ page }) => {
    await page.goto('/partidos/comparar');
    await page.waitForLoadState('networkidle');

    // Select first party
    const firstInput = page.locator('input[placeholder*="Procurar partido"]').first();
    await firstInput.click();
    await page.waitForTimeout(500);

    const firstPartyOption = page.locator('button:has-text("deputados")').first();
    if ((await firstPartyOption.count()) === 0) {
      test.skip();
      return;
    }

    const selectedPartyName = await firstPartyOption
      .locator('div.font-semibold')
      .first()
      .textContent();
    await firstPartyOption.click();

    // Try to select same party in second selector
    const secondInput = page.locator('input[placeholder*="Procurar partido"]').first();
    await secondInput.click();
    await page.waitForTimeout(500);

    // Search for the same party
    await secondInput.fill(selectedPartyName || '');
    await page.waitForTimeout(300);

    // Should not show the excluded party
    const partyButtons = page.locator('button:has-text("deputados")');
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

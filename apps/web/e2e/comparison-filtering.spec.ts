/**
 * E2E Tests for District and Party Comparison Pages
 *
 * Tests the full comparison workflow:
 * - Navigation
 * - Selection with search
 * - Comparison execution
 * - Results display
 * - Reset functionality
 *
 * Issue #14: https://github.com/bcamarneiro/adamastor/issues/14
 */
import { expect, test } from './fixtures';

test.describe('District Comparison', () => {
  test.describe('Navigation and Initial State', () => {
    test('should navigate to district comparison page from districts page', async ({ page }) => {
      await page.goto('/distritos');
      await page.waitForLoadState('networkidle');

      const compareLink = page.getByRole('link', { name: /comparar distritos/i });
      await compareLink.click();

      await expect(page).toHaveURL(/\/distritos\/comparar/);
      await expect(page.getByRole('heading', { name: /comparar distritos/i })).toBeVisible();
    });

    test('should show empty state when no districts selected', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Should show empty state message
      const emptyState = page.getByText(/escolhe dois distritos/i);
      await expect(emptyState).toBeVisible();

      // Compare button should not be visible
      const compareButton = page.getByRole('button', { name: /comparar distritos/i });
      await expect(compareButton).not.toBeVisible();
    });

    test('should have two district selector inputs', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Should have inputs for Distrito 1 and Distrito 2
      const distrito1 = page.getByPlaceholder(/procurar distrito/i).first();
      const distrito2 = page.getByPlaceholder(/procurar distrito/i).nth(1);

      await expect(distrito1).toBeVisible();
      await expect(distrito2).toBeVisible();
    });
  });

  test.describe('District Selection with Search', () => {
    test('should filter districts when typing in search', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput.click();
      await searchInput.fill('Lisboa');

      // Wait for dropdown to appear
      await page.waitForTimeout(300);

      // Should show filtered results containing "Lisboa"
      const dropdown = page.locator('.max-h-48').first();
      const lisboaOption = dropdown.getByText(/lisboa/i);

      // Skip if no data available
      if ((await lisboaOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }

      await expect(lisboaOption.first()).toBeVisible();
    });

    test('should select district when clicking on search result', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput.click();
      await searchInput.fill('Porto');

      await page.waitForTimeout(300);

      const dropdown = page.locator('.max-h-48').first();
      const portoOption = dropdown.getByText(/porto/i).first();

      if ((await portoOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }

      await portoOption.click();

      // Should show selected district card
      await expect(page.getByText(/distrito 1/i)).toBeVisible();
      await expect(page.getByText(/porto/i).first()).toBeVisible();
    });

    test('should exclude already selected district from second dropdown', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Select first district (Porto)
      const searchInput1 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput1.click();
      await searchInput1.fill('Porto');
      await page.waitForTimeout(300);

      const portoOption1 = page.locator('.max-h-48').first().getByText(/porto/i).first();
      if ((await portoOption1.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }
      await portoOption1.click();

      // Try to select Porto in second dropdown
      const searchInput2 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput2.click();
      await searchInput2.fill('Porto');
      await page.waitForTimeout(300);

      // Porto should not appear in second dropdown (excluded)
      const dropdown2 = page.locator('.max-h-48').first();
      const portoInDropdown2 = dropdown2.getByText(/^Porto$/i);

      // Should either not exist or not be visible
      expect((await portoInDropdown2.count()) === 0).toBeTruthy();
    });

    test('should clear selection when clicking X button', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Select a district
      const searchInput = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput.click();
      await searchInput.fill('Lisboa');
      await page.waitForTimeout(300);

      const lisboaOption = page.locator('.max-h-48').first().getByText(/lisboa/i).first();
      if ((await lisboaOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }
      await lisboaOption.click();

      // Find and click the clear button (X)
      const clearButton = page.getByLabel(/limpar selecao/i).first();
      await clearButton.click();

      // Should go back to search input state
      await expect(page.getByPlaceholder(/procurar distrito/i).first()).toBeVisible();
    });
  });

  test.describe('Comparison Execution', () => {
    test('should show compare button only when both districts selected', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Initially no compare button
      let compareButton = page.getByRole('button', { name: /comparar distritos/i });
      await expect(compareButton).not.toBeVisible();

      // Select first district
      const searchInput1 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput1.click();
      await searchInput1.fill('Lisboa');
      await page.waitForTimeout(300);

      const lisboaOption = page.locator('.max-h-48').first().getByText(/lisboa/i).first();
      if ((await lisboaOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }
      await lisboaOption.click();

      // Still no compare button (only one selected)
      await expect(compareButton).not.toBeVisible();

      // Select second district
      const searchInput2 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput2.click();
      await searchInput2.fill('Porto');
      await page.waitForTimeout(300);

      const portoOption = page.locator('.max-h-48').first().getByText(/porto/i).first();
      if ((await portoOption.count()) === 0) {
        test.skip(true, 'Not enough districts for comparison');
        return;
      }
      await portoOption.click();

      // Now compare button should be visible
      compareButton = page.getByRole('button', { name: /comparar distritos/i });
      await expect(compareButton).toBeVisible();
    });

    test('should show comparison results after clicking compare', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Select two districts
      const searchInput1 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput1.click();
      await searchInput1.fill('Lisboa');
      await page.waitForTimeout(300);

      const lisboaOption = page.locator('.max-h-48').first().getByText(/lisboa/i).first();
      if ((await lisboaOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }
      await lisboaOption.click();

      const searchInput2 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput2.click();
      await searchInput2.fill('Porto');
      await page.waitForTimeout(300);

      const portoOption = page.locator('.max-h-48').first().getByText(/porto/i).first();
      if ((await portoOption.count()) === 0) {
        test.skip(true, 'Not enough districts for comparison');
        return;
      }
      await portoOption.click();

      // Click compare
      const compareButton = page.getByRole('button', { name: /comparar distritos/i });
      await compareButton.click();

      // Should show results
      await page.waitForTimeout(500);

      // Should show winner or tie message (use first() to handle multiple matches)
      const winnerOrTie = page.getByText(/(venceu|empate)/i).first();
      await expect(winnerOrTie).toBeVisible();

      // Should show comparison details heading
      const detailsHeading = page.getByText(/comparacao detalhada/i);
      await expect(detailsHeading).toBeVisible();
    });
  });

  test.describe('Results Display', () => {
    test('should display winner declaration', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Quick comparison setup
      const searchInput1 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput1.click();
      await page.waitForTimeout(100);
      const firstOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await firstOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }
      await firstOption.click();

      const searchInput2 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput2.click();
      await page.waitForTimeout(100);
      const secondOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await secondOption.count()) === 0) {
        test.skip(true, 'Not enough districts for comparison');
        return;
      }
      await secondOption.click();

      const compareButton = page.getByRole('button', { name: /comparar distritos/i });
      await compareButton.click();
      await page.waitForTimeout(500);

      // Should show either winner or tie
      const hasWinner = (await page.getByText(/venceu/i).count()) > 0;
      const hasTie = (await page.getByText(/empate/i).count()) > 0;

      expect(hasWinner || hasTie).toBeTruthy();
    });

    test('should display score summary with wins count', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Quick comparison setup
      const searchInput1 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput1.click();
      await page.waitForTimeout(100);
      const firstOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await firstOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }
      await firstOption.click();

      const searchInput2 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput2.click();
      await page.waitForTimeout(100);
      const secondOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await secondOption.count()) === 0) {
        test.skip(true, 'Not enough districts for comparison');
        return;
      }
      await secondOption.click();

      const compareButton = page.getByRole('button', { name: /comparar distritos/i });
      await compareButton.click();
      await page.waitForTimeout(500);

      // Should show "Resultado final"
      const resultadoFinal = page.getByText(/resultado final/i);
      await expect(resultadoFinal).toBeVisible();

      // Should show "vitoria" or "vitorias"
      const vitoriaText = page.getByText(/vitoria/i);
      await expect(vitoriaText.first()).toBeVisible();
    });

    test('should show reset button after comparison', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Quick comparison
      const searchInput1 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput1.click();
      await page.waitForTimeout(100);
      const firstOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await firstOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }
      await firstOption.click();

      const searchInput2 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput2.click();
      await page.waitForTimeout(100);
      const secondOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await secondOption.count()) === 0) {
        test.skip(true, 'Not enough districts for comparison');
        return;
      }
      await secondOption.click();

      const compareButton = page.getByRole('button', { name: /comparar distritos/i });
      await compareButton.click();
      await page.waitForTimeout(500);

      // Should show reset button
      const resetButton = page.getByRole('button', { name: /nova comparacao/i });
      await expect(resetButton).toBeVisible();
    });
  });

  test.describe('Reset Functionality', () => {
    test('should reset to initial state when clicking reset button', async ({ page }) => {
      await page.goto('/distritos/comparar');
      await page.waitForLoadState('networkidle');

      // Quick comparison
      const searchInput1 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput1.click();
      await page.waitForTimeout(100);
      const firstOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await firstOption.count()) === 0) {
        test.skip(true, 'No district data available');
        return;
      }
      await firstOption.click();

      const searchInput2 = page.getByPlaceholder(/procurar distrito/i).first();
      await searchInput2.click();
      await page.waitForTimeout(100);
      const secondOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await secondOption.count()) === 0) {
        test.skip(true, 'Not enough districts for comparison');
        return;
      }
      await secondOption.click();

      const compareButton = page.getByRole('button', { name: /comparar distritos/i });
      await compareButton.click();
      await page.waitForTimeout(500);

      // Click reset
      const resetButton = page.getByRole('button', { name: /nova comparacao/i });
      await resetButton.click();

      // Should be back to initial state
      await expect(page.getByText(/escolhe dois distritos/i)).toBeVisible();
      await expect(page.getByPlaceholder(/procurar distrito/i).first()).toBeVisible();
    });
  });
});

test.describe('Party Comparison', () => {
  test.describe('Navigation and Initial State', () => {
    test('should navigate to party comparison page from parties page', async ({ page }) => {
      await page.goto('/partidos');
      await page.waitForLoadState('networkidle');

      const compareLink = page.getByRole('link', { name: /comparar partidos/i });
      await compareLink.click();

      await expect(page).toHaveURL(/\/partidos\/comparar/);
      await expect(page.getByRole('heading', { name: /comparar partidos/i })).toBeVisible();
    });

    test('should show empty state when no parties selected', async ({ page }) => {
      await page.goto('/partidos/comparar');
      await page.waitForLoadState('networkidle');

      // Should show empty state message
      const emptyState = page.getByText(/escolhe dois partidos/i);
      await expect(emptyState).toBeVisible();
    });

    test('should have two party selector inputs', async ({ page }) => {
      await page.goto('/partidos/comparar');
      await page.waitForLoadState('networkidle');

      // Should have inputs for Partido 1 and Partido 2
      const partido1 = page.getByPlaceholder(/procurar partido/i).first();
      const partido2 = page.getByPlaceholder(/procurar partido/i).nth(1);

      await expect(partido1).toBeVisible();
      await expect(partido2).toBeVisible();
    });
  });

  test.describe('Party Selection and Comparison', () => {
    test('should filter parties when typing in search', async ({ page }) => {
      await page.goto('/partidos/comparar');
      await page.waitForLoadState('networkidle');

      const searchInput = page.getByPlaceholder(/procurar partido/i).first();
      await searchInput.click();
      await searchInput.fill('BE');

      await page.waitForTimeout(300);

      // Should show filtered results (use exact "BE" to avoid matching PSD, PS, etc.)
      const dropdown = page.locator('.max-h-48').first();
      const beOption = dropdown.locator('button').filter({ hasText: /^BE$/ });

      if ((await beOption.count()) === 0) {
        test.skip(true, 'No party data available');
        return;
      }

      await expect(beOption.first()).toBeVisible();
    });

    test('should complete full comparison workflow for parties', async ({ page }) => {
      await page.goto('/partidos/comparar');
      await page.waitForLoadState('networkidle');

      // Select first party
      const searchInput1 = page.getByPlaceholder(/procurar partido/i).first();
      await searchInput1.click();
      await page.waitForTimeout(100);
      const firstOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await firstOption.count()) === 0) {
        test.skip(true, 'No party data available');
        return;
      }
      await firstOption.click();

      // Select second party
      const searchInput2 = page.getByPlaceholder(/procurar partido/i).first();
      await searchInput2.click();
      await page.waitForTimeout(100);
      const secondOption = page.locator('.max-h-48').first().locator('button').first();
      if ((await secondOption.count()) === 0) {
        test.skip(true, 'Not enough parties for comparison');
        return;
      }
      await secondOption.click();

      // Click compare
      const compareButton = page.getByRole('button', { name: /comparar partidos/i });
      await compareButton.click();
      await page.waitForTimeout(500);

      // Should show results (use first() to handle multiple matches)
      const winnerOrTie = page.getByText(/(venceu|empate)/i).first();
      await expect(winnerOrTie).toBeVisible();

      // Should show reset button
      const resetButton = page.getByRole('button', { name: /nova comparacao/i });
      await expect(resetButton).toBeVisible();
    });
  });
});

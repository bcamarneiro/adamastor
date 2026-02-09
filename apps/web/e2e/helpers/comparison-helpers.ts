/**
 * E2E Test Helpers for Comparison Pages
 *
 * Provides reusable helper functions for testing district and party comparison pages.
 * Reduces code duplication and makes tests more maintainable.
 */

import type { Page } from '@playwright/test';

/**
 * Selector configuration for district or party comparison
 */
interface SelectorConfig {
  /** Placeholder text in the search input */
  searchPlaceholder: string;
  /** Name of the compare button */
  compareButtonText: RegExp;
}

export const DISTRICT_CONFIG: SelectorConfig = {
  searchPlaceholder: 'Procurar distrito',
  compareButtonText: /comparar distritos/i,
};

export const PARTY_CONFIG: SelectorConfig = {
  searchPlaceholder: 'Procurar partido',
  compareButtonText: /comparar partidos/i,
};

/** CSS selector for option buttons inside the dropdown */
export const DROPDOWN_BUTTON_SELECTOR = '.bg-neutral-2.rounded-lg button';

/**
 * Opens a selector dropdown and waits for options to load
 *
 * @param page - Playwright page object
 * @param selectorIndex - Which selector to open (0 for first, 1 for second)
 * @param config - Selector configuration (district or party)
 * @returns The input element that was clicked
 */
export async function openSelector(
  page: Page,
  selectorIndex: number,
  config: SelectorConfig
): Promise<ReturnType<Page['locator']>> {
  const input = page
    .locator(`input[placeholder*="${config.searchPlaceholder}"]`)
    .nth(selectorIndex);
  await input.click();

  // Wait for dropdown container to appear (may be in loading state initially)
  // Using a more specific selector to avoid conflicts with global search input
  const dropdown = page
    .locator('.bg-neutral-2.rounded-lg')
    .filter({ has: page.locator('button, div:has-text("carregar")') })
    .first();
  
  await dropdown.waitFor({ state: 'visible' });

  // Wait for loading to complete - dropdown should have button elements (not just loading text)
  await dropdown
    .locator('button')
    .first()
    .waitFor({ state: 'visible', timeout: 10000 });

  return input;
}

/**
 * Gets the count of available options in the dropdown
 *
 * @param page - Playwright page object
 * @param config - Selector configuration
 * @returns Number of visible options
 */
export async function getOptionCount(page: Page, _config: SelectorConfig): Promise<number> {
  const options = page.locator(DROPDOWN_BUTTON_SELECTOR);
  return await options.count();
}

/**
 * Selects an option from the dropdown by index
 *
 * @param page - Playwright page object
 * @param optionIndex - Which option to select (0-based)
 * @param config - Selector configuration
 * @returns The name of the selected item
 */
export async function selectOption(
  page: Page,
  optionIndex: number,
  _config: SelectorConfig
): Promise<string | null> {
  const option = page.locator(DROPDOWN_BUTTON_SELECTOR).nth(optionIndex);

  // Get the name before clicking (it's in the semibold div)
  const name = await option.locator('div.font-semibold').first().textContent();
  await option.click();

  return name;
}

/**
 * Selects the first available option from the dropdown
 *
 * @param page - Playwright page object
 * @param config - Selector configuration (district or party)
 * @returns The name of the selected option, or null if no options available
 */
export async function selectFirstOption(
  page: Page,
  config: SelectorConfig
): Promise<string | null> {
  await openSelector(page, 0, config);

  const count = await getOptionCount(page, config);
  if (count === 0) {
    return null;
  }

  return await selectOption(page, 0, config);
}

/**
 * Selects the second available option (different from first)
 *
 * @param page - Playwright page object
 * @param config - Selector configuration (district or party)
 * @returns The name of the selected option, or null if no options available
 */
export async function selectSecondOption(
  page: Page,
  config: SelectorConfig
): Promise<string | null> {
  // After the first selection, the first selector replaces its input with a selected-item card.
  // Only one input remains on the page, so the second selector is at index 0.
  await openSelector(page, 0, config);

  const count = await getOptionCount(page, config);
  if (count === 0) {
    return null;
  }

  // Select the second option in the list (index 1) if available, otherwise select the first (index 0)
  // This handles cases where only one option remains after the first selection
  const optionIndex = count >= 2 ? 1 : 0;
  return await selectOption(page, optionIndex, config);
}

/**
 * Performs a search in the selector input
 *
 * @param page - Playwright page object
 * @param selectorIndex - Which selector to search in
 * @param searchTerm - Text to search for
 * @param config - Selector configuration
 */
export async function searchInSelector(
  page: Page,
  selectorIndex: number,
  searchTerm: string,
  config: SelectorConfig
): Promise<void> {
  const input = await openSelector(page, selectorIndex, config);
  await input.fill(searchTerm);

  // Wait for filtering to complete by checking that the dropdown content has stabilized
  // Using a more specific selector to target only comparison selector dropdowns
  await page
    .waitForFunction(
      () => {
        const dropdowns = Array.from(document.querySelectorAll('.bg-neutral-2.rounded-lg'));
        const comparisonDropdown = dropdowns.find((el) => el.querySelector('button'));
        return comparisonDropdown && comparisonDropdown.textContent !== '';
      },
      undefined,
      { timeout: 2000 }
    )
    .catch(() => {
      // Timeout is acceptable - dropdown might be empty after filtering
    });
}

/**
 * Clicks the clear button for a selected item
 *
 * @param page - Playwright page object
 * @param index - Which selector to clear (0 or 1)
 */
export async function clearSelection(page: Page, index: number): Promise<void> {
  const clearButton = page.locator('button[aria-label*="Limpar"]').nth(index);
  await clearButton.click();
}

/**
 * Clicks the compare button
 *
 * @param page - Playwright page object
 * @param config - Selector configuration
 */
export async function clickCompareButton(page: Page, config: SelectorConfig): Promise<void> {
  const compareButton = page.getByRole('button', { name: config.compareButtonText });
  await compareButton.click();

  // Wait for results to render by checking for winner/tie section
  await page.locator('text=/venceu|Empate/i').first().waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Clicks the reset/new comparison button
 *
 * @param page - Playwright page object
 */
export async function clickResetButton(page: Page): Promise<void> {
  const resetButton = page.getByRole('button', { name: /nova comparacao/i });
  await resetButton.click();
}

/**
 * Checks if comparison results are displayed
 *
 * @param page - Playwright page object
 * @returns Object with visibility status of result elements
 */
export async function checkComparisonResults(page: Page) {
  return {
    hasWinnerSection: await page.locator('text=/venceu|Empate/i').first().isVisible(),
    hasComparisonHeading: await page
      .getByRole('heading', { name: /comparacao detalhada/i })
      .isVisible(),
    hasResetButton: await page.getByRole('button', { name: /nova comparacao/i }).isVisible(),
  };
}

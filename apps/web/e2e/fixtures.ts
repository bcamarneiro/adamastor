import { type Locator, type Page, test as base } from '@playwright/test';

/**
 * Opens the mobile navigation menu by clicking the hamburger button.
 * Only works on mobile viewports (< 768px width).
 */
export async function openMobileMenu(page: Page) {
  // Find and click the mobile menu button (hamburger icon)
  const menuButton = page.getByRole('button', { name: /abrir menu/i });
  await menuButton.click();
  // Wait for menu to be visible
  await page.locator('#mobile-navigation').waitFor({ state: 'visible' });
}

/**
 * Checks if the current viewport is mobile (< 768px width).
 */
export function isMobileViewport(viewport: { width: number; height: number } | null): boolean {
  return viewport ? viewport.width < 768 : false;
}

/**
 * Returns the navigation container scoped to the current viewport.
 * On mobile, returns the #mobile-navigation container (must call openMobileMenu first).
 * On desktop, returns the full page.
 */
export function getNavContainer(
  page: Page,
  viewport: { width: number; height: number } | null
): Locator | Page {
  if (isMobileViewport(viewport)) {
    return page.locator('#mobile-navigation');
  }
  return page;
}

/**
 * Custom test fixtures that dismiss the onboarding modal.
 * This prevents the modal from blocking all pointer events during E2E tests.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Dismiss onboarding modal before each test by setting localStorage
    await page.addInitScript(() => {
      localStorage.setItem('debaixo-dolho-onboarding-dismissed', 'true');
      localStorage.setItem('debaixo-dolho-visited', new Date().toISOString());
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';

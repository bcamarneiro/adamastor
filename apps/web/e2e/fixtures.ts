import { test as base } from '@playwright/test';

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

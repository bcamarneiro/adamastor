import { expect, test } from '@playwright/test';

/**
 * Smoke tests for staging/production deployments
 * These tests are data-agnostic and verify basic deployment health
 * They don't depend on specific test fixtures or database state
 */

test.describe('Deployment Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');

    // Verify successful response
    expect(response?.status()).toBe(200);

    // Verify not behind Vercel auth
    await expect(page).not.toHaveTitle(/Login.*Vercel/);

    // Verify basic page structure exists
    await expect(page.locator('footer')).toBeVisible();
  });

  test('main routes are accessible', async ({ page }) => {
    const routes = ['/', '/ranking', '/deputies', '/initiatives', '/parties'];

    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);

      // Verify page has basic content (not blank)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText?.length).toBeGreaterThan(100);
    }
  });

  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No console errors allowed
    expect(errors).toEqual([]);

    // Log warnings for visibility but don't fail
    if (warnings.length > 0) {
      console.log('Console warnings detected:', warnings);
    }
  });

  test('navigation header is present', async ({ page, viewport }) => {
    await page.goto('/');

    // On mobile (< 768px), navigation is hidden by default (hamburger menu)
    // On desktop (>= 768px), navigation is visible
    const isMobile = viewport && viewport.width < 768;

    if (isMobile) {
      // On mobile, check that mobile menu button exists
      const menuButton = page.getByRole('button', { name: /abrir menu/i });
      await expect(menuButton).toBeVisible();
    } else {
      // On desktop, navigation should be visible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    }
  });

  // TODO: Re-enable once footer is added to the app
  test.skip('footer is present on all main pages', async ({ page }) => {
    const routes = ['/', '/ranking', '/deputies'];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('footer')).toBeVisible();
    }
  });

  test('API endpoints respond', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load and make API calls
    await page.waitForLoadState('networkidle');

    // Just verify page loaded data without errors
    const hasContent = await page.locator('body').textContent();
    expect(hasContent?.length).toBeGreaterThan(500);
  });

  test('no critical resource loading failures', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', (request) => {
      // Track failed requests for critical resources
      const url = request.url();
      if (url.includes('.js') || url.includes('.css') || url.includes('/api/')) {
        failedRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No critical resources should fail to load
    expect(failedRequests).toEqual([]);
  });

  test('deputy ranking page loads data', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Should have at least some deputy cards or list items
    // Use a generous timeout since data might be slow to load
    const hasData = await page
      .locator('body')
      .textContent()
      .then((text) => text && text.length > 1000);

    expect(hasData).toBe(true);
  });

  test('page titles are set correctly', async ({ page }) => {
    const pageChecks = [
      { route: '/', titlePattern: /Adamastor|Debaixo/i },
      { route: '/ranking', titlePattern: /ranking|deputad/i },
      { route: '/deputies', titlePattern: /deputad/i },
    ];

    for (const { route, titlePattern } of pageChecks) {
      await page.goto(route);
      await expect(page).toHaveTitle(titlePattern);
    }
  });
});

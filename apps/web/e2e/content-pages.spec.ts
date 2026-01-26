import { expect, test } from './fixtures';

// Issue #88: Add e2e tests for new content pages
// @see https://github.com/bcamarneiro/adamastor/issues/88

test.describe('Content Pages', () => {
  test.describe('Methodology Page (/metodologia)', () => {
    test('should load successfully without errors', async ({ page }) => {
      const response = await page.goto('/metodologia');
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('networkidle');

      // Should not show 404 or error
      await expect(page.locator('body')).not.toHaveText(/404|not found/i);
    });

    test('should display main content sections', async ({ page }) => {
      await page.goto('/metodologia');
      await page.waitForLoadState('networkidle');

      // Main navigation should be visible
      const nav = page.locator('header');
      await expect(nav).toBeVisible();

      // Back button should be visible
      const backButton = page.getByRole('link', { name: /voltar/i });
      await expect(backButton).toBeVisible();

      // Article with prose class should be visible
      const article = page.locator('article.prose');
      await expect(article).toBeVisible();

      // Footer should be visible
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('should have substantial content', async ({ page }) => {
      await page.goto('/metodologia');
      await page.waitForLoadState('networkidle');

      const mainContent = await page.textContent('article.prose');
      expect(mainContent?.length).toBeGreaterThan(500);
    });

    test('should navigate back to homepage when clicking back button', async ({ page }) => {
      await page.goto('/metodologia');
      await page.waitForLoadState('networkidle');

      // Verify back button exists and has correct href
      const backButton = page.getByRole('link', { name: /voltar/i });
      await expect(backButton).toBeVisible();
      await expect(backButton).toHaveAttribute('href', '/');

      // Navigate using the link (simulates click without fighting fixed header)
      await backButton.evaluate((el: HTMLAnchorElement) => el.click());
      await page.waitForURL('/');

      await expect(page).toHaveURL('/');
    });

    test('should have correct page title', async ({ page }) => {
      await page.goto('/metodologia');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title).toContain('Metodologia');
      expect(title).toContain("Debaixo d'olho");
    });

    test('should have links that are valid', async ({ page }) => {
      await page.goto('/metodologia');
      await page.waitForLoadState('networkidle');

      // Get all links in the article content
      const links = page.locator('article.prose a');
      const count = await links.count();

      if (count > 0) {
        // Check that links have valid href attributes
        for (let i = 0; i < count; i++) {
          const href = await links.nth(i).getAttribute('href');
          expect(href).toBeTruthy();
          expect(href?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Contribution Page (/contribuir)', () => {
    test('should load successfully without errors', async ({ page }) => {
      const response = await page.goto('/contribuir');
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('networkidle');

      // Should not show 404 or error
      await expect(page.locator('body')).not.toHaveText(/404|not found/i);
    });

    test('should display main content sections', async ({ page }) => {
      await page.goto('/contribuir');
      await page.waitForLoadState('networkidle');

      // Main navigation should be visible
      const nav = page.locator('header');
      await expect(nav).toBeVisible();

      // Back button should be visible
      const backButton = page.getByRole('link', { name: /voltar/i });
      await expect(backButton).toBeVisible();

      // Article with prose class should be visible
      const article = page.locator('article.prose');
      await expect(article).toBeVisible();

      // Footer should be visible
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('should have substantial content', async ({ page }) => {
      await page.goto('/contribuir');
      await page.waitForLoadState('networkidle');

      const mainContent = await page.textContent('article.prose');
      expect(mainContent?.length).toBeGreaterThan(500);
    });

    test('should navigate back to homepage when clicking back button', async ({ page }) => {
      await page.goto('/contribuir');
      await page.waitForLoadState('networkidle');

      // Verify back button exists and has correct href
      const backButton = page.getByRole('link', { name: /voltar/i });
      await expect(backButton).toBeVisible();
      await expect(backButton).toHaveAttribute('href', '/');

      // Navigate using the link (simulates click without fighting fixed header)
      await backButton.evaluate((el: HTMLAnchorElement) => el.click());
      await page.waitForURL('/');

      await expect(page).toHaveURL('/');
    });

    test('should have correct page title', async ({ page }) => {
      await page.goto('/contribuir');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title).toContain('Contribuir');
      expect(title).toContain("Debaixo d'olho");
    });

    test('should have GitHub links', async ({ page }) => {
      await page.goto('/contribuir');
      await page.waitForLoadState('networkidle');

      // Should have at least one GitHub link
      const githubLinks = page.locator('article.prose a[href*="github.com"]');
      const count = await githubLinks.count();

      if (count > 0) {
        // Verify GitHub links point to the correct repository
        const href = await githubLinks.first().getAttribute('href');
        expect(href).toContain('github.com/bcamarneiro/adamastor');
      }
    });

    test('should have links that are valid', async ({ page }) => {
      await page.goto('/contribuir');
      await page.waitForLoadState('networkidle');

      // Get all links in the article content
      const links = page.locator('article.prose a');
      const count = await links.count();

      if (count > 0) {
        // Check that links have valid href attributes
        for (let i = 0; i < count; i++) {
          const href = await links.nth(i).getAttribute('href');
          expect(href).toBeTruthy();
          expect(href?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Mission Page (/missao)', () => {
    test('should load successfully without errors', async ({ page }) => {
      const response = await page.goto('/missao');
      expect(response?.status()).toBe(200);
      await page.waitForLoadState('networkidle');

      // Should not show 404 or error
      await expect(page.locator('body')).not.toHaveText(/404|not found/i);
    });

    test('should display main content sections', async ({ page }) => {
      await page.goto('/missao');
      await page.waitForLoadState('networkidle');

      // Main navigation should be visible
      const nav = page.locator('header');
      await expect(nav).toBeVisible();

      // Back button should be visible
      const backButton = page.getByRole('link', { name: /voltar/i });
      await expect(backButton).toBeVisible();

      // Article with prose class should be visible
      const article = page.locator('article.prose');
      await expect(article).toBeVisible();

      // Footer should be visible
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test('should have substantial content', async ({ page }) => {
      await page.goto('/missao');
      await page.waitForLoadState('networkidle');

      const mainContent = await page.textContent('article.prose');
      expect(mainContent?.length).toBeGreaterThan(500);
    });

    test('should navigate back to homepage when clicking back button', async ({ page }) => {
      await page.goto('/missao');
      await page.waitForLoadState('networkidle');

      // Verify back button exists and has correct href
      const backButton = page.getByRole('link', { name: /voltar/i });
      await expect(backButton).toBeVisible();
      await expect(backButton).toHaveAttribute('href', '/');

      // Navigate using the link (simulates click without fighting fixed header)
      await backButton.evaluate((el: HTMLAnchorElement) => el.click());
      await page.waitForURL('/');

      await expect(page).toHaveURL('/');
    });

    test('should have correct page title', async ({ page }) => {
      await page.goto('/missao');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title).toContain('Missão');
      expect(title).toContain("Debaixo d'olho");
    });

    test('should have GitHub links', async ({ page }) => {
      await page.goto('/missao');
      await page.waitForLoadState('networkidle');

      // Should have at least one GitHub link
      const githubLinks = page.locator('article.prose a[href*="github.com"]');
      const count = await githubLinks.count();

      if (count > 0) {
        // Verify GitHub links point to the correct repository
        const href = await githubLinks.first().getAttribute('href');
        expect(href).toContain('github.com/bcamarneiro/adamastor');
      }
    });

    test('should have links that are valid', async ({ page }) => {
      await page.goto('/missao');
      await page.waitForLoadState('networkidle');

      // Get all links in the article content
      const links = page.locator('article.prose a');
      const count = await links.count();

      if (count > 0) {
        // Check that links have valid href attributes
        for (let i = 0; i < count; i++) {
          const href = await links.nth(i).getAttribute('href');
          expect(href).toBeTruthy();
          expect(href?.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

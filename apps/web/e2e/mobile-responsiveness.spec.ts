import { expect, test } from './fixtures';

test.describe('Mobile Responsiveness', () => {
  test('Homepage should render correctly on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that the page title is correct
    await expect(page).toHaveTitle(/Debaixo d'olho/i);

    // Check that main heading is visible
    await expect(page.getByRole('heading', { name: /acompanha o teu deputado/i })).toBeVisible();

    // Check for the footer
    await expect(page.locator('footer')).toBeVisible();

    // Check that there's interactive content (buttons or links)
    const interactiveElements = page.locator('button, a').first();
    await expect(interactiveElements).toBeVisible();
  });

  test('Deputy ranking page should be scrollable on mobile', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Check that the page loaded
    await expect(page).toHaveTitle(/ranking|debaixo d'olho/i);

    // Verify no horizontal scrolling is required
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
  });

  test('All text should be readable on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify that important text is large enough to read
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();

    if (headingCount > 0) {
      const firstHeading = headings.first();
      await expect(firstHeading).toBeVisible();

      const fontSize = await firstHeading.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      // Font size should be at least 14px for readability on mobile
      const fontSizeNum = Number.parseFloat(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(14);
    }
  });

  test('Touch targets should be adequate size on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find clickable elements (buttons and links)
    const clickables = page.locator('button:visible, a:visible');
    const count = await clickables.count();

    if (count > 0) {
      // Check a few different interactive elements
      for (let i = 0; i < Math.min(3, count); i++) {
        const element = clickables.nth(i);
        const box = await element.boundingBox();

        if (box) {
          // Touch targets should ideally be at least 44x44px
          // But we'll be lenient and just check they're reasonably sized
          expect(box.height).toBeGreaterThanOrEqual(24);
          expect(box.width).toBeGreaterThanOrEqual(24);
        }
      }
    }
  });

  test('No content should overflow horizontally on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check homepage for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('Deputy profile page should render correctly on mobile', async ({ page }) => {
    // Navigate to ranking first
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Find and click a deputy link
    const deputyLinks = page.locator('a[href*="/deputados/"], a[href*="/deputy/"]');
    const linkCount = await deputyLinks.count();

    if (linkCount > 0) {
      await deputyLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Verify the deputy profile page loaded
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();

      // Check for horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
    } else {
      test.skip();
    }
  });

  test('Ranking page should have no horizontal overflow', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Check ranking page for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});

import { expect, test } from './fixtures';

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/Debaixo d'olho/i);
  });

  test('should display the main navigation', async ({ page, viewport }) => {
    await page.goto('/');

    // On mobile, check for hamburger menu button; on desktop, check for nav links
    if (viewport && viewport.width < 768) {
      // Mobile: verify hamburger menu button is visible
      const menuButton = page.getByRole('button', { name: /abrir menu/i });
      await expect(menuButton).toBeVisible();
    } else {
      // Desktop: check for navigation links directly
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });

  test('should display the footer', async ({ page }) => {
    await page.goto('/');

    // Check footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  // Issue #35: Footer section titles low contrast
  // @see https://github.com/bcamarneiro/adamastor/issues/35
  test('footer should have readable section titles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const footerHeadings = footer.locator('h3, h4, [class*="title"], strong');

    if ((await footerHeadings.count()) > 0) {
      const firstHeading = footerHeadings.first();
      await expect(firstHeading).toBeVisible();

      const headingText = await firstHeading.textContent();
      expect(headingText?.trim().length).toBeGreaterThan(0);
    }
  });

  // Issue #90: Loading string flash
  // @see https://github.com/bcamarneiro/adamastor/issues/90
  test('should not flash "assembleia" loading text', async ({ page }) => {
    await page.goto('/');

    const assembleiaText = page.getByText(/^assembleia$/i);

    await expect(assembleiaText)
      .not.toBeVisible({ timeout: 1000 })
      .catch(() => {
        throw new Error('"assembleia" loading text was visible - regression of #90');
      });
  });

  // Issue #92: Homepage tabs broken
  // @see https://github.com/bcamarneiro/adamastor/issues/92
  test('should display content sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroSection = page.locator('section, [class*="hero"]').first();
    await expect(heroSection).toBeVisible();

    // Find the features section and verify it has content
    const featuresSection = page
      .locator('section')
      .filter({ hasText: /funcionalidades/i })
      .first();

    if ((await featuresSection.count()) > 0) {
      const sectionText = await featuresSection.textContent();
      // Verify the section has more than just the title "funcionalidades"
      expect(sectionText?.trim().length).toBeGreaterThan(20);
    }
  });

  // Issue #92: Homepage tabs broken
  // @see https://github.com/bcamarneiro/adamastor/issues/92
  test('tabs should be clickable if present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tabList = page.getByRole('tablist').first();

    if ((await tabList.count()) > 0) {
      const tabs = tabList.getByRole('tab');
      const tabCount = await tabs.count();

      if (tabCount > 1) {
        await tabs.nth(1).click();
        await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');

        const tabPanel = page.getByRole('tabpanel').first();
        const panelText = await tabPanel.textContent();
        expect(panelText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  // Issue #93: "Começar Agora" button link
  // @see https://github.com/bcamarneiro/adamastor/issues/93
  test('"Começar Agora" button should link to /contribuir', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const comecarButton = page.getByRole('link', { name: /começar agora/i }).first();

    if ((await comecarButton.count()) === 0) {
      const altButton = page
        .locator('a')
        .filter({ hasText: /começar agora/i })
        .first();
      if ((await altButton.count()) === 0) {
        test.skip();
        return;
      }
      await altButton.click();
    } else {
      await comecarButton.click();
    }

    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/contribuir');
  });
});

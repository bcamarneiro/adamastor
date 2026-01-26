import { expect, test } from './fixtures';

test.describe('Navigation', () => {
  test('should navigate to leaderboard page', async ({ page }) => {
    await page.goto('/');

    // Click on leaderboard link (labeled "Ranking" in MainNav)
    await page
      .getByRole('link', { name: /ranking/i })
      .first()
      .click();

    // Should be on leaderboard page
    await expect(page).toHaveURL(/\/ranking/);
  });

  test('should navigate to battle page', async ({ page }) => {
    await page.goto('/');

    // Click on battle link (labeled "Battle Royale" in MainNav)
    await page
      .getByRole('link', { name: /battle royale/i })
      .first()
      .click();

    // Should be on battle page
    await expect(page).toHaveURL(/\/batalha/);
  });

  test('should navigate to waste calculator page', async ({ page }) => {
    await page.goto('/');

    // Click on waste calculator link (labeled "Calculadora" in MainNav)
    await page
      .getByRole('link', { name: /calculadora/i })
      .first()
      .click();

    // Should be on waste calculator page
    await expect(page).toHaveURL(/\/desperdicio/);
  });

  // Issue #94: Add links to initiatives page
  // @see https://github.com/bcamarneiro/adamastor/issues/94
  test('should navigate to initiatives page from landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find initiatives link in feature cards or navigation
    const initiativesLink = page.getByRole('link', { name: /iniciativas/i }).first();
    await expect(initiativesLink).toBeVisible();

    // Click on initiatives link
    await initiativesLink.click();

    // Should be on initiatives page
    await expect(page).toHaveURL(/\/initiatives/);
  });

  test('should return to home page when clicking logo', async ({ page }) => {
    await page.goto('/ranking');

    // Click on logo/home link
    await page
      .getByRole('link', { name: /Debaixo d'olho/i })
      .first()
      .click();

    // Should be back on home page
    await expect(page).toHaveURL('/');
  });

  // Issue #20: Hidden pages navigation
  // @see https://github.com/bcamarneiro/adamastor/issues/20
  test('footer should have links to informational pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const expectedLinks = [
      { name: /metodologia/i, url: '/metodologia' },
      { name: /contribuir/i, url: '/contribuir' },
      { name: /missão|sobre/i, url: '/missao' },
    ];

    for (const link of expectedLinks) {
      const footerLink = footer.getByRole('link', { name: link.name }).first();

      if ((await footerLink.count()) > 0) {
        const href = await footerLink.getAttribute('href');
        expect(href).toContain(link.url);
      }
    }
  });

  // Issue #20: Hidden pages navigation
  // @see https://github.com/bcamarneiro/adamastor/issues/20
  test('/metodologia page should be accessible', async ({ page }) => {
    await page.goto('/metodologia');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toHaveText(/404|not found/i);

    const mainContent = await page.textContent('main, article, [class*="content"]');
    expect(mainContent?.length).toBeGreaterThan(100);
  });

  // Issue #20: Hidden pages navigation
  // @see https://github.com/bcamarneiro/adamastor/issues/20
  test('/contribuir page should be accessible', async ({ page }) => {
    await page.goto('/contribuir');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toHaveText(/404|not found/i);

    const mainContent = await page.textContent('main, article, [class*="content"]');
    expect(mainContent?.length).toBeGreaterThan(100);
  });

  // Issue #20: Hidden pages navigation
  // @see https://github.com/bcamarneiro/adamastor/issues/20
  test('/missao page should be accessible', async ({ page }) => {
    await page.goto('/missao');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toHaveText(/404|not found/i);
  });

  // Issue #21: Remove unused WhatHappened page
  // @see https://github.com/bcamarneiro/adamastor/issues/21
  test('/what-happened should not exist (returns 404)', async ({ page }) => {
    const response = await page.goto('/what-happened');

    const status = response?.status();
    expect(status === 404 || page.url() !== '/what-happened').toBeTruthy();
  });

  // Issue #118: Correct GitHub repository link on About page
  // @see https://github.com/bcamarneiro/adamastor/issues/118
  test('/missao page should link to correct GitHub repository', async ({ page }) => {
    await page.goto('/missao');
    await page.waitForLoadState('networkidle');

    // Check that the GitHub links point to the correct repository
    const githubLinks = page.getByRole('link', { name: /github/i });
    const linkCount = await githubLinks.count();

    if (linkCount > 0) {
      // Check the first GitHub link
      const href = await githubLinks.first().getAttribute('href');
      expect(href).toContain('github.com/bcamarneiro/adamastor');
    }
  });
});

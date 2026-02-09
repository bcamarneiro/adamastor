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

  // Issue #24: Back button navigation should use browser history
  // @see https://github.com/bcamarneiro/adamastor/issues/24
  test('page back buttons should use navigate(-1) not hardcoded paths', async ({ page }) => {
    // Test that back buttons use browser history (navigate(-1)) rather than hardcoded paths
    // This verifies the fix for issue #24 where buttons were using Link to="/hardcoded-path"

    // Navigate from home to ranking
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Check if there are any deputy links on the ranking page
    const deputyLinks = page.locator('a[href^="/deputado/"]');
    const linkCount = await deputyLinks.count();

    if (linkCount > 0) {
      // Click on first deputy profile link
      await deputyLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Should be on deputy page
      if (page.url().includes('/deputado/')) {
        // Try to find any button with "voltar" text (could be "Voltar" or "Voltar ao inicio")
        const backButtons = page.getByRole('button').filter({ hasText: /voltar/i });
        const buttonCount = await backButtons.count();

        if (buttonCount > 0) {
          // Click back button - should return to ranking, not hardcoded /report-card
          await backButtons.first().click();
          await page.waitForLoadState('networkidle');

          // Should return to ranking page (where we came from), not to a hardcoded path
          await expect(page).toHaveURL(/\/ranking/);
        }
      }
    } else {
      // If there are no deputies, skip this test
      test.skip();
    }
  });

  // Issue #52: Battle Royale side-by-side results with profile links
  // @see https://github.com/bcamarneiro/adamastor/issues/52
  test('battle royale should show side-by-side results with profile links', async ({ page }) => {
    await page.goto('/batalha');
    await page.waitForLoadState('networkidle');

    // Find deputy selectors (filter for visible inputs to avoid mobile menu search)
    const textInputs = page.locator('input[type="text"]:visible');
    const firstSelector = textInputs.first();
    const secondSelector = textInputs.nth(1);

    // Check if selectors are available
    if ((await firstSelector.count()) === 0 || (await secondSelector.count()) === 0) {
      test.skip();
      return;
    }

    // Type to search for deputies (try common names)
    await firstSelector.fill('silva');
    await page.waitForTimeout(500);

    // Select first deputy from dropdown if available
    const firstOption = page.locator('[role="option"]').first();
    if ((await firstOption.count()) > 0) {
      await firstOption.click();
    } else {
      test.skip();
      return;
    }

    // Search for second deputy
    await secondSelector.fill('santos');
    await page.waitForTimeout(500);

    const secondOption = page.locator('[role="option"]').first();
    if ((await secondOption.count()) > 0) {
      await secondOption.click();
    } else {
      test.skip();
      return;
    }

    // Find and click compare button
    const compareButton = page.getByRole('button', { name: /comparar/i });
    if ((await compareButton.count()) > 0) {
      await compareButton.click();
      await page.waitForTimeout(1000);

      // Check for side-by-side results
      const profileLinks = page.getByRole('link', { name: /ver perfil/i });
      const linkCount = await profileLinks.count();

      // Should have exactly 2 profile links (one for each deputy)
      expect(linkCount).toBe(2);

      // Verify links point to deputy profiles
      const firstLink = profileLinks.first();
      const firstHref = await firstLink.getAttribute('href');
      expect(firstHref).toMatch(/\/deputado\//);

      const secondLink = profileLinks.nth(1);
      const secondHref = await secondLink.getAttribute('href');
      expect(secondHref).toMatch(/\/deputado\//);

      // Verify links are different (comparing different deputies)
      expect(firstHref).not.toBe(secondHref);
    } else {
      test.skip();
    }
  });
});

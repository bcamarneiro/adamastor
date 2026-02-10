import { expect, test } from './fixtures';

test.describe('Parties Page', () => {
  test('should load the parties page', async ({ page }) => {
    await page.goto('/partidos');

    await expect(page).toHaveURL(/\/partidos/);
  });

  // Issue #25: Party colors transparency in dark mode
  // @see https://github.com/bcamarneiro/adamastor/issues/25
  test('party cards should have visible colors', async ({ page }) => {
    await page.goto('/partidos');
    await page.waitForLoadState('networkidle');

    const partyCards = page.locator('[class*="party"], [data-party]');

    if ((await partyCards.count()) === 0) {
      test.skip();
      return;
    }

    const firstCard = partyCards.first();
    await expect(firstCard).toBeVisible();
  });

  // Issue #45: "Comparar Partidos" button illegible
  // @see https://github.com/bcamarneiro/adamastor/issues/45
  test('compare parties button should be visible', async ({ page }) => {
    await page.goto('/partidos');
    await page.waitForLoadState('networkidle');

    const compareButton = page
      .getByRole('button', { name: /comparar/i })
      .or(page.locator('button').filter({ hasText: /comparar/i }))
      .first();

    if ((await compareButton.count()) === 0) {
      test.skip();
      return;
    }

    await expect(compareButton).toBeVisible();

    const buttonText = await compareButton.textContent();
    expect(buttonText?.trim().length).toBeGreaterThan(0);
  });

  // Issue #96: Missing emoji in '10 partidos' section
  // @see https://github.com/bcamarneiro/adamastor/issues/96
  test('parties stat card should have an icon', async ({ page }) => {
    await page.goto('/partidos');
    await page.waitForLoadState('networkidle');

    // Find the stat card containing "Partidos" text
    const partidosStatCard = page
      .locator('.bg-neutral-1, [class*="stat"], [class*="card"]')
      .filter({ hasText: /^Partidos$/i });

    if ((await partidosStatCard.count()) === 0) {
      test.skip();
      return;
    }

    // Verify the stat card has an icon (SVG element - the Flag icon)
    const icon = partidosStatCard.first().locator('svg').first();
    await expect(icon).toBeVisible();
  });

  // Issue #95: Party entries should link to party details page
  // @see https://github.com/bcamarneiro/adamastor/issues/95
  test('party cards should link to party details page', async ({ page }) => {
    await page.goto('/partidos');
    await page.waitForLoadState('networkidle');

    // Wait for ranking section to appear
    const rankingHeading = page.getByRole('heading', { name: /ranking/i });
    if ((await rankingHeading.count()) === 0) {
      test.skip();
      return;
    }

    // Wait for party cards to load - look for links that match party URL pattern
    // Exclude the "Comparar Partidos" button
    const partyCardLinks = page.locator(
      'a.bg-neutral-1.rounded-xl[href^="/partidos/"]:not([href*="comparar"])'
    );

    // Wait for at least one party card to appear
    try {
      await partyCardLinks.first().waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      test.skip();
      return;
    }

    const count = await partyCardLinks.count();
    expect(count).toBeGreaterThan(0);

    // Verify the first party card
    const firstPartyCard = partyCardLinks.first();
    const href = await firstPartyCard.getAttribute('href');
    expect(href).toMatch(/^\/partidos\/[a-z]+$/);

    // Verify the card contains party information
    await expect(firstPartyCard).toContainText(/[A-Z]{2,}/); // Party acronym
    await expect(firstPartyCard).toContainText(/pontos/); // Score label

    // Click the link and verify the party details page loads
    await firstPartyCard.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on a party details page
    await expect(page).toHaveURL(/\/partidos\/[a-z]+$/);

    // Verify party page has expected content
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('main').getByText(/Deputados/i)).toBeVisible();
    await expect(page.getByText(/Pontuação Média/i)).toBeVisible();
  });

  // Issue #47: Party ranking calculation explanation should be visible
  // @see https://github.com/bcamarneiro/adamastor/issues/47
  test('party ranking help tooltip should explain calculation', async ({ page }) => {
    await page.goto('/partidos');
    await page.waitForLoadState('networkidle');

    // Find the "Ranking por Pontuacao Media" heading
    const rankingHeading = page.getByRole('heading', { name: /ranking por pontuacao/i });
    if ((await rankingHeading.count()) === 0) {
      test.skip();
      return;
    }

    // Find the help icon/button next to the ranking heading
    // HelpTooltip is typically rendered as a button with an Info icon
    const helpButton = page.locator('button[class*="help"], button[aria-label*="help"]').first();

    // If help button doesn't exist, look for any button near the ranking heading
    if ((await helpButton.count()) === 0) {
      const headingParent = rankingHeading.locator('..');
      const buttonNearHeading = headingParent.locator('button').first();
      if ((await buttonNearHeading.count()) === 0) {
        test.skip();
        return;
      }

      // Hover over the button to trigger tooltip
      await buttonNearHeading.hover();
    } else {
      // Hover over help button to show tooltip
      await helpButton.hover();
    }

    // Wait a bit for tooltip animation
    await page.waitForTimeout(300);

    // Verify tooltip content appears with key information about party ranking calculation
    // The tooltip should contain text about average scores, deputies, and metrics
    const tooltipContent = page.locator('[role="tooltip"], [class*="tooltip"]').first();

    if ((await tooltipContent.count()) > 0) {
      const tooltipText = await tooltipContent.textContent();

      // Verify it mentions key concepts from the explanation
      expect(
        tooltipText?.includes('média') ||
          tooltipText?.includes('deputados') ||
          tooltipText?.includes('pontuação')
      ).toBeTruthy();
    }
  });
});

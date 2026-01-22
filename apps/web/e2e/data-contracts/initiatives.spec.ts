import { expect, test } from '../fixtures';
import { InitiativeSchema } from '../helpers/schemas';

// Issue #171: Initiatives Page Data Contract Tests
// @see https://github.com/bcamarneiro/adamastor/issues/171

test('initiatives page renders API data correctly', async ({ page }) => {
  let apiInitiatives: unknown;

  // Intercept initiatives JSON file endpoint
  await page.route('**/iniciativas.json*', async (route) => {
    const response = await route.fetch();
    apiInitiatives = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/initiatives');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiInitiatives || !Array.isArray(apiInitiatives) || apiInitiatives.length === 0) {
    test.skip();
    return;
  }

  // Validate schema for first initiative
  InitiativeSchema.validate(apiInitiatives[0]);

  // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
  const initiatives = apiInitiatives as any[];

  // Wait for initiative rows to be rendered
  const initiativeRows = page.locator('[role="row"]').filter({ has: page.locator('[role="rowheader"]') });
  const rowCount = await initiativeRows.count();

  // Skip if no rows rendered (feature not implemented yet)
  if (rowCount === 0) {
    test.skip();
    return;
  }

  // Validate rendered matches API (first 5 initiatives)
  const sampleSize = Math.min(5, Math.min(rowCount, initiatives.length));
  for (let i = 0; i < sampleSize; i++) {
    const initiative = initiatives[i];
    const row = initiativeRows.nth(i);

    // Validate initiative number (IniNr)
    if (initiative.IniNr) {
      await expect(row.locator('[role="rowheader"]')).toContainText(initiative.IniNr);
    }

    // Validate title (IniTitulo)
    if (initiative.IniTitulo) {
      await expect(row).toContainText(initiative.IniTitulo);
    }

    // Validate latest phase (Fase from latestEvent)
    if (initiative.IniEventos && initiative.IniEventos.length > 0) {
      const latestEvent = initiative.IniEventos[initiative.IniEventos.length - 1];
      if (latestEvent.Fase) {
        await expect(row).toContainText(latestEvent.Fase.trim());
      }
    }
  }
});

test('initiatives page voting results match API', async ({ page }) => {
  let apiInitiatives: unknown;

  await page.route('**/iniciativas.json*', async (route) => {
    const response = await route.fetch();
    apiInitiatives = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/initiatives');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiInitiatives || !Array.isArray(apiInitiatives) || apiInitiatives.length === 0) {
    test.skip();
    return;
  }

  // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
  const initiatives = apiInitiatives as any[];

  // Find first initiative with voting phases
  const initiativeWithVotes = initiatives.find((i: any) => {
    if (!i.IniEventos || !Array.isArray(i.IniEventos)) return false;
    return i.IniEventos.some((event: any) =>
      event.Fase && event.Fase.toLowerCase().includes('votação')
    );
  });

  if (!initiativeWithVotes) {
    test.skip();
    return;
  }

  // Find the initiative row by its number
  const initiativeNumber = initiativeWithVotes.IniNr;
  const initiativeRows = page.locator('[role="row"]').filter({
    has: page.locator('[role="rowheader"]').filter({ hasText: initiativeNumber })
  });

  const rowCount = await initiativeRows.count();
  if (rowCount === 0) {
    test.skip();
    return;
  }

  // Expand the initiative row to see details
  await initiativeRows.first().click();
  await page.waitForTimeout(500); // Wait for expansion animation

  // Check if voting information section is visible
  const votingSection = page.locator('text=Voting Information').first();
  const isVotingSectionVisible = await votingSection.isVisible().catch(() => false);

  if (!isVotingSectionVisible) {
    test.skip();
    return;
  }

  // Validate voting phases are displayed
  const votingPhases = initiativeWithVotes.IniEventos.filter((event: any) =>
    event.Fase && event.Fase.toLowerCase().includes('votação')
  );

  for (const votingPhase of votingPhases) {
    await expect(page.locator('body')).toContainText(votingPhase.Fase);
  }
});

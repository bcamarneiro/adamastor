import { expect, test } from '../fixtures';

test('parties page renders API data correctly', async ({ page }) => {
  let apiParties;

  // Intercept Supabase REST API for parties
  await page.route('**/rest/v1/party_stats*', async (route) => {
    const response = await route.fetch();
    apiParties = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/partidos');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiParties || apiParties.length === 0) {
    test.skip();
    return;
  }

  // Validate basic schema
  const firstParty = apiParties[0];
  expect(firstParty).toHaveProperty('acronym');
  expect(firstParty).toHaveProperty('name');
  expect(typeof firstParty.acronym).toBe('string');
  expect(typeof firstParty.name).toBe('string');

  // Find the party list section (after "Ranking por Pontuacao Media" heading)
  const partyListSection = page.locator('.space-y-3');

  // Validate rendered matches API (first 5 parties)
  for (let i = 0; i < Math.min(5, apiParties.length); i++) {
    const party = apiParties[i];

    // Find the party card within the party list section
    const card = partyListSection.locator('.bg-neutral-1.rounded-xl.p-4.border').nth(i);

    // Validate party acronym (shown as bold text with party name)
    await expect(card.locator('span.font-bold.text-lg')).toContainText(party.acronym);

    // Validate party name (shown in truncated text)
    await expect(card.locator('p.text-sm.text-neutral-11.truncate')).toContainText(party.name);

    // Validate deputy count if present
    if (party.deputy_count !== undefined) {
      await expect(card.getByText(/\d+ deputados/)).toContainText(String(party.deputy_count));
    }

    // Validate party color indicator if present
    if (party.color) {
      const colorIndicator = card.locator('.w-2.h-16.rounded-full');
      const bgColor = await colorIndicator.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      // Just verify it has a background color set
      expect(bgColor).toBeTruthy();
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  }
});

test('parties page aggregated metrics match API', async ({ page }) => {
  let apiParties;

  // Intercept parties API with aggregated metrics
  await page.route('**/rest/v1/party_stats*', async (route) => {
    const response = await route.fetch();
    apiParties = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/partidos');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiParties || apiParties.length === 0) {
    test.skip();
    return;
  }

  // Validate first party's aggregated metrics
  const firstParty = apiParties[0];
  const partyListSection = page.locator('.space-y-3');
  const firstCard = partyListSection.locator('.bg-neutral-1.rounded-xl.p-4.border').first();

  // Validate work score if present (shown on the right side of the card)
  if (firstParty.avg_work_score !== undefined && firstParty.avg_work_score !== null) {
    const scoreElement = firstCard.locator('.text-right').locator('.text-2xl.font-bold.text-neutral-12');
    const scoreText = await scoreElement.textContent();
    const scoreValue = parseFloat(scoreText || '0');
    const expectedScore = Math.round(firstParty.avg_work_score * 10) / 10;
    expect(Math.abs(scoreValue - expectedScore)).toBeLessThan(0.2);
  }

  // Validate total proposals if present
  if (firstParty.total_proposals !== undefined && firstParty.total_proposals !== null) {
    await expect(firstCard.getByText(/\d+ propostas/)).toContainText(String(firstParty.total_proposals));
  }

  // Validate total interventions if present
  if (firstParty.total_interventions !== undefined && firstParty.total_interventions !== null) {
    await expect(firstCard.getByText(/\d+ intervencoes/)).toContainText(String(firstParty.total_interventions));
  }

  // Validate total questions if present
  if (firstParty.total_questions !== undefined && firstParty.total_questions !== null) {
    await expect(firstCard.getByText(/\d+ perguntas/)).toContainText(String(firstParty.total_questions));
  }
});

test('parties page summary stats match API', async ({ page }) => {
  let apiParties;

  // Intercept parties API
  await page.route('**/rest/v1/party_stats*', async (route) => {
    const response = await route.fetch();
    apiParties = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/partidos');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiParties || apiParties.length === 0) {
    test.skip();
    return;
  }

  // Calculate expected totals from API
  const expectedPartyCount = apiParties.length;
  const expectedTotalDeputies = apiParties.reduce((sum, p) => sum + (p.deputy_count || 0), 0);
  const expectedAvgScore =
    apiParties.length > 0
      ? apiParties.reduce((sum, p) => sum + (p.avg_work_score || 0), 0) / apiParties.length
      : 0;

  // Validate summary stats section
  const summaryStats = page.locator('.grid.grid-cols-2.md\\:grid-cols-3');

  // Validate party count
  const partyCountCard = summaryStats.locator('.bg-neutral-1.rounded-xl').nth(0);
  await expect(partyCountCard.locator('.text-2xl.font-bold')).toContainText(String(expectedPartyCount));
  await expect(partyCountCard.locator('.text-sm.text-neutral-11')).toContainText('Partidos');

  // Validate total deputies
  const deputiesCard = summaryStats.locator('.bg-neutral-1.rounded-xl').nth(1);
  await expect(deputiesCard.locator('.text-2xl.font-bold')).toContainText(String(expectedTotalDeputies));
  await expect(deputiesCard.locator('.text-sm.text-neutral-11')).toContainText('Deputados');

  // Validate average score
  const avgScoreCard = summaryStats.locator('.bg-neutral-1.rounded-xl').nth(2);
  const avgScoreText = await avgScoreCard.locator('.text-2xl.font-bold').textContent();
  const avgScoreValue = parseFloat(avgScoreText || '0');
  expect(Math.abs(avgScoreValue - expectedAvgScore)).toBeLessThan(0.2);
  await expect(avgScoreCard.locator('.text-sm.text-neutral-11')).toContainText('Media Global');
});

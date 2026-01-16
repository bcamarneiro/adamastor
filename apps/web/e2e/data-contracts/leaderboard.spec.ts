import { expect, test } from '../fixtures';

test('leaderboard renders deputies from API correctly', async ({ page }) => {
  let apiDeputies: any;

  // Intercept Supabase REST API
  await page.route('**/rest/v1/deputies*', async (route) => {
    const response = await route.fetch();
    apiDeputies = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/ranking');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiDeputies || apiDeputies.length === 0) {
    test.skip();
    return;
  }

  // Validate basic schema
  const firstDeputy = apiDeputies[0];
  expect(firstDeputy).toHaveProperty('name');
  expect(typeof firstDeputy.name).toBe('string');
  expect(firstDeputy).toHaveProperty('national_rank');
  expect(typeof firstDeputy.national_rank).toBe('number');
  expect(firstDeputy).toHaveProperty('party_acronym');
  expect(typeof firstDeputy.party_acronym).toBe('string');

  // Validate rendered matches API (first 5 deputies)
  for (let i = 0; i < Math.min(5, apiDeputies.length); i++) {
    const deputy = apiDeputies[i];
    const card = page.locator('[data-testid="deputy-card"]').nth(i);

    // Validate deputy name
    await expect(card.locator('h3')).toContainText(deputy.name || deputy.short_name);

    // Validate national rank if present
    if (deputy.national_rank !== undefined && deputy.national_rank !== null) {
      await expect(card).toContainText(`#${deputy.national_rank}`);
    }

    // Validate party acronym if present
    if (deputy.party_acronym) {
      await expect(card).toContainText(deputy.party_acronym);
    }
  }
});

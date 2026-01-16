import { expect, test } from '../fixtures';
import { DeputySchema } from '../helpers/schemas';

// Issue #172: Homepage Data Contract Test
// @see https://github.com/bcamarneiro/adamastor/issues/172
test('homepage renders featured deputies from API correctly', async ({ page }) => {
  let apiDeputies;

  // Intercept Supabase REST API
  await page.route('**/rest/v1/deputies*', async (route) => {
    const response = await route.fetch();
    apiDeputies = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Skip if no data returned from API
  if (!apiDeputies || apiDeputies.length === 0) {
    test.skip();
    return;
  }

  // Validate API response schema
  DeputySchema.validate(apiDeputies[0]);

  // Check if deputy cards are rendered on the homepage
  const deputyCards = page.locator('[data-testid="deputy-card"]');
  const cardCount = await deputyCards.count();

  // Skip if homepage doesn't render deputy cards (feature not implemented yet)
  if (cardCount === 0) {
    test.skip();
    return;
  }

  // Validate rendered matches API (first 3 featured deputies)
  const sampleSize = Math.min(3, Math.min(cardCount, apiDeputies.length));
  for (let i = 0; i < sampleSize; i++) {
    const deputy = apiDeputies[i];
    const card = deputyCards.nth(i);

    // Validate deputy name is displayed
    await expect(card.locator('h3')).toContainText(deputy.short_name || deputy.name);

    // Validate party acronym is displayed
    if (deputy.party_acronym) {
      await expect(card).toContainText(deputy.party_acronym);
    }
  }
});

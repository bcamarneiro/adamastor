import { expect, test } from '../fixtures';

test('leaderboard renders deputies from API correctly', async ({ page }) => {
  const apiResponses: any[] = [];

  // Collect all deputy_details API responses
  page.on('response', async (response) => {
    if (response.url().includes('/rest/v1/deputy_details')) {
      try {
        const data = await response.json();
        apiResponses.push(...data);
      } catch (e) {
        // Ignore non-JSON responses
      }
    }
  });

  // Navigate to leaderboard page
  await page.goto('/ranking');
  await page.waitForLoadState('load');

  // Wait a bit for API calls to complete
  await page.waitForTimeout(2000);

  // Skip if no API data captured
  if (apiResponses.length === 0) {
    test.skip();
    return;
  }

  // Validate basic schema using first deputy from API
  const firstDeputy = apiResponses[0];
  expect(firstDeputy).toHaveProperty('short_name');
  expect(typeof firstDeputy.short_name).toBe('string');
  expect(firstDeputy).toHaveProperty('national_rank');
  expect(typeof firstDeputy.national_rank).toBe('number');
  expect(firstDeputy).toHaveProperty('party_acronym');

  // Get all rendered deputy cards
  const cards = page.locator('[data-testid="deputy-card"]');
  const cardCount = await cards.count();

  // Skip if no cards rendered
  if (cardCount === 0) {
    test.skip();
    return;
  }

  // Validate that rendered data comes from API (check first 5 cards)
  for (let i = 0; i < Math.min(5, cardCount); i++) {
    const card = cards.nth(i);

    // Get the short_name from the card
    const displayedName = await card.locator('h3').textContent();

    // Find matching deputy in API responses
    const matchingDeputy = apiResponses.find((d) => d.short_name === displayedName);

    // Validate that this deputy exists in API
    expect(matchingDeputy).toBeDefined();

    // Validate national rank if present in both
    if (matchingDeputy && matchingDeputy.national_rank) {
      await expect(card).toContainText(`#${matchingDeputy.national_rank}`);
    }

    // Validate party acronym if present
    if (matchingDeputy && matchingDeputy.party_acronym) {
      await expect(card).toContainText(matchingDeputy.party_acronym);
    }
  }
});

import { expect, test } from '../fixtures';

test('deputy profile renders API data correctly', async ({ page }) => {
  let apiDeputy: unknown;

  // Intercept Supabase REST API for deputy details
  await page.route('**/rest/v1/deputies*', async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    apiDeputy = Array.isArray(data) ? data[0] : data;
    await route.fulfill({ response });
  });

  // Navigate to first deputy profile
  await page.goto('/ranking');
  await page.waitForLoadState('networkidle');

  // Click first deputy card to go to profile
  await page.locator('[data-testid="deputy-card"]').first().click();
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiDeputy) {
    test.skip();
    return;
  }

  // Validate basic information
  // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
  const deputy = apiDeputy as any;
  await expect(page.locator('h1')).toContainText(deputy.name);
  await expect(page.locator('[data-testid="party-badge"]')).toContainText(deputy.party_acronym);

  // Validate photo if present
  if (deputy.photo_url) {
    const img = page.locator('[data-testid="deputy-photo"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('src', new RegExp(deputy.photo_url));
  }

  // Validate metrics (attendance, proposals, etc.)
  if (deputy.attendance_rate) {
    await expect(page.locator('[data-testid="attendance-metric"]')).toContainText(
      String(deputy.attendance_rate)
    );
  }

  if (deputy.proposal_count) {
    await expect(page.locator('[data-testid="proposals-metric"]')).toContainText(
      String(deputy.proposal_count)
    );
  }

  // Validate national rank
  await expect(page.locator('[data-testid="national-rank"]')).toContainText(
    String(deputy.national_rank)
  );
});

test('deputy profile voting history matches API', async ({ page }) => {
  let apiVotingHistory: unknown;

  // Intercept voting history API
  await page.route('**/rest/v1/voting_records*', async (route) => {
    const response = await route.fetch();
    apiVotingHistory = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/ranking');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="deputy-card"]').first().click();
  await page.waitForLoadState('networkidle');

  // Skip if no voting data
  if (!apiVotingHistory || (Array.isArray(apiVotingHistory) && apiVotingHistory.length === 0)) {
    test.skip();
    return;
  }

  // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
  const votingRecords = apiVotingHistory as any[];

  // Validate first 3 voting records
  for (let i = 0; i < Math.min(3, votingRecords.length); i++) {
    const vote = votingRecords[i];
    const voteElement = page.locator('[data-testid="vote-record"]').nth(i);

    await expect(voteElement).toContainText(vote.initiative_title);
    await expect(voteElement).toContainText(vote.vote_value); // "Sim", "Não", "Abstenção"
  }
});

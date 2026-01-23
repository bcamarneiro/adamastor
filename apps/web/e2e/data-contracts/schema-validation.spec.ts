/**
 * Schema Validation Test
 *
 * This test verifies that our schema validators work correctly
 * with real API data from the leaderboard page.
 */

import { expect, test } from '../fixtures';
import { DeputySchema, validateArray } from '../helpers/schemas';

test.describe('Schema Validators', () => {
  test('should validate deputy data from leaderboard API', async ({ page }) => {
    // Intercept API call and capture response
    // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
    let apiDeputies: any[] = [];
    await page.route('**/rest/v1/deputies*', async (route) => {
      const response = await route.fetch();
      apiDeputies = await response.json();
      await route.fulfill({ response });
    });

    // Navigate to leaderboard page
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Skip if no data available
    if (!apiDeputies || apiDeputies.length === 0) {
      test.skip();
      return;
    }

    // Validate API response schema using our validators
    expect(apiDeputies.length, 'Should have deputies in response').toBeGreaterThan(0);

    // Validate array of deputies (samples first 3)
    validateArray(apiDeputies, DeputySchema, 1);

    // Validate individual deputy fields
    const firstDeputy = apiDeputies[0];
    expect(firstDeputy.id, 'Deputy should have id').toBeTruthy();
    expect(firstDeputy.name, 'Deputy should have name').toBeTruthy();
    expect(typeof firstDeputy.is_active, 'Deputy should have is_active boolean').toBe('boolean');

    // If stats are present, validate them
    if (firstDeputy.national_rank !== undefined) {
      DeputySchema.validateWithStats(firstDeputy);
    }
  });
});

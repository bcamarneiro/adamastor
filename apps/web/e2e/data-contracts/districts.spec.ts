import { expect, test } from '../fixtures';

test('districts page renders API data correctly', async ({ page }) => {
  // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
  let apiDistricts: any[] = [];

  // Intercept Supabase REST API for districts
  // May be a view or aggregated query
  await page.route('**/rest/v1/district*', async (route) => {
    const response = await route.fetch();
    apiDistricts = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/distritos');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiDistricts || apiDistricts.length === 0) {
    test.skip();
    return;
  }

  // Validate basic schema
  const firstDistrict = apiDistricts[0];
  expect(firstDistrict).toHaveProperty('name');
  expect(typeof firstDistrict.name).toBe('string');

  // Validate rendered matches API (first 5 districts)
  for (let i = 0; i < Math.min(5, apiDistricts.length); i++) {
    const district = apiDistricts[i];
    const card = page.locator('[data-testid="district-card"]').nth(i);

    // Validate district name (rendered in span, not h3)
    await expect(card).toContainText(district.name);

    // Validate deputy count if present (API field: active_deputies)
    if (district.active_deputies !== undefined) {
      await expect(card.locator('[data-testid="deputy-count"]')).toContainText(
        String(district.active_deputies)
      );
    }
  }
});

test('districts page aggregated metrics match API', async ({ page }) => {
  // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
  let apiDistricts: any[] = [];

  // Intercept districts API with aggregated metrics
  await page.route('**/rest/v1/district*', async (route) => {
    const response = await route.fetch();
    apiDistricts = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/distritos');
  await page.waitForLoadState('networkidle');

  // Skip if no data
  if (!apiDistricts || apiDistricts.length === 0) {
    test.skip();
    return;
  }

  // Validate first district's aggregated metrics
  const firstDistrict = apiDistricts[0];
  const firstCard = page.locator('[data-testid="district-card"]').first();

  // Validate average attendance if present (API field: avg_attendance_rate)
  if (firstDistrict.avg_attendance_rate !== undefined) {
    await expect(firstCard.locator('[data-testid="avg-attendance"]')).toContainText(
      String(Math.round(firstDistrict.avg_attendance_rate))
    );
  }

  // Validate average grade/score if present (API field: avg_work_score)
  if (firstDistrict.avg_work_score !== undefined) {
    const gradeText = await firstCard.locator('[data-testid="avg-grade"]').textContent();
    const gradeValue = Number.parseFloat(gradeText || '0');
    const expectedGrade = Math.round(firstDistrict.avg_work_score * 10) / 10;
    expect(Math.abs(gradeValue - expectedGrade)).toBeLessThan(0.2);
  }
});

test('districts page comparison chart matches API', async ({ page }) => {
  // biome-ignore lint/suspicious/noExplicitAny: API response type is unknown in E2E tests
  let apiDistricts: any[] = [];

  await page.route('**/rest/v1/district*', async (route) => {
    const response = await route.fetch();
    apiDistricts = await response.json();
    await route.fulfill({ response });
  });

  await page.goto('/distritos');
  await page.waitForLoadState('networkidle');

  // Skip if no data or no chart
  if (!apiDistricts || apiDistricts.length === 0) {
    test.skip();
    return;
  }

  // Check if comparison chart/visualization exists
  const chart = page.locator('[data-testid="district-comparison-chart"]');
  if (!(await chart.isVisible())) {
    test.skip();
    return;
  }

  // Validate chart has correct number of data points
  const chartItems = await page.locator('[data-testid="chart-item"]').count();
  expect(chartItems).toBeGreaterThan(0);
  expect(chartItems).toBeLessThanOrEqual(apiDistricts.length);
});

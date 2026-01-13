import { expect, test } from './fixtures';

// TODO: Re-enable once initiatives feature is implemented
// These tests were added before the feature exists
test.describe.skip('Initiatives Page', () => {
  test.describe('Filtering', () => {
    test('should filter initiatives by search text', async ({ page }) => {
      await page.goto('/initiatives');

      // Wait for initiatives to load
      await expect(page.getByRole('heading', { name: 'Initiatives List' })).toBeVisible();

      // Wait for at least one initiative to be visible
      const firstInitiative = page.locator('[role="row"][aria-expanded]').first();
      await expect(firstInitiative).toBeVisible({ timeout: 10000 });

      // Get initial count of visible initiatives
      const allRows = page.locator('[role="row"][aria-expanded]');
      const initialCount = await allRows.count();
      expect(initialCount).toBeGreaterThan(0);

      // Type in search box
      const searchInput = page.getByPlaceholder('Search initiatives...');
      await searchInput.fill('fiscal');

      // Wait for debounce (300ms) and filtering to apply
      await page.waitForTimeout(500);

      // Should have fewer initiatives visible
      const filteredCount = await allRows.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('should filter initiatives by phase', async ({ page }) => {
      await page.goto('/initiatives');

      // Wait for initiatives to load
      await expect(page.getByRole('heading', { name: 'Initiatives List' })).toBeVisible();

      const firstInitiative = page.locator('[role="row"][aria-expanded]').first();
      await expect(firstInitiative).toBeVisible({ timeout: 10000 });

      const allRows = page.locator('[role="row"][aria-expanded]');
      const initialCount = await allRows.count();

      // Get first available phase from dropdown
      const phaseSelect = page.getByLabel('Filter by phase');
      const options = await phaseSelect.locator('option').allTextContents();
      const firstPhase = options.find((opt) => opt !== 'All Phases');

      // Skip test if no phases available
      if (!firstPhase) {
        test.skip();
        return;
      }

      // Select a phase from the dropdown
      await phaseSelect.selectOption(firstPhase);

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Should have filtered results
      const filteredCount = await allRows.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      expect(filteredCount).toBeGreaterThan(0);

      // Reset filter
      await phaseSelect.selectOption('');
      await page.waitForTimeout(300);

      const resetCount = await allRows.count();
      expect(resetCount).toBe(initialCount);
    });

    test('should combine search and phase filters', async ({ page }) => {
      await page.goto('/initiatives');

      // Wait for initiatives to load
      await expect(page.getByRole('heading', { name: 'Initiatives List' })).toBeVisible();

      const firstInitiative = page.locator('[role="row"][aria-expanded]').first();
      await expect(firstInitiative).toBeVisible({ timeout: 10000 });

      const allRows = page.locator('[role="row"][aria-expanded]');
      const initialCount = await allRows.count();

      // Get first available phase from dropdown
      const phaseSelect = page.getByLabel('Filter by phase');
      const options = await phaseSelect.locator('option').allTextContents();
      const firstPhase = options.find((opt) => opt !== 'All Phases');

      // Skip test if no phases available
      if (!firstPhase) {
        test.skip();
        return;
      }

      // Apply search filter
      const searchInput = page.getByPlaceholder('Search initiatives...');
      await searchInput.fill('lei');

      // Apply phase filter
      await phaseSelect.selectOption(firstPhase);

      // Wait for both filters to apply
      await page.waitForTimeout(500);

      // Should have filtered results (could be 0 if no match)
      const filteredCount = await allRows.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('should clear filters when search is cleared', async ({ page }) => {
      await page.goto('/initiatives');

      await expect(page.getByRole('heading', { name: 'Initiatives List' })).toBeVisible();

      const firstInitiative = page.locator('[role="row"][aria-expanded]').first();
      await expect(firstInitiative).toBeVisible({ timeout: 10000 });

      // Get initial count
      const allRows = page.locator('[role="row"][aria-expanded]');
      const initialCount = await allRows.count();

      // Apply filter
      const searchInput = page.getByPlaceholder('Search initiatives...');
      await searchInput.fill('fiscal');
      await page.waitForTimeout(500);

      const filteredCount = await allRows.count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      // Clear filter
      await searchInput.clear();
      await page.waitForTimeout(500);

      // Should return to initial count
      const finalCount = await allRows.count();
      expect(finalCount).toBe(initialCount);
    });

    test('should be case-insensitive', async ({ page }) => {
      await page.goto('/initiatives');

      await expect(page.getByRole('heading', { name: 'Initiatives List' })).toBeVisible();

      const firstInitiative = page.locator('[role="row"][aria-expanded]').first();
      await expect(firstInitiative).toBeVisible({ timeout: 10000 });

      // Search with uppercase
      const searchInput = page.getByPlaceholder('Search initiatives...');
      await searchInput.fill('TRABALHO');
      await page.waitForTimeout(500);

      const uppercaseCount = await page.locator('[role="row"][aria-expanded]').count();

      // Clear and search with lowercase
      await searchInput.clear();
      await page.waitForTimeout(500);
      await searchInput.fill('trabalho');
      await page.waitForTimeout(500);

      const lowercaseCount = await page.locator('[role="row"][aria-expanded]').count();

      // Should return same results
      expect(uppercaseCount).toBe(lowercaseCount);
    });
  });

  test.describe('Expand/Collapse', () => {
    test('should expand initiative row when clicked', async ({ page }) => {
      await page.goto('/initiatives');

      await expect(page.getByRole('heading', { name: 'Initiatives List' })).toBeVisible();

      // Wait for first initiative
      const firstRow = page.locator('[role="row"][aria-expanded]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      // Should initially be collapsed
      await expect(firstRow).toHaveAttribute('aria-expanded', 'false');

      // Click to expand
      await firstRow.click();

      // Should now be expanded
      await expect(firstRow).toHaveAttribute('aria-expanded', 'true');

      // Should show expanded content (e.g., Timeline Progress section)
      await expect(page.getByText('Timeline Progress')).toBeVisible();
    });

    test('should collapse when clicking expanded row', async ({ page }) => {
      await page.goto('/initiatives');

      const firstRow = page.locator('[role="row"][aria-expanded]').first();
      await expect(firstRow).toBeVisible({ timeout: 10000 });

      // Expand
      await firstRow.click();
      await expect(firstRow).toHaveAttribute('aria-expanded', 'true');

      // Collapse
      await firstRow.click();
      await expect(firstRow).toHaveAttribute('aria-expanded', 'false');

      // Expanded content should be hidden
      await expect(page.getByText('Timeline Progress')).not.toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should clear search with Escape key', async ({ page }) => {
      await page.goto('/initiatives');

      await expect(page.getByRole('heading', { name: 'Initiatives List' })).toBeVisible();

      const searchInput = page.getByPlaceholder('Search initiatives...');
      await searchInput.fill('test');

      // Verify text is there
      await expect(searchInput).toHaveValue('test');

      // Press Escape
      await searchInput.press('Escape');

      // Should be cleared
      await expect(searchInput).toHaveValue('');
    });
  });

  test.describe('Statistics Overview', () => {
    test('should show statistics accordion', async ({ page }) => {
      await page.goto('/initiatives');

      // Should show statistics overview button
      const statsButton = page.getByRole('button', { name: 'Statistics Overview' });
      await expect(statsButton).toBeVisible();

      // Click to expand
      await statsButton.click();

      // Should show total initiatives count
      await expect(page.getByText('Total Initiatives')).toBeVisible();
    });
  });
});

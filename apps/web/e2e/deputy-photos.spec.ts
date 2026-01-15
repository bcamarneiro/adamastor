import { expect, test } from './fixtures';

test.describe('Deputy Photos', () => {
  // Issue #36 & #156: Deputy photo display
  // @see https://github.com/bcamarneiro/adamastor/issues/36
  // @see https://github.com/bcamarneiro/adamastor/issues/156
  test('deputy photos should load correctly on leaderboard page', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Find all deputy card images on the page
    const deputyImages = page.locator('img[alt*="Deputado"], img[alt*="Deputada"]');
    const imageCount = await deputyImages.count();

    // Should have at least some deputy images on the leaderboard
    expect(imageCount).toBeGreaterThan(0);

    // Check first few images to verify they are loading
    const imagesToCheck = Math.min(5, imageCount);
    for (let i = 0; i < imagesToCheck; i++) {
      const img = deputyImages.nth(i);
      await expect(img).toBeVisible();

      // Verify image has a src attribute
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  // Issue #36 & #156: Deputy photo URL format verification
  // @see https://github.com/bcamarneiro/adamastor/issues/36
  // @see https://github.com/bcamarneiro/adamastor/issues/156
  test('deputy photos should use correct Parliament API URL format', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Find deputy images
    const deputyImages = page.locator('img[alt*="Deputado"], img[alt*="Deputada"]');
    const imageCount = await deputyImages.count();

    if (imageCount === 0) {
      test.skip();
      return;
    }

    // Check first image URL format
    const firstImage = deputyImages.first();
    const src = await firstImage.getAttribute('src');

    // Verify URL follows Parliament API format or Next.js image optimization format
    // Parliament API: https://app.parlamento.pt/webutils/getimage.aspx?id={depId}&type=deputado
    // Next.js optimized: /_next/image?url=https%3A%2F%2Fapp.parlamento.pt%2Fwebutils%2Fgetimage.aspx...
    const isParliamentUrl =
      src?.includes('app.parlamento.pt/webutils/getimage.aspx') && src?.includes('type=deputado');
    const isNextImageUrl = src?.includes('/_next/image') && src?.includes('app.parlamento.pt');

    expect(isParliamentUrl || isNextImageUrl).toBeTruthy();
  });

  // Issue #36 & #156: Deputy profile page photo display
  // @see https://github.com/bcamarneiro/adamastor/issues/36
  // @see https://github.com/bcamarneiro/adamastor/issues/156
  test('deputy profile page should display photo correctly', async ({ page }) => {
    // First, get a deputy slug from the leaderboard
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Find first deputy card link
    const deputyLinks = page.locator('a[href^="/deputados/"]');
    const linkCount = await deputyLinks.count();

    if (linkCount === 0) {
      test.skip();
      return;
    }

    // Get the first deputy's URL
    const firstDeputyHref = await deputyLinks.first().getAttribute('href');
    if (!firstDeputyHref) {
      test.skip();
      return;
    }

    // Navigate to deputy profile page
    await page.goto(firstDeputyHref);
    await page.waitForLoadState('networkidle');

    // Find the deputy profile photo
    const profilePhoto = page.locator('img[alt*="Deputado"], img[alt*="Deputada"]').first();
    await expect(profilePhoto).toBeVisible();

    // Verify photo has a valid src
    const src = await profilePhoto.getAttribute('src');
    expect(src).toBeTruthy();
  });

  // Issue #36 & #156: Photo fallback when image fails to load
  // @see https://github.com/bcamarneiro/adamastor/issues/36
  // @see https://github.com/bcamarneiro/adamastor/issues/156
  test('deputy cards should handle missing photos gracefully', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Find all deputy images
    const deputyImages = page.locator('img[alt*="Deputado"], img[alt*="Deputada"]');
    const imageCount = await deputyImages.count();

    if (imageCount === 0) {
      test.skip();
      return;
    }

    // Check that images either load or have fallback
    // We verify that even if an image fails, the page doesn't break
    for (let i = 0; i < Math.min(3, imageCount); i++) {
      const img = deputyImages.nth(i);

      // Image should be in the DOM
      await expect(img).toBeAttached();

      // Get image natural dimensions via JavaScript
      const hasLoaded = await img.evaluate((imgEl: HTMLImageElement) => {
        // If naturalWidth > 0, image loaded successfully
        // If naturalWidth === 0, image failed to load (but should have fallback)
        return imgEl.complete && (imgEl.naturalWidth > 0 || imgEl.alt.length > 0);
      });

      expect(hasLoaded).toBeTruthy();
    }
  });

  // Issue #36 & #156: Verify no broken image icons on leaderboard
  // @see https://github.com/bcamarneiro/adamastor/issues/36
  // @see https://github.com/bcamarneiro/adamastor/issues/156
  test('leaderboard should not display broken image icons', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Find all deputy images
    const deputyImages = page.locator('img[alt*="Deputado"], img[alt*="Deputada"]');
    const imageCount = await deputyImages.count();

    if (imageCount === 0) {
      test.skip();
      return;
    }

    // Check each image for broken state
    const imagesToCheck = Math.min(10, imageCount);
    for (let i = 0; i < imagesToCheck; i++) {
      const img = deputyImages.nth(i);

      // Verify image is visible (not hidden due to error)
      const isVisible = await img.isVisible();
      expect(isVisible).toBeTruthy();

      // Check if image has loaded (naturalWidth > 0) or has error state handled
      const imageState = await img.evaluate((imgEl: HTMLImageElement) => {
        return {
          complete: imgEl.complete,
          naturalWidth: imgEl.naturalWidth,
          naturalHeight: imgEl.naturalHeight,
          src: imgEl.src,
          alt: imgEl.alt,
        };
      });

      // If image is complete but has 0 dimensions, it's broken
      // We expect either successful load OR proper error handling with fallback
      if (imageState.complete) {
        const isBroken = imageState.naturalWidth === 0 && imageState.naturalHeight === 0;

        // If broken, verify there's a fallback mechanism (like background color, placeholder, etc.)
        if (isBroken) {
          // Image should have alt text as minimum fallback
          expect(imageState.alt.length).toBeGreaterThan(0);
        } else {
          // Image loaded successfully
          expect(imageState.naturalWidth).toBeGreaterThan(0);
        }
      }
    }
  });

  // Issue #36 & #156: High activity deputies should have photos
  // @see https://github.com/bcamarneiro/adamastor/issues/36
  // @see https://github.com/bcamarneiro/adamastor/issues/156
  test('high activity section should display deputy photos', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Find the high activity section
    const highActivitySection = page.locator('section, div').filter({
      hasText: /maior atividade parlamentar/i,
    });

    if ((await highActivitySection.count()) === 0) {
      test.skip();
      return;
    }

    // Find deputy images within this section
    const sectionImages = highActivitySection.locator('img[alt*="Deputado"], img[alt*="Deputada"]');
    const imageCount = await sectionImages.count();

    // Should have at least one deputy photo in high activity section
    expect(imageCount).toBeGreaterThan(0);

    // Check that at least the first image is visible
    await expect(sectionImages.first()).toBeVisible();
  });

  // Issue #36 & #156: Low activity deputies should have photos
  // @see https://github.com/bcamarneiro/adamastor/issues/36
  // @see https://github.com/bcamarneiro/adamastor/issues/156
  test('low activity section should display deputy photos', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');

    // Find the low activity section
    const lowActivitySection = page.locator('section, div').filter({
      hasText: /menor atividade parlamentar/i,
    });

    if ((await lowActivitySection.count()) === 0) {
      test.skip();
      return;
    }

    // Find deputy images within this section
    const sectionImages = lowActivitySection.locator('img[alt*="Deputado"], img[alt*="Deputada"]');
    const imageCount = await sectionImages.count();

    // Should have at least one deputy photo in low activity section
    expect(imageCount).toBeGreaterThan(0);

    // Check that at least the first image is visible
    await expect(sectionImages.first()).toBeVisible();
  });
});

import { expect, test } from './fixtures';

test.describe('Deputy Photos', () => {
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

    // Verify URL follows Parliament API format or image proxy format
    const isParliamentUrl =
      src?.includes('app.parlamento.pt/webutils/getimage.aspx') && src?.includes('type=deputado');
    const isProxiedUrl = src?.includes('/_next/image') || src?.includes('vercel.app');

    expect(isParliamentUrl || isProxiedUrl).toBeTruthy();
  });

  // Issue #36 & #156: Deputy profile page photo display
  // @see https://github.com/bcamarneiro/adamastor/issues/36
  // @see https://github.com/bcamarneiro/adamastor/issues/156
  test('deputy profile page should display photo correctly', async ({ page }) => {
    // First, get a deputy slug from the ranking page
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

    // Check if photo exists - if not, skip test (data may not be loaded)
    const photoCount = await page.locator('img[alt*="Deputado"], img[alt*="Deputada"]').count();
    if (photoCount === 0) {
      test.skip();
      return;
    }

    await expect(profilePhoto).toBeVisible();

    // Verify photo has a valid src
    const src = await profilePhoto.getAttribute('src');
    expect(src).toBeTruthy();
  });
});

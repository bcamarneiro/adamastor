import { downloadBiographyPhoto, fetchBiographyPhotoUrl } from '../scrapers/biography.js';
import { supabase } from '../supabase.js';
import { detectImageType, validatePhoto } from './photos-helpers.js';

export { validatePhoto } from './photos-helpers.js';

const PARLIAMENT_PHOTO_URL = 'https://app.parlamento.pt/webutils/getimage.aspx';
const NOPHOTO_REDIRECT_PATH = '/webutils/nophoto.jpg';

interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Download photo using fetch instead of curl shell command.
 * This avoids shell injection vulnerabilities.
 * Returns null if the photo is a placeholder (redirects to nophoto.jpg).
 */
export async function downloadPhoto(depId: number): Promise<Buffer | null> {
  // Validate depId is a number to prevent injection
  if (!Number.isInteger(depId) || depId <= 0) {
    console.error(`  Invalid depId: ${depId}`);
    return null;
  }

  const url = `${PARLIAMENT_PHOTO_URL}?id=${depId}&type=deputado`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // First, check if it redirects to nophoto.jpg (placeholder)
    const headResponse = await fetch(url, {
      signal: controller.signal,
      redirect: 'manual', // Don't follow redirects automatically
    });

    // If redirected to nophoto.jpg, this is a placeholder
    const location = headResponse.headers.get('location');
    if (headResponse.status === 302 && location?.includes(NOPHOTO_REDIRECT_PATH)) {
      clearTimeout(timeoutId);
      return null; // Placeholder detected
    }

    // If it's a redirect to somewhere else, follow it
    const response =
      headResponse.status === 302
        ? await fetch(location || url, { signal: controller.signal })
        : headResponse;

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate it's a valid image (JPEG starts with FF D8, PNG with 89 50 4E 47)
    if (buffer.length < 100) {
      return null;
    }

    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isPng =
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

    if (!isJpeg && !isPng) {
      return null;
    }

    return buffer;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error(`  Timeout downloading photo for ${depId}`);
    } else {
      console.error(`  Error downloading photo for ${depId}:`, error);
    }
    return null;
  }
}

export async function uploadPhotoToStorage(
  depId: number,
  photoBuffer: Buffer
): Promise<PhotoUploadResult> {
  // Detect image type from magic bytes
  const { extension, contentType } = detectImageType(photoBuffer);
  const fileName = `${depId}.${extension}`;

  try {
    const { error } = await supabase.storage.from('deputy-photos').upload(fileName, photoBuffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data } = supabase.storage.from('deputy-photos').getPublicUrl(fileName);

    return { success: true, url: data.publicUrl };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function syncDeputyPhoto(depId: number): Promise<string | null> {
  // Download photo from Parliament
  const photoBuffer = await downloadPhoto(depId);

  if (!photoBuffer) {
    return null;
  }

  // Upload to Supabase Storage
  const result = await uploadPhotoToStorage(depId, photoBuffer);

  if (!result.success) {
    console.error(`  Failed to upload photo for ${depId}: ${result.error}`);
    return null;
  }

  return result.url || null;
}

export async function syncAllPhotos(depIds: number[]): Promise<Map<number, string>> {
  console.log(`📸 Syncing photos for ${depIds.length} deputies...`);

  const photoUrls = new Map<number, string>();
  let successCount = 0;
  let failCount = 0;

  // Process in batches to avoid overwhelming the Parliament server
  const batchSize = 10;

  for (let i = 0; i < depIds.length; i += batchSize) {
    const batch = depIds.slice(i, i + batchSize);

    const results = await Promise.all(
      batch.map(async (depId) => {
        const url = await syncDeputyPhoto(depId);
        return { depId, url };
      })
    );

    for (const { depId, url } of results) {
      if (url) {
        photoUrls.set(depId, url);
        successCount++;
      } else {
        failCount++;
      }
    }

    // Progress update every 50 photos
    if ((i + batchSize) % 50 === 0 || i + batchSize >= depIds.length) {
      console.log(
        `  Progress: ${Math.min(i + batchSize, depIds.length)}/${depIds.length} (${successCount} ok, ${failCount} failed)`
      );
    }

    // Small delay between batches
    if (i + batchSize < depIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`✅ Photos synced: ${successCount} successful, ${failCount} failed\n`);

  return photoUrls;
}

/**
 * Photo source types for tracking where a photo came from
 */
export type PhotoSource = 'biography' | 'parliament_api' | 'none';

export interface EnhancedPhotoResult {
  success: boolean;
  photoUrl?: string;
  source: PhotoSource;
  reason?: string;
}

/**
 * Enhanced photo sync with fallback chain:
 * 1. Try biography page photo (higher quality, less likely to be placeholder)
 * 2. Fall back to Parliament API
 * 3. Return null if both fail
 *
 * @param externalId - Deputy's external ID (Parliament ID)
 * @param biographyId - Deputy's biography ID (optional, for biography page fallback)
 */
export async function downloadPhotoWithFallback(
  externalId: number,
  biographyId: number | null
): Promise<{ buffer: Buffer | null; source: PhotoSource }> {
  // Strategy 1: Try biography page photo first (often higher quality)
  if (biographyId) {
    const bioPhotoUrl = await fetchBiographyPhotoUrl(biographyId);

    if (bioPhotoUrl) {
      const bioBuffer = await downloadBiographyPhoto(bioPhotoUrl);

      if (bioBuffer) {
        const validation = await validatePhoto(bioBuffer);
        if (validation.isValid && !validation.isPlaceholder) {
          return { buffer: bioBuffer, source: 'biography' };
        }
      }
    }
  }

  // Strategy 2: Fall back to Parliament API
  const apiBuffer = await downloadPhoto(externalId);

  if (apiBuffer) {
    const validation = await validatePhoto(apiBuffer);
    if (validation.isValid && !validation.isPlaceholder) {
      return { buffer: apiBuffer, source: 'parliament_api' };
    }
  }

  // Both sources failed
  return { buffer: null, source: 'none' };
}

/**
 * Sync a single deputy's photo with enhanced fallback logic.
 * Tries biography page first, then Parliament API.
 */
export async function syncDeputyPhotoEnhanced(
  externalId: number,
  biographyId: number | null
): Promise<EnhancedPhotoResult> {
  const { buffer, source } = await downloadPhotoWithFallback(externalId, biographyId);

  if (!buffer || source === 'none') {
    return {
      success: false,
      source: 'none',
      reason: 'No valid photo found from any source',
    };
  }

  // Upload to Supabase Storage
  const uploadResult = await uploadPhotoToStorage(externalId, buffer);

  if (!uploadResult.success) {
    return {
      success: false,
      source,
      reason: `Upload failed: ${uploadResult.error}`,
    };
  }

  return {
    success: true,
    photoUrl: uploadResult.url,
    source,
  };
}

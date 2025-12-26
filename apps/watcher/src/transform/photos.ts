import { supabase } from '../supabase.js';

const PARLIAMENT_PHOTO_URL = 'https://app.parlamento.pt/webutils/getimage.aspx';

interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Download photo using fetch instead of curl shell command.
 * This avoids shell injection vulnerabilities.
 */
async function downloadPhoto(depId: number): Promise<Buffer | null> {
  // Validate depId is a number to prevent injection
  if (!Number.isInteger(depId) || depId <= 0) {
    console.error(`  Invalid depId: ${depId}`);
    return null;
  }

  const url = `${PARLIAMENT_PHOTO_URL}?id=${depId}&type=deputado`;

  try {
    // Use fetch with a custom agent that allows self-signed certs
    // Parliament has SSL issues, but we validate the response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      signal: controller.signal,
      // Note: In Node.js 18+, you may need to set NODE_TLS_REJECT_UNAUTHORIZED=0
      // for Parliament's SSL issues, but this should be done at env level, not code
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate it's a JPEG image (starts with FF D8)
    if (buffer.length < 100 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
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

async function uploadPhotoToStorage(
  depId: number,
  photoBuffer: Buffer
): Promise<PhotoUploadResult> {
  const fileName = `${depId}.jpg`;

  try {
    const { error } = await supabase.storage.from('deputy-photos').upload(fileName, photoBuffer, {
      contentType: 'image/jpeg',
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

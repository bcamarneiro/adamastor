import { exec } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { supabase } from '../supabase.js';

const execAsync = promisify(exec);

const PARLIAMENT_PHOTO_URL = 'https://app.parlamento.pt/webutils/getimage.aspx';

interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

async function downloadPhoto(depId: number): Promise<Buffer | null> {
  const url = `${PARLIAMENT_PHOTO_URL}?id=${depId}&type=deputado`;
  const tmpFile = join(tmpdir(), `deputy-photo-${depId}.jpg`);

  try {
    // Use curl with -k to skip certificate verification (Parliament has SSL issues)
    // -L follows redirects, -s is silent, -o outputs to file
    await execAsync(`curl -k -L -s -o "${tmpFile}" -w "%{http_code}" "${url}"`, {
      timeout: 30000,
    });

    // Check if file exists and has content
    try {
      const buffer = await readFile(tmpFile);

      // Clean up temp file
      await unlink(tmpFile).catch(() => {});

      // Check if it's a valid image (JPEG starts with FF D8)
      if (buffer.length < 100 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
        return null;
      }

      return buffer;
    } catch {
      return null;
    }
  } catch (error) {
    // Clean up temp file on error
    await unlink(tmpFile).catch(() => {});
    console.error(`  Error downloading photo for ${depId}:`, error);
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

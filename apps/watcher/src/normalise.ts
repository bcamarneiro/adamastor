import { readFile } from 'node:fs/promises';
import { put } from '@vercel/blob';
import { sha256 } from './hash.js';

/**
 * Check if Vercel Blob storage is configured
 */
export function isBlobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export async function makeLatest(datasetPath: string, key: string) {
  if (!isBlobEnabled()) {
    console.log(`[DEBUG] Blob storage not configured, skipping makeLatest for ${key}`);
    return null;
  }

  try {
    console.log(`[DEBUG] makeLatest started for: ${datasetPath}, key: ${key}`);
    const raw = await readFile(datasetPath);
    console.log(`[DEBUG] File read: ${datasetPath}`);

    // Upload the raw file directly without compression
    const { url } = await put(`latest/${key}.json`, raw, {
      access: 'public',
      allowOverwrite: true,
    });
    console.log(`[DEBUG] File uploaded to blob: ${url}`);

    const hash = await sha256(datasetPath);
    console.log(`[DEBUG] sha256 for latest: ${hash}`);
    return { url, sha: hash };
  } catch (err) {
    console.error(`[ERROR] makeLatest failed for ${datasetPath}:`, err);
    throw err;
  }
}

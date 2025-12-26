import { readFile } from 'node:fs/promises';
// src/upload-b2.ts
import Backblaze from 'backblaze-b2';

// B2 is optional - check if configured
const B2_ENABLED = Boolean(
  process.env.B2_KEY_ID && process.env.B2_APP_KEY && process.env.B2_BUCKET
);

let b2: Backblaze | null = null;

if (B2_ENABLED) {
  b2 = new Backblaze({
    applicationKeyId: process.env.B2_KEY_ID!,
    applicationKey: process.env.B2_APP_KEY!,
  });
}

/**
 * Check if B2 archiving is enabled
 */
export function isB2Enabled(): boolean {
  return B2_ENABLED === true;
}

export async function uploadFile(localPath: string, remotePath: string) {
  // Skip if B2 is not configured
  if (!B2_ENABLED || !b2) {
    console.log(`[SKIP] B2 not configured, skipping upload: ${remotePath}`);
    return;
  }
  try {
    console.log('[DEBUG] Authorizing B2 for upload');
    const authRes = await b2.authorize(); // token good for 24h
    console.log('[DEBUG] Authorized B2 for upload');

    // Extract the bucket ID from auth response by matching the bucket name
    const bucketInfo = authRes.data.allowed;
    let bucketId: string;

    // Check if bucketInfo contains direct bucket information
    if (bucketInfo.bucketName === process.env.B2_BUCKET) {
      bucketId = bucketInfo.bucketId;
      console.log(`[DEBUG] Found bucket ID: ${bucketId} for bucket name: ${process.env.B2_BUCKET}`);
    } else {
      throw new Error(`Bucket name "${process.env.B2_BUCKET}" not found in authorized buckets`);
    }

    console.log(`[DEBUG] Getting upload URL for bucket ID: ${bucketId}`);
    const { data } = await b2.getUploadUrl({
      bucketId: bucketId,
    });
    console.log(`[DEBUG] Reading file for upload: ${localPath}`);
    const fileData = await readFile(localPath);

    console.log(`[DEBUG] Uploading file to B2: ${remotePath}`);
    await b2.uploadFile({
      uploadUrl: data.uploadUrl,
      uploadAuthToken: data.authorizationToken,
      fileName: remotePath,
      data: fileData,
    });
    console.log(`[DEBUG] File uploaded to B2: ${remotePath}`);
  } catch (err) {
    console.error(`[ERROR] uploadFile failed for ${localPath} -> ${remotePath}:`, err);
    throw err;
  }
}

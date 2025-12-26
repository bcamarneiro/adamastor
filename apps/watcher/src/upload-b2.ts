import { readFile } from 'node:fs/promises';
// src/upload-b2.ts
import Backblaze from 'backblaze-b2';

if (!process.env.B2_KEY_ID) throw new Error('B2_KEY_ID is not set');
if (!process.env.B2_APP_KEY) throw new Error('B2_APP_KEY is not set');
if (!process.env.B2_BUCKET) throw new Error('B2_BUCKET is not set');

const b2 = new Backblaze({
  applicationKeyId: process.env.B2_KEY_ID!,
  applicationKey: process.env.B2_APP_KEY!,
});

export async function uploadFile(localPath: string, remotePath: string) {
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

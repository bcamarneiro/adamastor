# Backblaze B2 Upload Fix: Implementation Plan

## Problem Identified

The application is failing to upload files to Backblaze B2 storage with a 400 Bad Request error. After analyzing the logs and code, the issue has been identified:

- The application is using the **bucket name** (`parl-watch-snapshots`) instead of the **bucket ID** (`f257f4500452e6a498650715`) when calling the `getUploadUrl` API endpoint
- Backblaze B2 API specifically requires the bucket ID for this endpoint
- The bucket ID is available in the auth response but isn't being used

## Technical Details

- The auth response successfully returns with status 200 and contains the bucket information, including the correct bucket ID
- The `.env.development.local` file contains the bucket name rather than the ID
- Line 24 in `src/upload-b2.ts` is using the environment variable which contains the name, not the ID

## Solution Approach

Modify the `upload-b2.ts` file to extract the bucket ID from the authorization response rather than using the environment variable directly. This approach is more robust as it will:

1. Always use the correct bucket ID, even if the bucket is recreated or changes
2. Work even if the environment variable contains the bucket name (more intuitive for users)
3. Reduce potential for misconfiguration

## Implementation Changes

1. Update `src/upload-b2.ts` to extract and use the bucket ID from the auth response:

```typescript
export async function uploadFile(localPath: string, remotePath: string) {
  try {
    console.log(`[DEBUG] Authorizing B2 for upload`);
    const authRes = await b2.authorize(); // token good for 24h
    console.log(`[DEBUG] Authorized B2 for upload`);
    
    // Extract the bucket ID from auth response by matching the bucket name
    const bucketInfo = authRes.data.allowed;
    let bucketId = null;
    
    // If bucketName matches our environment variable, use that bucket's ID
    if (bucketInfo.bucketName === process.env.B2_BUCKET) {
      bucketId = bucketInfo.bucketId;
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
```

2. Documentation update for the `.env.development.local` file:

```
# Use bucket name (more user-friendly)
B2_BUCKET=parl-watch-snapshots
```

## Testing

1. Run the application with the changes
2. Verify that file uploads to B2 are successful
3. Test error handling by using an invalid bucket name

## Fallback Options

If the above solution doesn't work, two alternative approaches could be considered:

1. Update `.env.development.local` to use the bucket ID directly:
   ```
   B2_BUCKET=f257f4500452e6a498650715
   ```

2. Switch to Vercel Blob storage (already in project dependencies) if B2 integration continues to be problematic
/**
 * Pure helpers for the photos transform.
 *
 * Extracted from `photos.ts` so the validation and image-type detection
 * helpers can be unit-tested without importing supabase.
 */

import sharp from 'sharp';

// Thresholds for detecting placeholder images.
export const MIN_PHOTO_FILE_SIZE = 5000; // 5KB - placeholders are usually smaller
export const MIN_PHOTO_DIMENSION = 50; // 50px - minimum width/height for valid photos

export interface PhotoValidation {
  isValid: boolean;
  isPlaceholder: boolean;
  width?: number;
  height?: number;
  fileSize: number;
  reason?: string;
}

/**
 * Validate a photo buffer to detect Parliament placeholder images.
 *
 * A buffer is valid only when it is at least `MIN_PHOTO_FILE_SIZE` bytes,
 * has dimensions >= `MIN_PHOTO_DIMENSION` on both axes, and parses as a
 * known image format (JPEG/PNG via `sharp`).
 */
export async function validatePhoto(buffer: Buffer): Promise<PhotoValidation> {
  const fileSize = buffer.length;

  if (fileSize < MIN_PHOTO_FILE_SIZE) {
    return {
      isValid: false,
      isPlaceholder: true,
      fileSize,
      reason: `File too small (${fileSize} bytes < ${MIN_PHOTO_FILE_SIZE})`,
    };
  }

  try {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width < MIN_PHOTO_DIMENSION || height < MIN_PHOTO_DIMENSION) {
      return {
        isValid: false,
        isPlaceholder: true,
        width,
        height,
        fileSize,
        reason: `Dimensions too small (${width}x${height})`,
      };
    }

    return {
      isValid: true,
      isPlaceholder: false,
      width,
      height,
      fileSize,
    };
  } catch (err) {
    return {
      isValid: false,
      isPlaceholder: false,
      fileSize,
      reason: `Failed to parse image metadata: ${err}`,
    };
  }
}

/**
 * Detect whether a buffer's leading magic bytes match JPEG or PNG.
 *
 * Used to pick the storage filename extension. Defaults to `'jpg'` when the
 * leading bytes are not a PNG signature, which mirrors the Parliament API
 * (it returns JPEGs by default).
 */
export function detectImageType(buffer: Buffer): { extension: 'png' | 'jpg'; contentType: string } {
  const isPng =
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

  return isPng
    ? { extension: 'png', contentType: 'image/png' }
    : { extension: 'jpg', contentType: 'image/jpeg' };
}

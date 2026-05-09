import { describe, expect, it } from 'bun:test';
import sharp from 'sharp';
import { MIN_PHOTO_FILE_SIZE, detectImageType, validatePhoto } from './photos-helpers.js';

describe('detectImageType', () => {
  it('identifies PNG magic bytes and defaults the rest to JPEG', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectImageType(png)).toEqual({ extension: 'png', contentType: 'image/png' });

    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectImageType(jpeg)).toEqual({ extension: 'jpg', contentType: 'image/jpeg' });

    // Garbage bytes still fall back to JPEG (matches production behaviour).
    const garbage = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    expect(detectImageType(garbage)).toEqual({ extension: 'jpg', contentType: 'image/jpeg' });
  });
});

describe('validatePhoto', () => {
  it('flags small buffers as placeholders before parsing', async () => {
    const tiny = Buffer.alloc(MIN_PHOTO_FILE_SIZE - 1, 0xff);
    const result = await validatePhoto(tiny);

    expect(result.isValid).toBe(false);
    expect(result.isPlaceholder).toBe(true);
    expect(result.fileSize).toBe(MIN_PHOTO_FILE_SIZE - 1);
    expect(result.reason).toContain('File too small');
  });

  it('accepts a real-shape JPEG above all thresholds', async () => {
    // Generate a noisy 400x400 JPEG so the encoded output exceeds the
    // 5KB placeholder threshold (a solid colour compresses below it).
    const pixels = Buffer.alloc(400 * 400 * 3);
    for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 37) & 0xff;

    const buffer = await sharp(pixels, {
      raw: { width: 400, height: 400, channels: 3 },
    })
      .jpeg({ quality: 90 })
      .toBuffer();

    expect(buffer.length).toBeGreaterThan(MIN_PHOTO_FILE_SIZE);

    const result = await validatePhoto(buffer);

    expect(result.isValid).toBe(true);
    expect(result.isPlaceholder).toBe(false);
    expect(result.width).toBe(400);
    expect(result.height).toBe(400);
  });
});

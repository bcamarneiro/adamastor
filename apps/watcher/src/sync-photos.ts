/**
 * Enhanced photo sync script with placeholder detection.
 *
 * This script:
 * 1. Fetches all active deputies from the database
 * 2. Downloads photos from Parliament API
 * 3. Detects placeholder images (302 redirects to nophoto.jpg)
 * 4. Validates image quality using sharp
 * 5. Uploads valid photos to Supabase Storage
 * 6. Updates deputy photo_url in the database
 *
 * Usage:
 *   bun run src/sync-photos.ts [--dry-run] [--limit=N] [--force]
 *
 * Options:
 *   --dry-run  Show what would be done without making changes
 *   --limit=N  Only process first N deputies
 *   --force    Re-sync all photos, even if deputy already has one
 */

import { supabase } from './supabase.js';
import {
  downloadPhoto,
  validatePhoto,
  syncDeputyPhotoEnhanced,
} from './transform/photos.js';

interface SyncOptions {
  dryRun: boolean;
  limit: number | null;
  force: boolean;
}

interface SyncResult {
  deputyId: string;
  name: string;
  externalId: number;
  success: boolean;
  photoUrl?: string;
  reason?: string;
}

function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    dryRun: false,
    limit: null,
    force: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg.startsWith('--limit=')) {
      const limitVal = arg.split('=')[1];
      if (limitVal) {
        options.limit = Number.parseInt(limitVal, 10);
      }
    }
  }

  return options;
}

async function fetchDeputiesToSync(options: SyncOptions) {
  let query = supabase
    .from('deputies')
    .select('id, name, short_name, external_id, biography_id, photo_url, is_active')
    .eq('is_active', true)
    .order('name');

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch deputies: ${error.message}`);
  }

  // Filter out deputies that already have photos (unless --force)
  if (!options.force) {
    return (data || []).filter((d) => !d.photo_url);
  }

  return data || [];
}

async function syncPhotoForDeputy(
  deputy: {
    id: string;
    name: string;
    short_name: string;
    external_id: string;
    biography_id: number | null;
    photo_url: string | null;
  },
  dryRun: boolean
): Promise<SyncResult> {
  const externalId = Number.parseInt(deputy.external_id, 10);

  if (Number.isNaN(externalId) || externalId <= 0) {
    return {
      deputyId: deputy.id,
      name: deputy.short_name,
      externalId: 0,
      success: false,
      reason: 'Invalid external_id',
    };
  }

  // Use enhanced sync with fallback chain (biography → Parliament API)
  if (dryRun) {
    // For dry run, just check if we can get a photo without uploading
    const photoBuffer = await downloadPhoto(externalId);
    if (photoBuffer) {
      const validation = await validatePhoto(photoBuffer);
      if (validation.isValid && !validation.isPlaceholder) {
        return {
          deputyId: deputy.id,
          name: deputy.short_name,
          externalId,
          success: true,
          reason: `[DRY RUN] Would upload ${validation.fileSize} bytes (${validation.width}x${validation.height}) from Parliament API`,
        };
      }
    }
    return {
      deputyId: deputy.id,
      name: deputy.short_name,
      externalId,
      success: false,
      reason: '[DRY RUN] No valid photo found',
    };
  }

  // Use the enhanced sync function with biography fallback
  const result = await syncDeputyPhotoEnhanced(externalId, deputy.biography_id);

  if (!result.success) {
    return {
      deputyId: deputy.id,
      name: deputy.short_name,
      externalId,
      success: false,
      reason: result.reason || 'No valid photo found',
    };
  }

  // Update deputy record with new photo URL
  const { error: updateError } = await supabase
    .from('deputies')
    .update({ photo_url: result.photoUrl })
    .eq('id', deputy.id);

  if (updateError) {
    return {
      deputyId: deputy.id,
      name: deputy.short_name,
      externalId,
      success: false,
      reason: `DB update failed: ${updateError.message}`,
    };
  }

  // Include photo source in success message
  const sourceLabel = result.source === 'biography' ? 'biography page' : 'Parliament API';

  return {
    deputyId: deputy.id,
    name: deputy.short_name,
    externalId,
    success: true,
    photoUrl: result.photoUrl,
    reason: `from ${sourceLabel}`,
  };
}

async function main() {
  const options = parseArgs();

  console.log('📸 Enhanced Photo Sync Script');
  console.log('=============================');
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Force re-sync: ${options.force ? 'YES' : 'NO'}`);
  if (options.limit) console.log(`Limit: ${options.limit}`);
  console.log('');

  // Fetch deputies to sync
  const deputies = await fetchDeputiesToSync(options);
  console.log(`Found ${deputies.length} deputies to process\n`);

  if (deputies.length === 0) {
    console.log('No deputies need photo sync');
    return;
  }

  const results: SyncResult[] = [];
  let successCount = 0;
  let failCount = 0;

  // Process in batches to avoid overwhelming the server
  const batchSize = 5;

  for (let i = 0; i < deputies.length; i += batchSize) {
    const batch = deputies.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((deputy) => syncPhotoForDeputy(deputy, options.dryRun))
    );

    for (const result of batchResults) {
      results.push(result);

      if (result.success) {
        successCount++;
        if (result.photoUrl) {
          // Show the source of the photo (biography page or Parliament API)
          console.log(`✅ ${result.name}: uploaded ${result.reason || ''}`);
        } else {
          console.log(`✅ ${result.name}: ${result.reason}`);
        }
      } else {
        failCount++;
        console.log(`❌ ${result.name}: ${result.reason}`);
      }
    }

    // Progress update every 25 deputies
    const processed = Math.min(i + batchSize, deputies.length);
    if (processed % 25 === 0 || processed === deputies.length) {
      console.log(`\n📊 Progress: ${processed}/${deputies.length} (${successCount} ok, ${failCount} failed)\n`);
    }

    // Small delay between batches to be respectful to the server
    if (i + batchSize < deputies.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('\n=============================');
  console.log('📊 Final Summary');
  console.log('=============================');
  console.log(`Total processed: ${deputies.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed/No photo: ${failCount}`);
  console.log(`Success rate: ${((successCount / deputies.length) * 100).toFixed(1)}%`);

  if (options.dryRun) {
    console.log('\n⚠️  This was a dry run. No changes were made.');
    console.log('Run without --dry-run to actually sync photos.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

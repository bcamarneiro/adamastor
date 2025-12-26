import { supabase } from './supabase.js';
import { syncAllPhotos } from './transform/photos.js';

async function main() {
  console.log('🖼️  Deputy Photo Sync\n');
  console.log('='.repeat(50));

  // Get all deputies from database
  const { data: deputies, error } = await supabase
    .from('deputies')
    .select('id, external_id, short_name, photo_url')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching deputies:', error.message);
    process.exit(1);
  }

  if (!deputies || deputies.length === 0) {
    console.log('No deputies found in database');
    process.exit(0);
  }

  console.log(`Found ${deputies.length} active deputies\n`);

  // Get deputy IDs (external_id is the Parliament DepId)
  const depIds = deputies.map((d) => Number.parseInt(d.external_id, 10));

  // Sync photos
  const photoUrls = await syncAllPhotos(depIds);

  // Update database with new photo URLs
  console.log('📝 Updating database with new photo URLs...');

  let updateCount = 0;
  for (const deputy of deputies) {
    const depId = Number.parseInt(deputy.external_id, 10);
    const newUrl = photoUrls.get(depId);

    if (newUrl && newUrl !== deputy.photo_url) {
      const { error: updateError } = await supabase
        .from('deputies')
        .update({ photo_url: newUrl })
        .eq('id', deputy.id);

      if (updateError) {
        console.error(`  Error updating ${deputy.short_name}:`, updateError.message);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`✅ Updated ${updateCount} photo URLs in database\n`);
  console.log('Done!');
}

main().catch(console.error);

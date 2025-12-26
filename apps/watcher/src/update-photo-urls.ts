import { supabase } from './supabase.js';

async function main() {
  console.log('Updating deputy photo URLs in database...\n');

  // List all photos in storage
  const { data: photos, error: listError } = await supabase.storage
    .from('deputy-photos')
    .list('', { limit: 1000 });

  if (listError) {
    console.error('Error listing photos:', listError.message);
    process.exit(1);
  }

  console.log(`Found ${photos?.length || 0} photos in storage\n`);

  // Get all deputies
  const { data: deputies, error: deputiesError } = await supabase
    .from('deputies')
    .select('id, external_id, short_name');

  if (deputiesError) {
    console.error('Error fetching deputies:', deputiesError.message);
    process.exit(1);
  }

  // Create a map of external_id to photo filename
  const photoFiles = new Set(photos?.map((p) => p.name.replace('.jpg', '')) || []);

  let updateCount = 0;
  for (const deputy of deputies || []) {
    if (photoFiles.has(deputy.external_id)) {
      // Get public URL
      const { data } = supabase.storage
        .from('deputy-photos')
        .getPublicUrl(`${deputy.external_id}.jpg`);

      const { error: updateError } = await supabase
        .from('deputies')
        .update({ photo_url: data.publicUrl })
        .eq('id', deputy.id);

      if (updateError) {
        console.error(`  Error updating ${deputy.short_name}:`, updateError.message);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`\nUpdated ${updateCount} photo URLs in database`);
  console.log('Done!');
}

main().catch(console.error);

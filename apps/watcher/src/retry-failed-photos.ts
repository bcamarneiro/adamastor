import { supabase } from './supabase.js';
import { syncDeputyPhoto } from './transform/photos.js';

async function main() {
  console.log('Retrying failed deputy photo syncs...\n');

  // Get deputies that still have Parliament URLs
  const { data: deputies, error } = await supabase
    .from('deputies')
    .select('id, external_id, short_name, photo_url')
    .eq('is_active', true)
    .like('photo_url', '%parlamento.pt%');

  if (error) {
    console.error('Error fetching deputies:', error.message);
    process.exit(1);
  }

  if (!deputies || deputies.length === 0) {
    console.log('All deputies already have Supabase Storage URLs!');
    process.exit(0);
  }

  console.log(`Found ${deputies.length} deputies with Parliament URLs to retry\n`);

  let successCount = 0;
  let failCount = 0;

  // Process one at a time with longer delays to avoid overwhelming server
  for (const deputy of deputies) {
    const depId = Number.parseInt(deputy.external_id, 10);
    console.log(`  Syncing ${deputy.short_name} (${depId})...`);

    const url = await syncDeputyPhoto(depId);

    if (url) {
      const { error: updateError } = await supabase
        .from('deputies')
        .update({ photo_url: url })
        .eq('id', deputy.id);

      if (updateError) {
        console.error('    Error updating DB:', updateError.message);
        failCount++;
      } else {
        console.log('    ✓ Success');
        successCount++;
      }
    } else {
      console.log('    ✗ Failed to download');
      failCount++;
    }

    // Longer delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log(`\n✅ Done: ${successCount} successful, ${failCount} failed`);
}

main().catch(console.error);

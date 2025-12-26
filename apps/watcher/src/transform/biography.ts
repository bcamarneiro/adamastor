/**
 * Transform module for deputy biography data.
 *
 * Handles:
 * 1. Fetch biographies for deputies with biography_id
 * 2. Upsert biography records to database
 * 3. Update deputy_stats with attendance aggregate
 */

import { type BiographyData, fetchBiography } from '../scrapers/biography.js';
import { supabase } from '../supabase.js';

const POLITENESS_DELAY_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface DeputyWithBiographyId {
  id: string;
  name: string;
  biography_id: number;
}

/**
 * Get all active deputies with biography_id
 */
async function getDeputiesWithBiographyId(): Promise<DeputyWithBiographyId[]> {
  const { data, error } = await supabase
    .from('deputies')
    .select('id, name, biography_id')
    .not('biography_id', 'is', null)
    .eq('is_active', true);

  if (error) {
    console.error('  [ERROR] Failed to fetch deputies:', error.message);
    return [];
  }

  return (data || []).map((d) => ({
    id: d.id,
    name: d.name,
    biography_id: d.biography_id as number,
  }));
}

/**
 * Upsert a single biography record
 */
async function upsertBiography(deputyId: string, bio: BiographyData): Promise<boolean> {
  const { error } = await supabase.from('deputy_biographies').upsert(
    {
      deputy_id: deputyId,
      birth_date: bio.birthDate,
      profession: bio.profession,
      education: bio.education,
      bio_narrative: bio.bioNarrative,
      source_url: bio.sourceUrl,
      scraped_at: new Date().toISOString(),
    },
    { onConflict: 'deputy_id' }
  );

  if (error) {
    console.error('  [ERROR] Failed to upsert biography:', error.message);
    return false;
  }

  return true;
}

/**
 * Main transform function for biography data
 */
export async function transformBiographies(): Promise<{
  total: number;
  scraped: number;
  withBirthDate: number;
  withProfession: number;
  withEducation: number;
}> {
  console.log('📝 Transforming deputy biographies...\n');

  const deputies = await getDeputiesWithBiographyId();
  console.log(`  Found ${deputies.length} deputies with biography_id\n`);

  if (deputies.length === 0) {
    return {
      total: 0,
      scraped: 0,
      withBirthDate: 0,
      withProfession: 0,
      withEducation: 0,
    };
  }

  let scraped = 0;
  let withBirthDate = 0;
  let withProfession = 0;
  let withEducation = 0;

  for (let i = 0; i < deputies.length; i++) {
    const deputy = deputies[i];
    if (!deputy) continue;

    const progress = `[${i + 1}/${deputies.length}]`;

    try {
      const bio = await fetchBiography(deputy.biography_id);

      if (bio) {
        const success = await upsertBiography(deputy.id, bio);
        if (success) {
          scraped++;
          if (bio.birthDate) withBirthDate++;
          if (bio.profession) withProfession++;
          if (bio.education) withEducation++;
          console.log(`  ${progress} ✓ ${deputy.name}`);
        } else {
          console.log(`  ${progress} ✗ ${deputy.name} (db error)`);
        }
      } else {
        console.log(`  ${progress} - ${deputy.name} (no data)`);
      }
    } catch (err) {
      console.error(`  ${progress} ✗ ${deputy.name}:`, err instanceof Error ? err.message : err);
    }

    // Be polite - add delay between requests
    if (i < deputies.length - 1) {
      await sleep(POLITENESS_DELAY_MS);
    }
  }

  console.log('\n  Summary:');
  console.log(`    Total deputies: ${deputies.length}`);
  console.log(`    Biographies scraped: ${scraped}`);
  console.log(`    With birth date: ${withBirthDate}`);
  console.log(`    With profession: ${withProfession}`);
  console.log(`    With education: ${withEducation}`);

  return {
    total: deputies.length,
    scraped,
    withBirthDate,
    withProfession,
    withEducation,
  };
}

// CLI entry point
if (import.meta.main) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           BIOGRAPHY TRANSFORM - Parliament Data');
  console.log('═══════════════════════════════════════════════════════════\n');

  transformBiographies()
    .then((result) => {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('                    TRANSFORM COMPLETE');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Scraped: ${result.scraped}/${result.total}`);
    })
    .catch((err) => {
      console.error('[ERROR] Transform failed:', err);
      process.exit(1);
    });
}

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

/** Number of days before a biography is considered stale and needs re-scraping */
const BIOGRAPHY_TTL_DAYS = 7;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface DeputyWithBiographyId {
  id: string;
  name: string;
  biography_id: number;
}

/**
 * Get active deputies with biography_id that need scraping.
 * Skips deputies whose biography was scraped within the TTL period.
 *
 * @param forceAll - If true, ignores TTL and returns all deputies (for full resync)
 */
async function getDeputiesWithBiographyId(forceAll = false): Promise<DeputyWithBiographyId[]> {
  // Calculate stale date threshold
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - BIOGRAPHY_TTL_DAYS);
  const staleDateIso = staleDate.toISOString();

  // First, get all active deputies with biography_id
  const query = supabase
    .from('deputies')
    .select('id, name, biography_id')
    .not('biography_id', 'is', null)
    .eq('is_active', true);

  const { data: deputies, error } = await query;

  if (error) {
    console.error('  [ERROR] Failed to fetch deputies:', error.message);
    return [];
  }

  if (!deputies || deputies.length === 0) {
    return [];
  }

  // If forcing all, return everything
  if (forceAll) {
    return deputies.map((d) => ({
      id: d.id,
      name: d.name,
      biography_id: d.biography_id as number,
    }));
  }

  // Get existing biographies to check TTL
  const deputyIds = deputies.map((d) => d.id);
  const { data: biographies } = await supabase
    .from('deputy_biographies')
    .select('deputy_id, scraped_at')
    .in('deputy_id', deputyIds);

  // Create a map of deputy_id -> scraped_at
  const scrapedAtMap = new Map<string, string>();
  for (const bio of biographies || []) {
    if (bio.scraped_at) {
      scrapedAtMap.set(bio.deputy_id, bio.scraped_at);
    }
  }

  // Filter to only deputies that need scraping (no biography or stale)
  const needsScraping = deputies.filter((d) => {
    const scrapedAt = scrapedAtMap.get(d.id);
    if (!scrapedAt) return true; // Never scraped
    return scrapedAt < staleDateIso; // Stale (older than TTL)
  });

  return needsScraping.map((d) => ({
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
 *
 * @param forceAll - If true, scrapes all deputies regardless of TTL
 */
export async function transformBiographies(forceAll = false): Promise<{
  total: number;
  scraped: number;
  skipped: number;
  withBirthDate: number;
  withProfession: number;
  withEducation: number;
}> {
  console.log('📝 Transforming deputy biographies...\n');

  // Get total active deputies for reporting
  const { count: totalActive } = await supabase
    .from('deputies')
    .select('id', { count: 'exact', head: true })
    .not('biography_id', 'is', null)
    .eq('is_active', true);

  const deputies = await getDeputiesWithBiographyId(forceAll);
  const skipped = (totalActive || 0) - deputies.length;

  if (skipped > 0) {
    console.log(`  Found ${totalActive} deputies with biography_id`);
    console.log(`  Skipping ${skipped} recently scraped (within ${BIOGRAPHY_TTL_DAYS} days)`);
    console.log(`  Will scrape ${deputies.length} stale/new biographies\n`);
  } else {
    console.log(`  Found ${deputies.length} deputies with biography_id\n`);
  }

  if (deputies.length === 0) {
    return {
      total: totalActive || 0,
      scraped: 0,
      skipped,
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
  console.log(`    Total deputies: ${totalActive || 0}`);
  console.log(`    Skipped (recent): ${skipped}`);
  console.log(`    Biographies scraped: ${scraped}`);
  console.log(`    With birth date: ${withBirthDate}`);
  console.log(`    With profession: ${withProfession}`);
  console.log(`    With education: ${withEducation}`);

  return {
    total: totalActive || 0,
    scraped,
    skipped,
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

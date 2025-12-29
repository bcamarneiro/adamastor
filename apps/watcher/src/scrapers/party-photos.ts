/**
 * Scrape deputy photos from party websites.
 *
 * Since the Parliament API returns placeholder images for current legislature deputies,
 * we scrape photos directly from party websites which have higher quality images.
 *
 * Supported parties:
 * - PSD: https://www.psd.pt/pt/grupo-parlamentar/deputados/nome
 * - CHEGA: https://partidochega.pt/index.php/2024legislativas_rostosmudanca/
 * - BE: https://parlamento.bloco.org/node/6133
 * - IL: https://iniciativaliberal.pt/pessoas/grupo-parlamentar-nacional/
 * - PCP: https://www.pcp.pt/deputados-do-pcp-assembleia-da-republica
 * - LIVRE: https://partidolivre.pt/parlamento/
 *
 * Not supported (no photos available on website):
 * - PS: Only text list at https://ps.pt/deputados-eleitos-pelo-ps/
 * - CDS-PP: No deputies page found
 * - PAN: Only 1 deputy, no photo URL on page
 */

import { CURRENT_LEGISLATURE } from '../config.js';
import { supabase } from '../supabase.js';
import { uploadPhotoToStorage, validatePhoto } from '../transform/photos.js';

interface PartyPhotoConfig {
  partyAcronym: string;
  baseUrl: string;
  listPageUrl: string;
  photoUrlPattern: RegExp;
  namePattern: RegExp;
}

interface ScrapedPhoto {
  name: string;
  photoUrl: string;
  partyAcronym: string;
}

const PARTY_CONFIGS: PartyPhotoConfig[] = [
  {
    partyAcronym: 'PSD',
    baseUrl: 'https://www.psd.pt',
    listPageUrl: 'https://www.psd.pt/pt/grupo-parlamentar/deputados/nome',
    photoUrlPattern:
      /\/sites\/default\/files\/styles\/people_card_735x825\/public\/[^"'\s]+\.jpg/gi,
    namePattern: /<a[^>]*>([^<]+)<\/a>/gi,
  },
  {
    partyAcronym: 'CH',
    baseUrl: 'https://partidochega.pt',
    listPageUrl: 'https://partidochega.pt/index.php/2024legislativas_rostosmudanca/',
    photoUrlPattern: /https:\/\/partidochega\.pt\/wp-content\/uploads\/2024\/\d+\/[^"'\s]+\.jpg/gi,
    namePattern: /<h3[^>]*>([^<]+)<\/h3>/gi,
  },
  {
    partyAcronym: 'BE',
    baseUrl: 'https://parlamento.bloco.org',
    listPageUrl: 'https://parlamento.bloco.org/node/6133',
    photoUrlPattern: /\/sites\/default\/files\/styles\/[^"'\s]+\.jpg[^"'\s]*/gi,
    namePattern: /<h2[^>]*>([^<]+)<\/h2>/gi,
  },
  {
    partyAcronym: 'IL',
    baseUrl: 'https://iniciativaliberal.pt',
    listPageUrl: 'https://iniciativaliberal.pt/pessoas/grupo-parlamentar-nacional/',
    photoUrlPattern:
      /https:\/\/iniciativaliberal\.pt\/wp-content\/uploads\/[^"'\s]+\-copiar\.jpg/gi,
    namePattern: /<h[23][^>]*>([^<]+)<\/h[23]>/gi,
  },
  {
    partyAcronym: 'PCP',
    baseUrl: 'https://www.pcp.pt',
    listPageUrl: 'https://www.pcp.pt/deputados-do-pcp-assembleia-da-republica',
    photoUrlPattern: /\/sites\/default\/files\/images\/deputados\/[^"'\s]+\.jpg/gi,
    namePattern: /<h[23][^>]*>([^<]+)<\/h[23]>/gi,
  },
  {
    partyAcronym: 'L',
    baseUrl: 'https://partidolivre.pt',
    listPageUrl: 'https://partidolivre.pt/parlamento/',
    // LIVRE photos follow pattern: Name-Surname-2025.png or Name-Middle-Surname-2025.png
    photoUrlPattern:
      /https:\/\/partidolivre\.pt\/wp-content\/uploads\/2025\/\d{2}\/[A-Z][a-z]+(?:-[A-Z][a-z]+)+-\d{4}\.png/gi,
    namePattern: /<h[23][^>]*>([^<]+)<\/h[23]>/gi,
  },
];

/**
 * Fetch a page and extract photo URLs using pattern matching.
 */
async function scrapePage(config: PartyPhotoConfig): Promise<ScrapedPhoto[]> {
  console.log(`  Scraping ${config.partyAcronym} from ${config.listPageUrl}`);

  try {
    const response = await fetch(config.listPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GovPerfBot/1.0; +https://debaixodolho.pt)',
      },
    });

    if (!response.ok) {
      console.error(`    Failed to fetch: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const photos: ScrapedPhoto[] = [];

    // Extract all photo URLs
    const photoMatches = html.match(config.photoUrlPattern) || [];

    for (const photoPath of photoMatches) {
      // Make URL absolute if needed
      const photoUrl = photoPath.startsWith('http') ? photoPath : `${config.baseUrl}${photoPath}`;

      // Try to extract name from URL or nearby HTML
      const name = extractNameFromUrl(photoUrl);

      if (name) {
        photos.push({
          name,
          photoUrl,
          partyAcronym: config.partyAcronym,
        });
      }
    }

    console.log(`    Found ${photos.length} photos`);
    return photos;
  } catch (error) {
    console.error(`    Error scraping ${config.partyAcronym}:`, error);
    return [];
  }
}

/**
 * Extract a deputy name from the photo URL.
 * URLs typically contain the deputy name, e.g.:
 * - PSD: /PSD-Ana%20Oliveira.jpg
 * - CHEGA: /1-andre-ventura.jpg
 */
function extractNameFromUrl(url: string): string | null {
  try {
    // Get filename from URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || '';

    // Remove extension and decode URL encoding
    let name = decodeURIComponent(filename.replace(/\.(jpg|png|jpeg)$/i, ''));

    // Remove common prefixes like "PSD-", "1-", "2-"
    name = name.replace(/^(PSD|PS|CH|BE|IL|L|PCP|CDS)-/i, '');
    name = name.replace(/^\d+-/, '');
    name = name.replace(/_/g, ' ');
    name = name.replace(/-/g, ' ');

    // Clean up and normalize
    name = name.trim();

    // Skip if name is too short or looks like a generic filename
    if (name.length < 3 || /^(img|image|photo|foto)/i.test(name)) {
      return null;
    }

    return name;
  } catch {
    return null;
  }
}

/**
 * Normalize a name for fuzzy matching.
 */
function normalizeName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: Unicode range for diacritical marks is intentional
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z\s]/g, '') // Remove non-alpha
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Find matching deputy in database by fuzzy name matching.
 */
async function findDeputyByName(
  scrapedName: string,
  partyAcronym: string,
  deputies: Array<{
    id: string;
    name: string;
    short_name: string;
    external_id: string;
    party_acronym: string;
  }>
): Promise<{ id: string; external_id: string } | null> {
  const normalizedScraped = normalizeName(scrapedName);

  // Filter to matching party first
  const partyDeputies = deputies.filter((d) => d.party_acronym === partyAcronym);

  for (const deputy of partyDeputies) {
    const normalizedName = normalizeName(deputy.name);
    const normalizedShort = normalizeName(deputy.short_name);

    // Check for exact match or partial match
    if (
      normalizedName === normalizedScraped ||
      normalizedShort === normalizedScraped ||
      normalizedName.includes(normalizedScraped) ||
      normalizedScraped.includes(normalizedName) ||
      normalizedShort.includes(normalizedScraped) ||
      normalizedScraped.includes(normalizedShort)
    ) {
      return { id: deputy.id, external_id: deputy.external_id };
    }
  }

  // Try matching across all deputies if party match failed
  for (const deputy of deputies) {
    const normalizedName = normalizeName(deputy.name);
    const normalizedShort = normalizeName(deputy.short_name);

    if (normalizedName === normalizedScraped || normalizedShort === normalizedScraped) {
      return { id: deputy.id, external_id: deputy.external_id };
    }
  }

  return null;
}

/**
 * Download photo and upload to Supabase Storage.
 */
async function downloadAndUploadPhoto(
  photoUrl: string,
  externalId: string
): Promise<string | null> {
  try {
    const response = await fetch(photoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GovPerfBot/1.0; +https://debaixodolho.pt)',
      },
    });

    if (!response.ok) {
      console.log(`      Failed to download: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate photo
    const validation = await validatePhoto(buffer);
    if (!validation.isValid || validation.isPlaceholder) {
      console.log(`      Invalid photo: ${validation.reason}`);
      return null;
    }

    // Upload to Supabase Storage
    const result = await uploadPhotoToStorage(Number.parseInt(externalId, 10), buffer);

    if (!result.success) {
      console.log(`      Upload failed: ${result.error}`);
      return null;
    }

    return result.url || null;
  } catch (error) {
    console.error('      Error downloading photo:', error);
    return null;
  }
}

/**
 * Main function to scrape photos from all party websites.
 */
export async function scrapePartyPhotos(options: {
  dryRun?: boolean;
  parties?: string[];
  limit?: number;
}): Promise<{ synced: number; failed: number; skipped: number }> {
  const { dryRun = false, parties, limit } = options;

  console.log('\n📸 Scraping Deputy Photos from Party Websites');
  console.log('==============================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (parties) console.log(`Parties: ${parties.join(', ')}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log('');

  // Fetch all active deputies with their party info (current legislature only)
  const { data: deputies, error } = await supabase
    .from('deputy_details')
    .select('id, name, short_name, external_id, photo_url, party_acronym, legislature')
    .eq('is_active', true)
    .eq('legislature', CURRENT_LEGISLATURE);

  if (error || !deputies) {
    console.error('Failed to fetch deputies:', error?.message);
    return { synced: 0, failed: 0, skipped: 0 };
  }

  console.log(`Found ${deputies.length} active deputies in database\n`);

  // Filter configs by requested parties
  const configs = parties
    ? PARTY_CONFIGS.filter((c) => parties.includes(c.partyAcronym))
    : PARTY_CONFIGS;

  // Scrape all party pages
  const allPhotos: ScrapedPhoto[] = [];
  for (const config of configs) {
    const photos = await scrapePage(config);
    allPhotos.push(...photos);

    // Small delay between party scrapes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\nTotal scraped photos: ${allPhotos.length}\n`);

  let synced = 0;
  let failed = 0;
  let skipped = 0;
  let processed = 0;

  // Match and sync photos
  for (const photo of allPhotos) {
    if (limit && processed >= limit) break;

    const deputy = await findDeputyByName(photo.name, photo.partyAcronym, deputies);

    if (!deputy) {
      console.log(`  ⚪ No match for "${photo.name}" (${photo.partyAcronym})`);
      skipped++;
      continue;
    }

    // Check if deputy already has a non-placeholder photo
    const existingDeputy = deputies.find((d) => d.id === deputy.id);
    if (existingDeputy?.photo_url && !existingDeputy.photo_url.includes('parlamento.pt')) {
      console.log(`  ⏭️  ${photo.name} already has photo`);
      skipped++;
      continue;
    }

    processed++;

    if (dryRun) {
      console.log(
        `  🔵 [DRY RUN] Would sync: ${photo.name} → ${photo.photoUrl.substring(0, 50)}...`
      );
      synced++;
      continue;
    }

    console.log(`  📥 Syncing ${photo.name}...`);

    const newUrl = await downloadAndUploadPhoto(photo.photoUrl, deputy.external_id);

    if (newUrl) {
      // Update database
      const { error: updateError } = await supabase
        .from('deputies')
        .update({ photo_url: newUrl })
        .eq('id', deputy.id);

      if (updateError) {
        console.log(`      ❌ DB update failed: ${updateError.message}`);
        failed++;
      } else {
        console.log('      ✅ Success');
        synced++;
      }
    } else {
      failed++;
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\n==============================================');
  console.log(`📊 Results: ${synced} synced, ${failed} failed, ${skipped} skipped`);

  return { synced, failed, skipped };
}

/**
 * Biography Scraper
 *
 * Scrapes deputy biography data from the Parliament website.
 * Data is available in static HTML - no browser automation needed.
 *
 * Biography Page: https://www.parlamento.pt/DeputadoGP/Paginas/Biografia.aspx?BID={id}
 */

import { POLITENESS_UA } from '../config.js';
import { supabase } from '../supabase.js';

const BASE_URL = 'https://www.parlamento.pt';
const BIOGRAPHY_URL = `${BASE_URL}/DeputadoGP/Paginas/Biografia.aspx`;

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const POLITENESS_DELAY_MS = 500; // Delay between requests to be polite

export interface BiographyData {
  biographyId: number;
  birthDate: string | null;
  profession: string | null;
  education: string | null;
  bioNarrative: string | null;
  sourceUrl: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': POLITENESS_UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
        },
      });

      if (res.ok) {
        return await res.text();
      }

      if (res.status >= 500) {
        lastError = new Error(`Server error: ${res.status}`);
        console.warn(`[WARN] Attempt ${attempt}/${retries} failed: ${res.status}`);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[WARN] Attempt ${attempt}/${retries} failed: ${lastError.message}`);
    }

    if (attempt < retries) {
      const delay = INITIAL_DELAY_MS * 2 ** (attempt - 1);
      console.log(`[DEBUG] Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Parse date strings in Portuguese format
 * Examples: "23 de Agosto de 1975", "5 de Janeiro de 1960"
 */
function parsePortugueseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const months: Record<string, string> = {
    janeiro: '01',
    fevereiro: '02',
    marco: '03',
    abril: '04',
    maio: '05',
    junho: '06',
    julho: '07',
    agosto: '08',
    setembro: '09',
    outubro: '10',
    novembro: '11',
    dezembro: '12',
  };

  // Normalize and match
  const normalized = dateStr
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents

  const match = normalized.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
  if (!match) return null;

  const day = match[1];
  const monthName = match[2];
  const year = match[3];

  if (!day || !monthName || !year) return null;

  const month = months[monthName];
  if (!month) return null;

  return `${year}-${month}-${day.padStart(2, '0')}`;
}

/**
 * Extract value from Parliament biography page using SharePoint span pattern.
 * The HTML structure uses spans with IDs like:
 * - ucDOB_rptContent_ctl01_lblText for birth date
 * - ucProf_rptContent_ctl01_lblText for profession
 * - ucHabilitacoes_rptContent_ctl01_lblText for education
 * - ucCargosExercidos_rptContent_ctl01_lblText for positions held
 */
function extractSpanValue(html: string, fieldId: string): string | null {
  // Pattern matches SharePoint-generated span IDs
  // The field ID is part of the span id, e.g., ucDOB, ucProf, etc.
  const pattern = new RegExp(`${fieldId}_rptContent_ctl\\d+_lblText[^>]*>([^<]+)<`, 'i');
  const match = html.match(pattern);
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : null;
}

/**
 * Extract multiple values for a field (e.g., multiple education entries)
 */
function extractAllSpanValues(html: string, fieldId: string): string[] {
  const pattern = new RegExp(`${fieldId}_rptContent_ctl\\d+_lblText[^>]*>([^<]+)<`, 'gi');
  const matches: string[] = [];
  const allMatches = html.matchAll(pattern);
  for (const match of allMatches) {
    const value = match[1]?.trim();
    if (value && value.length > 0) {
      matches.push(value);
    }
  }
  return matches;
}

/**
 * Fetch biography data for a single deputy
 */
export async function fetchBiography(biographyId: number): Promise<BiographyData | null> {
  const url = `${BIOGRAPHY_URL}?BID=${biographyId}`;

  try {
    const html = await fetchWithRetry(url);

    // Extract birth date (format: YYYY-MM-DD directly from API)
    let birthDate: string | null = extractSpanValue(html, 'ucDOB');
    // If it's not in ISO format, try parsing Portuguese format
    if (birthDate && !birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      birthDate = parsePortugueseDate(birthDate);
    }

    // Extract profession
    const profession = extractSpanValue(html, 'ucProf');

    // Extract education (may have multiple entries)
    const educationEntries = extractAllSpanValues(html, 'ucHabilitacoes');
    const education = educationEntries.length > 0 ? educationEntries.join('; ') : null;

    // Extract positions held as narrative
    const positions = extractAllSpanValues(html, 'ucCargosExercidos');
    let bioNarrative: string | null = null;
    if (positions.length > 0) {
      bioNarrative = positions.join('\n');
    }

    // Only return if we found at least some data
    if (!birthDate && !profession && !education && !bioNarrative) {
      return null;
    }

    return {
      biographyId,
      birthDate,
      profession,
      education,
      bioNarrative,
      sourceUrl: url,
    };
  } catch (err) {
    console.warn(`[WARN] Failed to fetch biography for BID=${biographyId}:`, err);
    return null;
  }
}

/**
 * Get all deputies with biography_id from the database
 */
export async function getDeputiesWithBiographyId(): Promise<
  Array<{ id: string; name: string; biography_id: number }>
> {
  const { data, error } = await supabase
    .from('deputies')
    .select('id, name, biography_id')
    .not('biography_id', 'is', null)
    .eq('is_active', true);

  if (error) {
    console.error('[ERROR] Failed to fetch deputies:', error.message);
    return [];
  }

  return (data || []).map((d) => ({
    id: d.id,
    name: d.name,
    biography_id: d.biography_id as number,
  }));
}

/**
 * Fetch biographies for all deputies with biography_id
 */
export async function fetchAllBiographies(
  onProgress?: (current: number, total: number, name: string) => void
): Promise<Map<number, BiographyData>> {
  const deputies = await getDeputiesWithBiographyId();
  console.log(`[INFO] Found ${deputies.length} deputies with biography_id`);

  const biographies = new Map<number, BiographyData>();

  for (let i = 0; i < deputies.length; i++) {
    const deputy = deputies[i];
    if (!deputy) continue;

    console.log(
      `[INFO] Fetching biography ${i + 1}/${deputies.length}: ${deputy.name} (BID=${deputy.biography_id})`
    );

    const bio = await fetchBiography(deputy.biography_id);
    if (bio) {
      biographies.set(deputy.biography_id, bio);
    }

    if (onProgress) {
      onProgress(i + 1, deputies.length, deputy.name);
    }

    // Be polite - add delay between requests
    if (i < deputies.length - 1) {
      await sleep(POLITENESS_DELAY_MS);
    }
  }

  console.log(`[INFO] Successfully fetched ${biographies.size} biographies`);
  return biographies;
}

// CLI entry point
if (import.meta.main) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           BIOGRAPHY SCRAPER - Parliament Data');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Test with a single biography first
    const testBid = 7489; // Example deputy
    console.log(`[TEST] Fetching biography for BID=${testBid}...`);
    const testBio = await fetchBiography(testBid);

    if (testBio) {
      console.log('\n[TEST] Sample biography:');
      console.log(`  Birth Date: ${testBio.birthDate || 'N/A'}`);
      console.log(`  Profession: ${testBio.profession || 'N/A'}`);
      console.log(`  Education: ${testBio.education || 'N/A'}`);
      console.log(`  Bio Length: ${testBio.bioNarrative?.length || 0} chars`);
      console.log(`  Source: ${testBio.sourceUrl}`);
    } else {
      console.log('\n[TEST] No biography data extracted');
    }

    // Full scrape
    console.log('\n[INFO] Starting full biography scrape...\n');
    const biographies = await fetchAllBiographies((current, total, name) => {
      const pct = Math.round((current / total) * 100);
      console.log(`  Progress: ${current}/${total} (${pct}%) - ${name}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                       SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Biographies scraped: ${biographies.size}`);

    // Stats
    let withBirthDate = 0;
    let withProfession = 0;
    let withEducation = 0;

    for (const bio of biographies.values()) {
      if (bio.birthDate) withBirthDate++;
      if (bio.profession) withProfession++;
      if (bio.education) withEducation++;
    }

    console.log(`With birth date: ${withBirthDate}`);
    console.log(`With profession: ${withProfession}`);
    console.log(`With education: ${withEducation}`);
  } catch (err) {
    console.error('[ERROR] Scraping failed:', err);
    process.exit(1);
  }
}

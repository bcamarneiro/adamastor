/**
 * Attendance Scraper
 *
 * Scrapes plenary meeting attendance from the Parliament website.
 * Data is available in static HTML - no browser automation needed.
 *
 * Meeting List: https://www.parlamento.pt/DeputadoGP/Paginas/reunioesplenarias.aspx
 * Meeting Detail: https://www.parlamento.pt/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID={id}
 */

import { POLITENESS_UA } from '../config.js';
import { supabase } from '../supabase.js';

const BASE_URL = 'https://www.parlamento.pt';
const MEETING_LIST_URL = `${BASE_URL}/DeputadoGP/Paginas/reunioesplenarias.aspx`;
const MEETING_DETAIL_URL = `${BASE_URL}/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx`;

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const POLITENESS_DELAY_MS = 500; // Delay between requests to be polite

export interface PlenaryMeeting {
  bid: number;
  date: string; // ISO date format
}

export interface AttendanceRecord {
  meetingBid: number;
  meetingDate: string;
  deputyBid: number;
  deputyName: string;
  party: string;
  status: 'present' | 'absent_quorum' | 'absent_justified' | 'absent_unjustified';
  statusRaw: string;
  reason: string | null;
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
 * Parse status text to normalized status enum
 */
function parseStatus(
  statusText: string
): 'present' | 'absent_quorum' | 'absent_justified' | 'absent_unjustified' {
  const normalized = statusText.toLowerCase().trim();

  if (normalized.includes('presença') || normalized.includes('(p)')) {
    return 'present';
  }
  if (normalized.includes('quórum')) {
    return 'absent_quorum';
  }
  if (
    normalized.includes('justificada') ||
    normalized.includes('missão oficial') ||
    normalized.includes('substituição')
  ) {
    return 'absent_justified';
  }
  return 'absent_unjustified';
}

/**
 * Fetch list of all plenary meetings from the main page
 */
export async function fetchMeetingList(): Promise<PlenaryMeeting[]> {
  console.log('[INFO] Fetching plenary meeting list...');
  const html = await fetchWithRetry(MEETING_LIST_URL);

  const meetings: PlenaryMeeting[] = [];

  // Pattern: <a ... href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=335330">2025-12-18</a>
  const regex = /href="[^"]*DetalheReuniaoPlenaria\.aspx\?BID=(\d+)"[^>]*>(\d{4}-\d{2}-\d{2})</g;

  for (const match of html.matchAll(regex)) {
    const bidStr = match[1];
    const dateStr = match[2];
    if (bidStr && dateStr) {
      meetings.push({
        bid: Number.parseInt(bidStr, 10),
        date: dateStr,
      });
    }
  }

  console.log(`[INFO] Found ${meetings.length} plenary meetings`);
  return meetings;
}

/**
 * Fetch attendance for a single plenary meeting
 */
export async function fetchMeetingAttendance(meeting: PlenaryMeeting): Promise<AttendanceRecord[]> {
  const url = `${MEETING_DETAIL_URL}?BID=${meeting.bid}`;
  const html = await fetchWithRetry(url);

  const records: AttendanceRecord[] = [];

  // The HTML structure repeats for each deputy:
  // <a ... href="...Biografia.aspx?BID=7489">Deputy Name</a>
  // <span ... id="...lblGP" ...>PSD</span>
  // <span ... id="...lblPresenca" ...>Presença (P)</span>
  // <span ... id="...lblMotivo" ...>Reason text</span>

  // Pattern to extract deputy blocks (each deputy has hplDeputado, lblGP, lblPresenca, lblMotivo)
  const deputyBlockRegex =
    /hplDeputado[^>]*href="[^"]*BID=(\d+)"[^>]*>([^<]+)<\/a>[\s\S]*?lblGP[^>]*>([^<]*)<[\s\S]*?lblPresenca[^>]*>([^<]*)<[\s\S]*?lblMotivo[^>]*>([^<]*)</g;

  for (const deputyMatch of html.matchAll(deputyBlockRegex)) {
    const bidStr = deputyMatch[1];
    const name = deputyMatch[2];
    const party = deputyMatch[3];
    const statusRaw = deputyMatch[4];
    const reason = deputyMatch[5];

    if (!bidStr || !name || !statusRaw) continue;

    const deputyBid = Number.parseInt(bidStr, 10);
    const status = parseStatus(statusRaw);

    records.push({
      meetingBid: meeting.bid,
      meetingDate: meeting.date,
      deputyBid,
      deputyName: name.trim(),
      party: (party ?? '').trim(),
      status,
      statusRaw: statusRaw.trim(),
      reason: reason?.trim() || null,
    });
  }

  return records;
}

/**
 * Get the most recent meeting date we have scraped attendance for.
 * Used for incremental scraping.
 */
async function getLastScrapedMeetingDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('plenary_meetings')
    .select('meeting_date')
    .order('meeting_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.warn('[WARN] Failed to get last scraped meeting date:', error.message);
  }

  return data?.meeting_date ?? null;
}

export interface FetchAttendanceOptions {
  /** If true, scrapes all meetings regardless of what's already in DB */
  fullResync?: boolean;
  /** Progress callback */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Fetch attendance data for meetings.
 * By default, only fetches new meetings (incremental scraping).
 *
 * @param options - Options for controlling scraping behavior
 */
export async function fetchAllAttendance(
  options: FetchAttendanceOptions = {}
): Promise<{
  meetings: PlenaryMeeting[];
  attendance: AttendanceRecord[];
  skipped: number;
}> {
  const { fullResync = false, onProgress } = options;

  const allMeetings = await fetchMeetingList();

  // Determine which meetings to scrape
  let meetingsToScrape: PlenaryMeeting[];
  let skipped = 0;

  if (fullResync) {
    console.log('[INFO] Full resync requested - will scrape all meetings');
    meetingsToScrape = allMeetings;
  } else {
    // Get the most recent meeting we've already scraped
    const lastScrapedDate = await getLastScrapedMeetingDate();

    if (lastScrapedDate) {
      // Filter to only meetings newer than what we've scraped
      meetingsToScrape = allMeetings.filter((m) => m.date > lastScrapedDate);
      skipped = allMeetings.length - meetingsToScrape.length;

      if (meetingsToScrape.length === 0) {
        console.log(`[INFO] No new meetings since ${lastScrapedDate} - nothing to scrape`);
        return { meetings: [], attendance: [], skipped };
      }

      console.log(
        `[INFO] Found ${meetingsToScrape.length} new meetings since ${lastScrapedDate} (skipping ${skipped} already scraped)`
      );
    } else {
      console.log('[INFO] No previous attendance data - will scrape all meetings');
      meetingsToScrape = allMeetings;
    }
  }

  const attendance: AttendanceRecord[] = [];

  for (let i = 0; i < meetingsToScrape.length; i++) {
    const meeting = meetingsToScrape[i];
    if (!meeting) continue;

    console.log(
      `[INFO] Fetching attendance for meeting ${i + 1}/${meetingsToScrape.length}: ${meeting.date} (BID=${meeting.bid})`
    );

    const records = await fetchMeetingAttendance(meeting);
    attendance.push(...records);

    if (onProgress) {
      onProgress(i + 1, meetingsToScrape.length);
    }

    // Be polite - add delay between requests
    if (i < meetingsToScrape.length - 1) {
      await sleep(POLITENESS_DELAY_MS);
    }
  }

  console.log(`[INFO] Total attendance records fetched: ${attendance.length}`);

  return { meetings: meetingsToScrape, attendance, skipped };
}

// CLI entry point
if (import.meta.main) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           ATTENDANCE SCRAPER - Parliament Data');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Check for --full flag to force full resync
  const fullResync = process.argv.includes('--full');
  if (fullResync) {
    console.log('⚠️  Full resync mode enabled\n');
  }

  try {
    const { meetings, attendance, skipped } = await fetchAllAttendance({
      fullResync,
      onProgress: (current, total) => {
        const pct = Math.round((current / total) * 100);
        console.log(`  Progress: ${current}/${total} (${pct}%)`);
      },
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                       SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Meetings scraped: ${meetings.length}`);
    console.log(`Meetings skipped (already in DB): ${skipped}`);
    console.log(`Attendance records: ${attendance.length}`);

    // Calculate stats
    const present = attendance.filter((r) => r.status === 'present').length;
    const absent = attendance.length - present;
    const rate = ((present / attendance.length) * 100).toFixed(1);

    console.log(`\nOverall attendance: ${present}/${attendance.length} (${rate}%)`);
    console.log(`Present: ${present}`);
    console.log(`Absent: ${absent}`);

    // Show sample records
    console.log('\nSample records:');
    for (const r of attendance.slice(0, 5)) {
      console.log(`  - ${r.deputyName} (${r.party}): ${r.statusRaw}`);
    }
  } catch (err) {
    console.error('[ERROR] Scraping failed:', err);
    process.exit(1);
  }
}

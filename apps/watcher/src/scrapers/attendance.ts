/**
 * Attendance Scraper
 *
 * Scrapes plenary meeting attendance from the Parliament website.
 * Data is available in static HTML - no browser automation needed.
 *
 * Meeting List: https://www.parlamento.pt/DeputadoGP/Paginas/reunioesplenarias.aspx
 * Meeting Detail: https://www.parlamento.pt/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID={id}
 */

import { type CheerioAPI, load } from 'cheerio';

import { POLITENESS_UA } from '../config.js';
import { supabase } from '../supabase.js';

const BASE_URL = 'https://www.parlamento.pt';
const MEETING_LIST_URL = `${BASE_URL}/DeputadoGP/Paginas/reunioesplenarias.aspx`;
const MEETING_DETAIL_URL = `${BASE_URL}/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx`;

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const POLITENESS_DELAY_MS = 500; // Delay between requests to be polite

/**
 * CSS selector for the row anchor: matches any `<a>` whose `id` ends with
 * `hplDeputado`. Parliament's ASP.NET webforms emit ids like
 * `ct00_hplDeputado` or `ctl00$contentPlaceHolder$...$hplDeputado` — the
 * `ct<NN>_` / `ctl00$...$` prefix is a per-row container id and varies.
 * Using an attribute-end selector keeps us from having to know the prefix.
 */
const DEPUTY_NAME_SELECTOR = 'a[id$="hplDeputado"]';

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

/** Raw fields extracted from a single deputy row before status classification. */
export interface RawAttendanceRow {
  deputyBid: number;
  deputyName: string;
  party: string;
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
export function parseStatus(
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
 * Extract the meeting-list portion of a `reunioesplenarias.aspx` HTML page.
 * Pure function — does no I/O — so it can be unit tested against fixtures.
 *
 * Each meeting is rendered as an anchor with href matching
 * `DetalheReuniaoPlenaria.aspx?BID=<n>` and the meeting date as its text.
 */
export function parseMeetingListHtml(html: string): PlenaryMeeting[] {
  const $ = load(html);
  const meetings: PlenaryMeeting[] = [];
  const seen = new Set<number>();

  $('a[href*="DetalheReuniaoPlenaria.aspx"]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    const bidMatch = href.match(/BID=(\d+)/);
    if (!bidMatch) return;

    const bid = Number.parseInt(bidMatch[1] ?? '', 10);
    if (!Number.isFinite(bid) || seen.has(bid)) return;

    const text = $(el).text().trim();
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return;

    seen.add(bid);
    meetings.push({ bid, date: dateMatch[1] ?? '' });
  });

  return meetings;
}

/**
 * Extract attendance rows from a `DetalheReuniaoPlenaria.aspx` HTML page.
 * Pure function — does no I/O — so it can be unit tested against fixtures.
 *
 * The page renders one row per deputy whose markup looks like (with a
 * per-row id prefix that varies, e.g. `ct00_` or `ctl00$...$ctl00$`):
 *
 *   <a id="ct00_hplDeputado" href="...Biografia.aspx?BID=7489">Deputy Name</a>
 *   <span id="ct00_lblGP">PSD</span>
 *   <span id="ct00_lblPresenca">Presença (P)</span>
 *   <span id="ct00_lblMotivo"></span>
 *
 * Crucially, all four elements in the same row share the same id prefix
 * (everything before `hplDeputado`). Rather than rely on DOM ancestry —
 * which breaks when the page adds wrapper divs or moves spans to sibling
 * containers — we anchor on the link's id, derive the prefix, and look
 * up the other fields by id-prefix match. This is what makes the parser
 * robust to the kind of layout refactors Parliament has historically
 * shipped (e.g. wrapping rows in `<article>`, splitting fields across
 * sibling `<div>`s, changing attribute order, etc.).
 */
export function parseMeetingAttendanceHtml(html: string): RawAttendanceRow[] {
  const $: CheerioAPI = load(html);
  const rows: RawAttendanceRow[] = [];

  $(DEPUTY_NAME_SELECTOR).each((_i, el) => {
    const $link = $(el);
    const linkId = $link.attr('id') ?? '';
    if (!linkId.endsWith('hplDeputado')) return;

    // Everything before "hplDeputado" is the row's id prefix
    const prefix = linkId.slice(0, -'hplDeputado'.length);
    if (!prefix) return;

    const name = $link.text().trim();
    const href = $link.attr('href') ?? '';
    const bidMatch = href.match(/BID=(\d+)/);
    if (!bidMatch) return;

    const deputyBid = Number.parseInt(bidMatch[1] ?? '', 10);
    if (!Number.isFinite(deputyBid) || !name) return;

    // Look up the matching spans by full id (prefix + suffix). This
    // explicitly avoids any DOM-tree assumption about where the spans
    // live relative to the link — they're just looked up by id.
    const party = $(`#${escapeIdSelector(prefix)}lblGP`)
      .first()
      .text()
      .trim();
    const statusRaw = $(`#${escapeIdSelector(prefix)}lblPresenca`)
      .first()
      .text()
      .trim();
    const reasonText = $(`#${escapeIdSelector(prefix)}lblMotivo`)
      .first()
      .text()
      .trim();

    // statusRaw is the only mandatory field for an attendance row
    if (!statusRaw) return;

    rows.push({
      deputyBid,
      deputyName: name,
      party,
      statusRaw,
      reason: reasonText || null,
    });
  });

  return rows;
}

/**
 * CSS id selectors may contain characters that have special meaning in CSS
 * (`.`, `:`, `$`, `&`, `*`, etc. — all of which appear in ASP.NET webform
 * ids like `ctl00$contentPlaceHolder$lblGP`). Escape those for use in a
 * `#<id>` selector.
 */
function escapeIdSelector(id: string): string {
  return id.replace(/([!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~])/g, '\\$1');
}

/**
 * Fetch list of all plenary meetings from the main page
 */
export async function fetchMeetingList(): Promise<PlenaryMeeting[]> {
  console.log('[INFO] Fetching plenary meeting list...');
  const html = await fetchWithRetry(MEETING_LIST_URL);

  const meetings = parseMeetingListHtml(html);

  console.log(`[INFO] Found ${meetings.length} plenary meetings`);
  return meetings;
}

/**
 * Fetch attendance for a single plenary meeting
 */
export async function fetchMeetingAttendance(meeting: PlenaryMeeting): Promise<AttendanceRecord[]> {
  const url = `${MEETING_DETAIL_URL}?BID=${meeting.bid}`;
  const html = await fetchWithRetry(url);

  const rawRows = parseMeetingAttendanceHtml(html);

  return rawRows.map((row) => ({
    meetingBid: meeting.bid,
    meetingDate: meeting.date,
    ...row,
    status: parseStatus(row.statusRaw),
  }));
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
export async function fetchAllAttendance(options: FetchAttendanceOptions = {}): Promise<{
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

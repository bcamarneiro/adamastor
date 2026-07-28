/**
 * Attendance Scraper Tests
 *
 * These tests mock the global fetch to avoid hitting the real Parliament website.
 * The supabase module is not used by the scraper functions being tested, but it
 * throws on import without env vars. Run with dummy env vars:
 *
 *   SUPABASE_URL=http://localhost SUPABASE_SERVICE_ROLE_KEY=test bun test attendance
 *
 * The pure parsers (`parseMeetingListHtml`, `parseMeetingAttendanceHtml`) are
 * tested directly against HTML fixtures — no I/O, no env vars needed.
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import {
  type RawAttendanceRow,
  fetchMeetingAttendance,
  fetchMeetingList,
  parseMeetingAttendanceHtml,
  parseMeetingListHtml,
  parseStatus,
} from './attendance.js';

// ---------------------------------------------------------------------------
// HTML Fixtures
// ---------------------------------------------------------------------------

/**
 * Normal meeting with 3 deputies: one present, one absent justified, one absent unjustified.
 * Mirrors the DOM structure the scraper expects (hplDeputado, lblGP, lblPresenca, lblMotivo).
 */
const HTML_NORMAL_MEETING = `
<html><body>
<div>
  <a id="ct00_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=7489">Maria Silva</a>
  <span id="ct00_lblGP">PSD</span>
  <span id="ct00_lblPresenca">Presença (P)</span>
  <span id="ct00_lblMotivo"></span>
</div>
<div>
  <a id="ct01_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=8123">João Santos</a>
  <span id="ct01_lblGP">PS</span>
  <span id="ct01_lblPresenca">Ausência justificada</span>
  <span id="ct01_lblMotivo">Missão oficial no estrangeiro</span>
</div>
<div>
  <a id="ct02_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=9456">Ana Costa</a>
  <span id="ct02_lblGP">CHEGA</span>
  <span id="ct02_lblPresenca">Ausência</span>
  <span id="ct02_lblMotivo"></span>
</div>
</body></html>`;

/**
 * Empty meeting page — no deputy blocks at all.
 */
const HTML_EMPTY_MEETING = `
<html><body>
<div class="meeting-header">
  <h1>Reunião Plenária</h1>
  <p>Sem registos de presença disponíveis.</p>
</div>
</body></html>`;

/**
 * Meeting with all status variants the parser recognises:
 * - Presença (P) → present
 * - Ausência por falta de quórum → absent_quorum
 * - Ausência justificada → absent_justified
 * - Missão oficial → absent_justified
 * - Substituição → absent_justified
 * - Ausência (bare) → absent_unjustified
 */
const HTML_ALL_STATUSES = `
<html><body>
<div>
  <a id="r0_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=1001">Dep Present</a>
  <span id="r0_lblGP">PSD</span>
  <span id="r0_lblPresenca">Presença (P)</span>
  <span id="r0_lblMotivo"></span>
</div>
<div>
  <a id="r1_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=1002">Dep Quorum</a>
  <span id="r1_lblGP">PS</span>
  <span id="r1_lblPresenca">Ausência por falta de quórum</span>
  <span id="r1_lblMotivo"></span>
</div>
<div>
  <a id="r2_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=1003">Dep Justified</a>
  <span id="r2_lblGP">IL</span>
  <span id="r2_lblPresenca">Ausência justificada</span>
  <span id="r2_lblMotivo">Doença</span>
</div>
<div>
  <a id="r3_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=1004">Dep Mission</a>
  <span id="r3_lblGP">BE</span>
  <span id="r3_lblPresenca">Missão oficial</span>
  <span id="r3_lblMotivo">Bruxelas</span>
</div>
<div>
  <a id="r4_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=1005">Dep Subst</a>
  <span id="r4_lblGP">PCP</span>
  <span id="r4_lblPresenca">Substituição</span>
  <span id="r4_lblMotivo">Substituição de deputado</span>
</div>
<div>
  <a id="r5_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=1006">Dep Unjust</a>
  <span id="r5_lblGP">PAN</span>
  <span id="r5_lblPresenca">Ausência</span>
  <span id="r5_lblMotivo"></span>
</div>
</body></html>`;

/**
 * Meeting list page with 3 meetings.
 */
const HTML_MEETING_LIST = `
<html><body>
<table>
  <tr>
    <td><a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=335330">2025-12-18</a></td>
  </tr>
  <tr>
    <td><a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=335200">2025-12-10</a></td>
  </tr>
  <tr>
    <td><a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=335100">2025-11-28</a></td>
  </tr>
</table>
</body></html>`;

/**
 * Meeting list page with no meetings.
 */
const HTML_EMPTY_MEETING_LIST = `
<html><body>
<table>
  <tr><td>Sem reuniões plenárias agendadas.</td></tr>
</table>
</body></html>`;

/**
 * Realistic fixture that the OLD regex would have struggled with:
 * - Different id prefix style (`ctl00$...$ctl00$` with `$` separators)
 * - Attributes in a different order
 * - Extra wrapping <article> and <div> around each deputy
 * - Whitespace and newlines between elements
 * - `&amp;` HTML-entity in the href
 *
 * A real Parliament page change would look like this. Crucially, all four
 * row elements share the SAME id prefix — which is what the Cheerio-based
 * parser keys on.
 */
const HTML_REALISTIC_DETAIL = `
<!DOCTYPE html>
<html lang="pt">
<head><title>Reunião Plenária</title></head>
<body>
  <main>
    <section class="attendance-list">
      <article class="row">
        <div class="deputy-info">
          <a
            href='/DeputadoGP/Paginas/Biografia.aspx?BID=2001&amp;leg=17'
            id='ctl00$contentPlaceHolder$repDeputados$ctl00$hplDeputado'
          >
            António Pereira
          </a>
        </div>
        <div class="attendance-data">
          <span id="ctl00$contentPlaceHolder$repDeputados$ctl00$lblGP">PSD</span>
          <span id="ctl00$contentPlaceHolder$repDeputados$ctl00$lblPresenca">Presença (P)</span>
          <span id="ctl00$contentPlaceHolder$repDeputados$ctl00$lblMotivo"></span>
        </div>
      </article>
      <article class="row">
        <div class="deputy-info">
          <a
            href='/DeputadoGP/Paginas/Biografia.aspx?BID=2002'
            id='ctl00$contentPlaceHolder$repDeputados$ctl01$hplDeputado'
          >
            Catarina Mendes
          </a>
        </div>
        <div class="attendance-data">
          <span id="ctl00$contentPlaceHolder$repDeputados$ctl01$lblGP">PS</span>
          <span id="ctl00$contentPlaceHolder$repDeputados$ctl01$lblPresenca">Ausência por falta de quórum</span>
          <span id="ctl00$contentPlaceHolder$repDeputados$ctl01$lblMotivo"></span>
        </div>
      </article>
    </section>
  </main>
</body>
</html>`;

/**
 * Meeting list with nested anchors and surrounding markup (more realistic).
 */
const HTML_REALISTIC_LIST = `
<html><body>
<h1>Reuniões Plenárias</h1>
<table class="meetings">
  <tr><th>Data</th><th>Sessão</th></tr>
  <tr>
    <td>
      <span class="day">Qua</span>
      <a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=400001">2026-01-15</a>
    </td>
    <td>Legislativa</td>
  </tr>
  <tr>
    <td>
      <span class="day">Qui</span>
      <a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=400002">2026-01-16</a>
    </td>
    <td>Legislativa</td>
  </tr>
</table>
</body></html>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchResponse(html: string) {
  return mock(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(html),
    })
  ) as unknown as typeof fetch;
}

// ---------------------------------------------------------------------------
// Tests: parseStatus() — pure function, no I/O
// ---------------------------------------------------------------------------

describe('parseStatus', () => {
  it('should return "present" for "Presença (P)"', () => {
    expect(parseStatus('Presença (P)')).toBe('present');
  });

  it('should return "present" for text containing "presença" (case-insensitive)', () => {
    expect(parseStatus('PRESENÇA')).toBe('present');
    expect(parseStatus('  presença  ')).toBe('present');
  });

  it('should return "absent_quorum" for text containing "quórum"', () => {
    expect(parseStatus('Ausência por falta de quórum')).toBe('absent_quorum');
    expect(parseStatus('Falta de Quórum')).toBe('absent_quorum');
  });

  it('should return "absent_justified" for text containing "justificada"', () => {
    expect(parseStatus('Ausência justificada')).toBe('absent_justified');
  });

  it('should return "absent_justified" for text containing "missão oficial"', () => {
    expect(parseStatus('Missão oficial no estrangeiro')).toBe('absent_justified');
  });

  it('should return "absent_justified" for text containing "substituição"', () => {
    expect(parseStatus('Substituição de deputado')).toBe('absent_justified');
  });

  it('should return "absent_unjustified" for bare "Ausência"', () => {
    expect(parseStatus('Ausência')).toBe('absent_unjustified');
  });

  it('should return "absent_unjustified" for unrecognized text', () => {
    expect(parseStatus('Something unknown')).toBe('absent_unjustified');
  });

  it('should return "absent_unjustified" for empty string', () => {
    expect(parseStatus('')).toBe('absent_unjustified');
  });

  it('should handle whitespace-padded input', () => {
    expect(parseStatus('  Presença (P)  ')).toBe('present');
    expect(parseStatus('  Ausência justificada  ')).toBe('absent_justified');
  });
});

// ---------------------------------------------------------------------------
// Tests: parseMeetingAttendanceHtml() — pure function, no I/O
// ---------------------------------------------------------------------------

describe('parseMeetingAttendanceHtml', () => {
  it('should parse a normal meeting with mixed statuses', () => {
    const rows = parseMeetingAttendanceHtml(HTML_NORMAL_MEETING);

    expect(rows).toHaveLength(3);

    expect(rows[0]).toEqual<RawAttendanceRow>({
      deputyBid: 7489,
      deputyName: 'Maria Silva',
      party: 'PSD',
      statusRaw: 'Presença (P)',
      reason: null,
    });

    expect(rows[1]).toEqual<RawAttendanceRow>({
      deputyBid: 8123,
      deputyName: 'João Santos',
      party: 'PS',
      statusRaw: 'Ausência justificada',
      reason: 'Missão oficial no estrangeiro',
    });

    expect(rows[2]).toEqual<RawAttendanceRow>({
      deputyBid: 9456,
      deputyName: 'Ana Costa',
      party: 'CHEGA',
      statusRaw: 'Ausência',
      reason: null,
    });
  });

  it('should return empty array for an empty meeting page', () => {
    expect(parseMeetingAttendanceHtml(HTML_EMPTY_MEETING)).toEqual([]);
  });

  it('should correctly classify all known status variants', () => {
    const rows = parseMeetingAttendanceHtml(HTML_ALL_STATUSES);
    expect(rows).toHaveLength(6);

    const statuses = rows.map((r) => r.statusRaw);
    expect(statuses).toEqual([
      'Presença (P)',
      'Ausência por falta de quórum',
      'Ausência justificada',
      'Missão oficial',
      'Substituição',
      'Ausência',
    ]);
  });

  it('should preserve the reason field when present and null when empty', () => {
    const rows = parseMeetingAttendanceHtml(HTML_ALL_STATUSES);

    const justified = rows.find((r) => r.deputyBid === 1003);
    expect(justified?.reason).toBe('Doença');

    const quorum = rows.find((r) => r.deputyBid === 1002);
    expect(quorum?.reason).toBeNull();
  });

  it('should handle a realistic page with non-standard id prefix and nested wrappers', () => {
    // The old regex would have failed on this because it relied on
    // "hplDeputado" being a contiguous substring of the id, and on the four
    // elements being adjacent siblings. Cheerio + closest() is robust to both.
    const rows = parseMeetingAttendanceHtml(HTML_REALISTIC_DETAIL);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.deputyBid).toBe(2001);
    expect(rows[0]?.deputyName.trim()).toBe('António Pereira');
    expect(rows[0]?.party).toBe('PSD');
    expect(rows[0]?.statusRaw).toBe('Presença (P)');
    expect(rows[1]?.deputyBid).toBe(2002);
    expect(rows[1]?.deputyName.trim()).toBe('Catarina Mendes');
    expect(rows[1]?.party).toBe('PS');
    expect(rows[1]?.statusRaw).toBe('Ausência por falta de quórum');
  });

  it('should skip rows with no status (e.g. decorative anchors)', () => {
    const html = `
      <html><body>
        <div>
          <a id="ghost_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=9999">Ghost</a>
          <span id="ghost_lblGP"></span>
          <span id="ghost_lblPresenca"></span>
          <span id="ghost_lblMotivo"></span>
        </div>
        <div>
          <a id="real_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=8888">Real</a>
          <span id="real_lblGP">PSD</span>
          <span id="real_lblPresenca">Presença (P)</span>
          <span id="real_lblMotivo"></span>
        </div>
      </body></html>`;
    const rows = parseMeetingAttendanceHtml(html);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.deputyBid).toBe(8888);
  });

  it('should ignore anchors without a BID in the href', () => {
    const html = `
      <html><body>
        <a id="nohpl_hplDeputado" href="/somewhere/else">No Bid</a>
      </body></html>`;
    expect(parseMeetingAttendanceHtml(html)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: parseMeetingListHtml() — pure function, no I/O
// ---------------------------------------------------------------------------

describe('parseMeetingListHtml', () => {
  it('should parse a meeting list with 3 meetings', () => {
    const meetings = parseMeetingListHtml(HTML_MEETING_LIST);

    expect(meetings).toEqual([
      { bid: 335330, date: '2025-12-18' },
      { bid: 335200, date: '2025-12-10' },
      { bid: 335100, date: '2025-11-28' },
    ]);
  });

  it('should return empty array when no meetings found', () => {
    expect(parseMeetingListHtml(HTML_EMPTY_MEETING_LIST)).toEqual([]);
  });

  it('should extract meetings from a realistic page with extra surrounding markup', () => {
    const meetings = parseMeetingListHtml(HTML_REALISTIC_LIST);
    expect(meetings).toEqual([
      { bid: 400001, date: '2026-01-15' },
      { bid: 400002, date: '2026-01-16' },
    ]);
  });

  it('should deduplicate by BID when the same meeting is listed twice', () => {
    const html = `
      <html><body>
        <a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=500">2026-02-01</a>
        <a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=500">2026-02-01</a>
        <a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=501">2026-02-02</a>
      </body></html>`;
    const meetings = parseMeetingListHtml(html);
    expect(meetings).toHaveLength(2);
    expect(meetings.map((m) => m.bid)).toEqual([500, 501]);
  });

  it('should skip anchors whose text has no date', () => {
    const html = `
      <html><body>
        <a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=600">Reunião</a>
        <a href="/DeputadoGP/Paginas/DetalheReuniaoPlenaria.aspx?BID=601">2026-03-03</a>
      </body></html>`;
    const meetings = parseMeetingListHtml(html);
    expect(meetings).toEqual([{ bid: 601, date: '2026-03-03' }]);
  });
});

// ---------------------------------------------------------------------------
// Tests: fetchMeetingAttendance() — I/O wrapper, fetch is mocked
// ---------------------------------------------------------------------------

describe('fetchMeetingAttendance', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should parse a normal meeting with mixed statuses', async () => {
    globalThis.fetch = mockFetchResponse(HTML_NORMAL_MEETING) as typeof fetch;

    const records = await fetchMeetingAttendance({ bid: 335330, date: '2025-12-18' });

    expect(records).toHaveLength(3);

    expect(records[0]).toMatchObject({
      meetingBid: 335330,
      meetingDate: '2025-12-18',
      deputyBid: 7489,
      deputyName: 'Maria Silva',
      party: 'PSD',
      status: 'present',
      statusRaw: 'Presença (P)',
      reason: null,
    });

    expect(records[1]).toMatchObject({
      deputyBid: 8123,
      deputyName: 'João Santos',
      party: 'PS',
      status: 'absent_justified',
      reason: 'Missão oficial no estrangeiro',
    });

    expect(records[2]).toMatchObject({
      deputyBid: 9456,
      deputyName: 'Ana Costa',
      party: 'CHEGA',
      status: 'absent_unjustified',
      reason: null,
    });
  });

  it('should return empty array for an empty meeting page', async () => {
    globalThis.fetch = mockFetchResponse(HTML_EMPTY_MEETING) as typeof fetch;

    const records = await fetchMeetingAttendance({ bid: 999999, date: '2025-01-01' });

    expect(records).toHaveLength(0);
  });

  it('should correctly classify all known status variants', async () => {
    globalThis.fetch = mockFetchResponse(HTML_ALL_STATUSES) as typeof fetch;

    const records = await fetchMeetingAttendance({ bid: 100000, date: '2025-06-15' });

    expect(records).toHaveLength(6);

    const statuses = records.map((r) => r.status);
    expect(statuses).toEqual([
      'present',
      'absent_quorum',
      'absent_justified',
      'absent_justified',
      'absent_justified',
      'absent_unjustified',
    ]);
  });

  it('should preserve the reason field when present and null when empty', async () => {
    globalThis.fetch = mockFetchResponse(HTML_ALL_STATUSES) as typeof fetch;

    const records = await fetchMeetingAttendance({ bid: 100000, date: '2025-06-15' });

    const justified = records.find((r) => r.deputyBid === 1003);
    expect(justified?.reason).toBe('Doença');

    const quorum = records.find((r) => r.deputyBid === 1002);
    expect(quorum?.reason).toBeNull();
  });

  it('should propagate fetch errors', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
    ) as unknown as typeof fetch;

    await expect(fetchMeetingAttendance({ bid: 999999, date: '2025-01-01' })).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: fetchMeetingList() — I/O wrapper, fetch is mocked
// ---------------------------------------------------------------------------

describe('fetchMeetingList', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should parse meeting list with 3 meetings', async () => {
    globalThis.fetch = mockFetchResponse(HTML_MEETING_LIST) as typeof fetch;

    const meetings = await fetchMeetingList();

    expect(meetings).toHaveLength(3);
    expect(meetings[0]).toEqual({ bid: 335330, date: '2025-12-18' });
    expect(meetings[1]).toEqual({ bid: 335200, date: '2025-12-10' });
    expect(meetings[2]).toEqual({ bid: 335100, date: '2025-11-28' });
  });

  it('should return empty array when no meetings found', async () => {
    globalThis.fetch = mockFetchResponse(HTML_EMPTY_MEETING_LIST) as typeof fetch;

    const meetings = await fetchMeetingList();

    expect(meetings).toHaveLength(0);
  });
});

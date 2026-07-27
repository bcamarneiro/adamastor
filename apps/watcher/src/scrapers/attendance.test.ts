/**
 * Attendance Scraper Tests
 *
 * These tests mock the global fetch to avoid hitting the real Parliament website.
 * The supabase module is not used by the scraper functions being tested, but it
 * throws on import without env vars. Run with dummy env vars:
 *
 *   SUPABASE_URL=http://localhost SUPABASE_SERVICE_ROLE_KEY=test bun test attendance
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import { fetchMeetingAttendance, fetchMeetingList, parseStatus } from './attendance.js';

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
// Tests: parseStatus()
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
// Tests: fetchMeetingAttendance()
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

    // First deputy: present
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

    // Second deputy: absent justified with reason
    expect(records[1]).toMatchObject({
      deputyBid: 8123,
      deputyName: 'João Santos',
      party: 'PS',
      status: 'absent_justified',
      reason: 'Missão oficial no estrangeiro',
    });

    // Third deputy: absent unjustified
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

    // Deputy with reason
    const justified = records.find((r) => r.deputyBid === 1003);
    expect(justified?.reason).toBe('Doença');

    // Deputy without reason
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
// Tests: fetchMeetingList()
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

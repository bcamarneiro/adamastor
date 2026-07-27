import { describe, expect, it } from 'bun:test';

import { parseAttendanceHtml, parseStatus } from './attendance.js';
import type { PlenaryMeeting } from './attendance.js';

describe('parseStatus', () => {
  it('should return "present" for "Presença (P)"', () => {
    expect(parseStatus('Presença (P)')).toBe('present');
  });

  it('should return "present" for "(P)" shorthand', () => {
    expect(parseStatus('(P)')).toBe('present');
  });

  it('should return "present" for lowercase "presença"', () => {
    expect(parseStatus('presença')).toBe('present');
  });

  it('should return "present" with extra whitespace', () => {
    expect(parseStatus('  Presença (P)  ')).toBe('present');
  });

  it('should return "absent_quorum" for "Ausência por Quórum"', () => {
    expect(parseStatus('Ausência por Quórum')).toBe('absent_quorum');
  });

  it('should return "absent_quorum" for lowercase "quórum"', () => {
    expect(parseStatus('quórum')).toBe('absent_quorum');
  });

  it('should return "absent_justified" for "Ausência justificada"', () => {
    expect(parseStatus('Ausência justificada')).toBe('absent_justified');
  });

  it('should return "absent_justified" for "Missão oficial"', () => {
    expect(parseStatus('Missão oficial')).toBe('absent_justified');
  });

  it('should return "absent_justified" for "Substituição"', () => {
    expect(parseStatus('Substituição')).toBe('absent_justified');
  });

  it('should return "absent_justified" for lowercase "justificada"', () => {
    expect(parseStatus('justificada')).toBe('absent_justified');
  });

  it('should return "absent_unjustified" for empty string', () => {
    expect(parseStatus('')).toBe('absent_unjustified');
  });

  it('should return "absent_unjustified" for unknown status', () => {
    expect(parseStatus('Alguma outra coisa')).toBe('absent_unjustified');
  });

  it('should return "absent_unjustified" for "Ausência" without qualifier', () => {
    expect(parseStatus('Ausência')).toBe('absent_unjustified');
  });
});

describe('parseAttendanceHtml', () => {
  const meeting: PlenaryMeeting = { bid: 335330, date: '2025-12-18' };

  it('should parse a normal meeting with multiple deputies', () => {
    const html = `
      <html>
      <body>
        <div>
          <a id="ctl00_ctl43_g_abc123_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=7489">Maria Silva</a>
          <span id="ctl00_ctl43_g_abc123_lblGP">PS</span>
          <span id="ctl00_ctl43_g_abc123_lblPresenca">Presença (P)</span>
          <span id="ctl00_ctl43_g_abc123_lblMotivo"></span>
        </div>
        <div>
          <a id="ctl00_ctl43_g_def456_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=8123">João Santos</a>
          <span id="ctl00_ctl43_g_def456_lblGP">PSD</span>
          <span id="ctl00_ctl43_g_def456_lblPresenca">Ausência por Quórum</span>
          <span id="ctl00_ctl43_g_def456_lblMotivo"></span>
        </div>
        <div>
          <a id="ctl00_ctl43_g_ghi789_hplDeputado" href="/DeputadoGP/Paginas/Biografia.aspx?BID=9456">Ana Costa</a>
          <span id="ctl00_ctl43_g_ghi789_lblGP">BE</span>
          <span id="ctl00_ctl43_g_ghi789_lblPresenca">Ausência justificada</span>
          <span id="ctl00_ctl43_g_ghi789_lblMotivo">Doença</span>
        </div>
      </body>
      </html>
    `;

    const records = parseAttendanceHtml(html, meeting);

    expect(records).toHaveLength(3);

    expect(records[0]).toEqual({
      meetingBid: 335330,
      meetingDate: '2025-12-18',
      deputyBid: 7489,
      deputyName: 'Maria Silva',
      party: 'PS',
      status: 'present',
      statusRaw: 'Presença (P)',
      reason: null,
    });

    expect(records[1]).toEqual({
      meetingBid: 335330,
      meetingDate: '2025-12-18',
      deputyBid: 8123,
      deputyName: 'João Santos',
      party: 'PSD',
      status: 'absent_quorum',
      statusRaw: 'Ausência por Quórum',
      reason: null,
    });

    expect(records[2]).toEqual({
      meetingBid: 335330,
      meetingDate: '2025-12-18',
      deputyBid: 9456,
      deputyName: 'Ana Costa',
      party: 'BE',
      status: 'absent_justified',
      statusRaw: 'Ausência justificada',
      reason: 'Doença',
    });
  });

  it('should return empty array for empty meeting HTML', () => {
    const html = `
      <html>
      <body>
        <div>
          <p>Não há dados de presença para esta reunião.</p>
        </div>
      </body>
      </html>
    `;

    const records = parseAttendanceHtml(html, meeting);
    expect(records).toHaveLength(0);
  });

  it('should handle meeting with all absence types', () => {
    const html = `
      <html>
      <body>
        <div>
          <a id="x_hplDeputado" href="/Biografia.aspx?BID=100">Dep A</a>
          <span id="x_lblGP">PS</span>
          <span id="x_lblPresenca">Ausência justificada</span>
          <span id="x_lblMotivo">Missão oficial</span>
        </div>
        <div>
          <a id="y_hplDeputado" href="/Biografia.aspx?BID=200">Dep B</a>
          <span id="y_lblGP">PSD</span>
          <span id="y_lblPresenca">Ausência justificada</span>
          <span id="y_lblMotivo">Substituição</span>
        </div>
        <div>
          <a id="z_hplDeputado" href="/Biografia.aspx?BID=300">Dep C</a>
          <span id="z_lblGP">CH</span>
          <span id="z_lblPresenca">Falta</span>
          <span id="z_lblMotivo"></span>
        </div>
      </body>
      </html>
    `;

    const records = parseAttendanceHtml(html, meeting);

    expect(records).toHaveLength(3);
    expect(records[0]!.status).toBe('absent_justified');
    expect(records[0]!.reason).toBe('Missão oficial');
    expect(records[1]!.status).toBe('absent_justified');
    expect(records[1]!.reason).toBe('Substituição');
    expect(records[2]!.status).toBe('absent_unjustified');
    expect(records[2]!.reason).toBe(null);
  });

  it('should preserve meeting bid and date in all records', () => {
    const customMeeting: PlenaryMeeting = { bid: 999, date: '2024-01-15' };
    const html = `
      <html>
      <body>
        <div>
          <a id="x_hplDeputado" href="/Biografia.aspx?BID=50">Test Deputy</a>
          <span id="x_lblGP">IL</span>
          <span id="x_lblPresenca">Presença (P)</span>
          <span id="x_lblMotivo"></span>
        </div>
      </body>
      </html>
    `;

    const records = parseAttendanceHtml(html, customMeeting);

    expect(records).toHaveLength(1);
    expect(records[0]!.meetingBid).toBe(999);
    expect(records[0]!.meetingDate).toBe('2024-01-15');
  });

  it('should trim whitespace from deputy names and parties', () => {
    const html = `
      <html>
      <body>
        <div>
          <a id="x_hplDeputado" href="/Biografia.aspx?BID=42">  Maria  </a>
          <span id="x_lblGP">  PS  </span>
          <span id="x_lblPresenca">Presença (P)</span>
          <span id="x_lblMotivo">  </span>
        </div>
      </body>
      </html>
    `;

    const records = parseAttendanceHtml(html, meeting);

    expect(records).toHaveLength(1);
    expect(records[0]!.deputyName).toBe('Maria');
    expect(records[0]!.party).toBe('PS');
    expect(records[0]!.reason).toBe(null);
  });

  it('should handle HTML with no lblMotivo element gracefully', () => {
    // Edge case: malformed HTML where lblMotivo span is missing entirely
    const html = `
      <html>
      <body>
        <div>
          <a id="x_hplDeputado" href="/Biografia.aspx?BID=42">Test</a>
          <span id="x_lblGP">PS</span>
          <span id="x_lblPresenca">Presença (P)</span>
        </div>
      </body>
      </html>
    `;

    // The regex won't match if lblMotivo is missing, so no records
    const records = parseAttendanceHtml(html, meeting);
    expect(records).toHaveLength(0);
  });
});

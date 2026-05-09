import { describe, expect, it } from 'bun:test';
import { countInterventionsByParty, extractDeputyFromAuthor } from './activities-helpers.js';

describe('extractDeputyFromAuthor', () => {
  it('parses real-shape "Name (PARTY)" string including hyphenated parties', () => {
    expect(extractDeputyFromAuthor('Maria Silva (PS)')).toEqual({
      name: 'Maria Silva',
      party: 'PS',
    });
    expect(extractDeputyFromAuthor('João Pereira (CDS-PP)')).toEqual({
      name: 'João Pereira',
      party: 'CDS-PP',
    });
  });

  it('returns null for null, empty, or unparseable inputs', () => {
    expect(extractDeputyFromAuthor(null)).toBeNull();
    expect(extractDeputyFromAuthor('')).toBeNull();
    expect(extractDeputyFromAuthor('No party suffix')).toBeNull();
  });
});

describe('countInterventionsByParty', () => {
  it('attributes interventions to party authors and falls back to deputy parsing', () => {
    const counts = countInterventionsByParty({
      Debates: [
        // Party-authored debate: 3 interventions split across two parties.
        {
          DebateId: '1',
          Assunto: 'Debate A',
          AutoresGP: 'PS, CDS-PP',
          AutoresDeputados: null,
          DataDebate: '2024-01-01',
          Intervencoes: ['i1', 'i2', 'i3'],
          TipoDebateDesig: 'Plenário',
        },
        // Deputy-authored debate: 2 interventions attributed to PSD.
        {
          DebateId: '2',
          Assunto: 'Debate B',
          AutoresGP: null,
          AutoresDeputados: 'Ana Costa (PSD)',
          DataDebate: '2024-01-02',
          Intervencoes: ['i4', 'i5'],
          TipoDebateDesig: 'Plenário',
        },
        // Second PS debate to confirm accumulation.
        {
          DebateId: '3',
          Assunto: 'Debate C',
          AutoresGP: 'PS',
          AutoresDeputados: null,
          DataDebate: '2024-01-03',
          Intervencoes: ['i6'],
          TipoDebateDesig: 'Plenário',
        },
      ],
    });

    expect(counts.get('PS')).toBe(4); // 3 + 1
    expect(counts.get('CDS-PP')).toBe(3);
    expect(counts.get('PSD')).toBe(2);
  });

  it('handles missing/null authors and empty Debates without crashing', () => {
    expect(countInterventionsByParty({ Debates: [] }).size).toBe(0);

    const counts = countInterventionsByParty({
      Debates: [
        {
          DebateId: '1',
          Assunto: 'Orphan',
          AutoresGP: null,
          AutoresDeputados: null,
          DataDebate: '2024-01-01',
          Intervencoes: ['x', 'y'],
          TipoDebateDesig: 'Plenário',
        },
      ],
    });
    // No authorship -> nothing attributed.
    expect(counts.size).toBe(0);
  });
});

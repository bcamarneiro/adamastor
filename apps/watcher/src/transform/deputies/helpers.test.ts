import { describe, expect, it } from 'bun:test';
import {
  deduplicateDeputies,
  getCurrentParty,
  getMandateDates,
  getPhotoUrl,
  isActiveDeputy,
  parseLegislature,
} from './helpers.js';
import type { ParliamentDeputado } from './types.js';

// Helper to create a minimal deputy object for testing
function createDeputy(overrides: Partial<ParliamentDeputado> = {}): ParliamentDeputado {
  return {
    DepId: 1,
    DepCadId: 100,
    DepNomeCompleto: 'Test Deputy',
    DepNomeParlamentar: 'T. Deputy',
    DepCPId: 1,
    DepCPDes: 'Lisboa',
    DepGP: [],
    DepSituacao: [],
    DepCargo: null,
    LegDes: 'XVI',
    ...overrides,
  };
}

describe('parseLegislature', () => {
  it('should parse Roman numerals I-X correctly', () => {
    expect(parseLegislature('I')).toBe(1);
    expect(parseLegislature('V')).toBe(5);
    expect(parseLegislature('X')).toBe(10);
  });

  it('should parse Roman numerals XI-XX correctly', () => {
    expect(parseLegislature('XI')).toBe(11);
    expect(parseLegislature('XV')).toBe(15);
    expect(parseLegislature('XVI')).toBe(16);
    expect(parseLegislature('XVII')).toBe(17);
    expect(parseLegislature('XX')).toBe(20);
  });

  it('should return 17 for unknown legislature', () => {
    expect(parseLegislature('XXI')).toBe(17);
    expect(parseLegislature('')).toBe(17);
    expect(parseLegislature('invalid')).toBe(17);
  });
});

describe('getPhotoUrl', () => {
  it('should generate correct photo URL for a deputy ID', () => {
    const url = getPhotoUrl(12345);
    expect(url).toBe('https://app.parlamento.pt/webutils/getimage.aspx?id=12345&type=deputado');
  });

  it('should handle different deputy IDs', () => {
    expect(getPhotoUrl(1)).toContain('id=1');
    expect(getPhotoUrl(999999)).toContain('id=999999');
  });
});

describe('isActiveDeputy', () => {
  it('should return true for deputy with Efetivo status', () => {
    const dep = createDeputy({
      DepSituacao: [{ sioDes: 'Efetivo', sioDtInicio: '2024-01-01', sioDtFim: null }],
    });
    expect(isActiveDeputy(dep)).toBe(true);
  });

  it('should return true for deputy with efetivo in lowercase', () => {
    const dep = createDeputy({
      DepSituacao: [{ sioDes: 'efetivo', sioDtInicio: '2024-01-01', sioDtFim: null }],
    });
    expect(isActiveDeputy(dep)).toBe(true);
  });

  it('should return true for deputy with Efetivo in mixed case status', () => {
    const dep = createDeputy({
      DepSituacao: [{ sioDes: 'Deputado Efetivo', sioDtInicio: '2024-01-01', sioDtFim: null }],
    });
    expect(isActiveDeputy(dep)).toBe(true);
  });

  it('should return false for deputy without Efetivo status', () => {
    const dep = createDeputy({
      DepSituacao: [{ sioDes: 'Suspenso', sioDtInicio: '2024-01-01', sioDtFim: null }],
    });
    expect(isActiveDeputy(dep)).toBe(false);
  });

  it('should return false for deputy with empty situation array', () => {
    const dep = createDeputy({ DepSituacao: [] });
    expect(isActiveDeputy(dep)).toBe(false);
  });

  it('should return true if any status contains Efetivo', () => {
    const dep = createDeputy({
      DepSituacao: [
        { sioDes: 'Suspenso', sioDtInicio: '2023-01-01', sioDtFim: '2023-06-01' },
        { sioDes: 'Efetivo', sioDtInicio: '2023-06-02', sioDtFim: null },
      ],
    });
    expect(isActiveDeputy(dep)).toBe(true);
  });
});

describe('getCurrentParty', () => {
  it('should return current party when no end date', () => {
    const dep = createDeputy({
      DepGP: [{ gpId: 1, gpSigla: 'PS', gpDtInicio: '2024-01-01', gpDtFim: null }],
    });
    expect(getCurrentParty(dep)).toBe('PS');
  });

  it('should return party with future end date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dep = createDeputy({
      DepGP: [
        { gpId: 1, gpSigla: 'PSD', gpDtInicio: '2024-01-01', gpDtFim: futureDate.toISOString() },
      ],
    });
    expect(getCurrentParty(dep)).toBe('PSD');
  });

  it('should return first party if all have past end dates', () => {
    const dep = createDeputy({
      DepGP: [
        { gpId: 1, gpSigla: 'BE', gpDtInicio: '2020-01-01', gpDtFim: '2022-12-31' },
        { gpId: 2, gpSigla: 'L', gpDtInicio: '2023-01-01', gpDtFim: '2023-12-31' },
      ],
    });
    expect(getCurrentParty(dep)).toBe('BE');
  });

  it('should return null for deputy with no parties', () => {
    const dep = createDeputy({ DepGP: [] });
    expect(getCurrentParty(dep)).toBeNull();
  });
});

describe('getMandateDates', () => {
  it('should return earliest start and latest end dates', () => {
    const dep = createDeputy({
      DepSituacao: [
        { sioDes: 'Efetivo', sioDtInicio: '2020-01-01', sioDtFim: '2022-12-31' },
        { sioDes: 'Efetivo', sioDtInicio: '2023-01-01', sioDtFim: '2024-12-31' },
      ],
    });
    const { start, end } = getMandateDates(dep);
    expect(start).toBe('2020-01-01');
    expect(end).toBe('2024-12-31');
  });

  it('should return null end date when current mandate has no end', () => {
    const dep = createDeputy({
      DepSituacao: [{ sioDes: 'Efetivo', sioDtInicio: '2024-01-01', sioDtFim: null }],
    });
    const { start, end } = getMandateDates(dep);
    expect(start).toBe('2024-01-01');
    expect(end).toBeNull();
  });

  it('should return null dates for empty situation array', () => {
    const dep = createDeputy({ DepSituacao: [] });
    const { start, end } = getMandateDates(dep);
    expect(start).toBeNull();
    expect(end).toBeNull();
  });
});

describe('deduplicateDeputies', () => {
  it('should return unique deputies by DepId', () => {
    const deputies = [
      createDeputy({ DepId: 1 }),
      createDeputy({ DepId: 2 }),
      createDeputy({ DepId: 3 }),
    ];
    const result = deduplicateDeputies(deputies);
    expect(result.size).toBe(3);
  });

  it('should keep the deputy with the most recent mandate start date', () => {
    const deputies = [
      createDeputy({
        DepId: 1,
        DepNomeParlamentar: 'Old Record',
        DepSituacao: [{ sioDes: 'Efetivo', sioDtInicio: '2020-01-01', sioDtFim: null }],
      }),
      createDeputy({
        DepId: 1,
        DepNomeParlamentar: 'New Record',
        DepSituacao: [{ sioDes: 'Efetivo', sioDtInicio: '2024-01-01', sioDtFim: null }],
      }),
    ];
    const result = deduplicateDeputies(deputies);
    expect(result.size).toBe(1);
    expect(result.get(1)?.DepNomeParlamentar).toBe('New Record');
  });

  it('should keep first deputy if both have same dates', () => {
    const deputies = [
      createDeputy({
        DepId: 1,
        DepNomeParlamentar: 'First',
        DepSituacao: [{ sioDes: 'Efetivo', sioDtInicio: '2024-01-01', sioDtFim: null }],
      }),
      createDeputy({
        DepId: 1,
        DepNomeParlamentar: 'Second',
        DepSituacao: [{ sioDes: 'Efetivo', sioDtInicio: '2024-01-01', sioDtFim: null }],
      }),
    ];
    const result = deduplicateDeputies(deputies);
    expect(result.size).toBe(1);
    expect(result.get(1)?.DepNomeParlamentar).toBe('First');
  });

  it('should handle empty array', () => {
    const result = deduplicateDeputies([]);
    expect(result.size).toBe(0);
  });

  it('should keep first when new has no start date', () => {
    const deputies = [
      createDeputy({
        DepId: 1,
        DepNomeParlamentar: 'Has Date',
        DepSituacao: [{ sioDes: 'Efetivo', sioDtInicio: '2024-01-01', sioDtFim: null }],
      }),
      createDeputy({
        DepId: 1,
        DepNomeParlamentar: 'No Date',
        DepSituacao: [],
      }),
    ];
    const result = deduplicateDeputies(deputies);
    expect(result.get(1)?.DepNomeParlamentar).toBe('Has Date');
  });
});

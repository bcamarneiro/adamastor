import { describe, expect, it } from 'bun:test';
import { detectLegislatureFromData } from './legislature-detection.js';
import type { ParliamentInformacaoBase } from './types.js';

// Helper to create minimal informacao_base data
function createInfoBase(
  overrides: Partial<ParliamentInformacaoBase> = {}
): ParliamentInformacaoBase {
  return {
    Deputados: [],
    GruposParlamentares: [],
    CirculosEleitorais: [],
    DetalheLegislatura: {
      id: '17',
      sigla: 'XVII',
      siglaAntiga: 'XVI',
      dtini: '2025-06-01',
      dtfim: null,
    },
    ...overrides,
  };
}

describe('detectLegislatureFromData', () => {
  it('should detect legislature from DetalheLegislatura.sigla', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '17',
        sigla: 'XVII',
        siglaAntiga: 'XVI',
        dtini: '2025-06-01',
        dtfim: null,
      },
    });

    const result = detectLegislatureFromData(infoBase);

    expect(result.number).toBe(17);
    expect(result.roman).toBe('XVII');
    expect(result.source).toBe('DetalheLegislatura.sigla');
    expect(result.matchesConstant).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should detect different legislatures correctly', () => {
    const testCases = [
      { sigla: 'XVI', expected: 16 },
      { sigla: 'XVIII', expected: 18 },
      { sigla: 'XIX', expected: 19 },
      { sigla: 'XX', expected: 20 },
    ];

    for (const testCase of testCases) {
      const infoBase = createInfoBase({
        DetalheLegislatura: {
          id: String(testCase.expected),
          sigla: testCase.sigla,
          siglaAntiga: '',
          dtini: '2020-01-01',
          dtfim: null,
        },
      });

      const result = detectLegislatureFromData(infoBase);

      expect(result.number).toBe(testCase.expected);
      expect(result.roman).toBe(testCase.sigla);
      expect(result.source).toBe('DetalheLegislatura.sigla');
    }
  });

  it('should fallback to deputy LegDes if DetalheLegislatura missing', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '',
        sigla: '',
        siglaAntiga: '',
        dtini: '',
        dtfim: null,
      },
      Deputados: [
        {
          DepId: 1,
          DepCadId: 100,
          DepNomeCompleto: 'Test Deputy',
          DepNomeParlamentar: 'T. Deputy',
          DepCPId: 1,
          DepCPDes: 'Lisboa',
          DepGP: [],
          DepSituacao: [],
          DepCargo: null,
          LegDes: 'XVII',
          Videos: null,
        },
      ],
    });

    const result = detectLegislatureFromData(infoBase);

    expect(result.number).toBe(17);
    expect(result.roman).toBe('XVII');
    expect(result.source).toBe('Deputados[0].LegDes');
    expect(result.warnings.length).toBeGreaterThan(0); // Should warn about missing DetalheLegislatura
  });

  it('should fallback to constant if no data available', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '',
        sigla: '',
        siglaAntiga: '',
        dtini: '',
        dtfim: null,
      },
      Deputados: [],
    });

    const result = detectLegislatureFromData(infoBase);

    expect(result.number).toBe(17); // Falls back to constant
    expect(result.source).toBe('fallback (CURRENT_LEGISLATURE constant)');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should warn on mismatch with constant', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '16',
        sigla: 'XVI',
        siglaAntiga: 'XV',
        dtini: '2019-10-01',
        dtfim: null,
      },
    });

    const result = detectLegislatureFromData(infoBase);

    expect(result.number).toBe(16);
    expect(result.roman).toBe('XVI');
    expect(result.matchesConstant).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('mismatch'))).toBe(true);
  });

  it('should handle invalid Roman numerals gracefully', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '99',
        sigla: 'INVALID',
        siglaAntiga: '',
        dtini: '2020-01-01',
        dtfim: null,
      },
    });

    const result = detectLegislatureFromData(infoBase);

    // Should fallback to 17 (default in parseLegislature)
    expect(result.number).toBe(17);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('Failed to parse'))).toBe(true);
  });

  it('should handle whitespace in sigla', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '17',
        sigla: '  XVII  ',
        siglaAntiga: 'XVI',
        dtini: '2025-06-01',
        dtfim: null,
      },
    });

    const result = detectLegislatureFromData(infoBase);

    expect(result.number).toBe(17);
    expect(result.roman).toBe('XVII');
  });

  it('should validate against constant correctly', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '17',
        sigla: 'XVII',
        siglaAntiga: 'XVI',
        dtini: '2025-06-01',
        dtfim: null,
      },
    });

    const result = detectLegislatureFromData(infoBase);

    expect(result.matchesConstant).toBe(true);
    expect(result.warnings.filter((w) => w.includes('mismatch'))).toHaveLength(0);
  });
});

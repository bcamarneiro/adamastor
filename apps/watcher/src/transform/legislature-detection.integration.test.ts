import { describe, expect, it } from 'bun:test';
import { FEATURES } from '../config.js';
import { supabase } from '../supabase.js';
import {
  getCurrentLegislature,
  updateLegislatureFromDetection,
  validateLegislature,
} from '../services/legislature.js';
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

describe('Legislature Detection Integration', () => {
  // Skip if Supabase is not configured
  const hasSupabase =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  it.skipIf(!hasSupabase)(
    'should detect and store legislature in database',
    async () => {
      const infoBase = createInfoBase({
        DetalheLegislatura: {
          id: '17',
          sigla: 'XVII',
          siglaAntiga: 'XVI',
          dtini: '2025-06-01',
          dtfim: null,
        },
      });

      // Detect legislature
      const detected = detectLegislatureFromData(infoBase);
      expect(detected.number).toBe(17);
      expect(detected.roman).toBe('XVII');

      // Store in database
      const updateResult = await updateLegislatureFromDetection(detected);
      expect(updateResult.success).toBe(true);

      // Verify it was stored
      const stored = await getCurrentLegislature();
      expect(stored).toBe(17);
    }
  );

  it.skipIf(!hasSupabase)(
    'should update legislature when new one is detected',
    async () => {
      // First, set to XVII
      const infoBase1 = createInfoBase({
        DetalheLegislatura: {
          id: '17',
          sigla: 'XVII',
          siglaAntiga: 'XVI',
          dtini: '2025-06-01',
          dtfim: null,
        },
      });

      const detected1 = detectLegislatureFromData(infoBase1);
      await updateLegislatureFromDetection(detected1);

      // Then simulate new legislature (XVIII)
      const infoBase2 = createInfoBase({
        DetalheLegislatura: {
          id: '18',
          sigla: 'XVIII',
          siglaAntiga: 'XVII',
          dtini: '2030-06-01',
          dtfim: null,
        },
      });

      const detected2 = detectLegislatureFromData(infoBase2);
      await updateLegislatureFromDetection(detected2);

      // Verify it was updated
      const stored = await getCurrentLegislature();
      expect(stored).toBe(18);
    }
  );

  it.skipIf(!hasSupabase)(
    'should fallback to constant if database query fails',
    async () => {
      // This test verifies the fallback behavior
      // We can't easily simulate a database failure, but we can test
      // that getCurrentLegislature handles errors gracefully
      const result = await getCurrentLegislature();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    }
  );

  it('should validate legislature correctly', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '17',
        sigla: 'XVII',
        siglaAntiga: 'XVI',
        dtini: '2025-06-01',
        dtfim: null,
      },
    });

    const detected = detectLegislatureFromData(infoBase);
    const validation = validateLegislature(detected);

    expect(validation.isValid).toBe(true);
    expect(validation.warnings).toHaveLength(0);
  });

  it('should warn on validation mismatch', () => {
    const infoBase = createInfoBase({
      DetalheLegislatura: {
        id: '16',
        sigla: 'XVI',
        siglaAntiga: 'XV',
        dtini: '2019-10-01',
        dtfim: null,
      },
    });

    const detected = detectLegislatureFromData(infoBase);
    const validation = validateLegislature(detected);

    expect(validation.isValid).toBe(false);
    expect(validation.warnings.length).toBeGreaterThan(0);
    expect(validation.warnings.some((w) => w.includes('mismatch'))).toBe(true);
  });

  it('should handle feature flag correctly', () => {
    // Test that feature flag exists and is accessible
    expect(typeof FEATURES.legislatureAutoDetect).toBe('boolean');
    expect(typeof FEATURES.legislatureValidationWarnOnly).toBe('boolean');
  });
});


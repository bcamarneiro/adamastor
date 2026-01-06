import { describe, expect, it } from 'bun:test';
import { DISTRICT_POSTAL_PREFIXES } from './district-postal-prefixes.js';

describe('District Postal Prefixes', () => {
  it('should have Guarda postal codes 6300, 6305, 6320 only in Guarda district', () => {
    // Issue #109: These postal codes belong to Guarda, not Castelo Branco
    const guardaPostalCodes = ['6300', '6305', '6320'];

    // Should be in Guarda
    for (const code of guardaPostalCodes) {
      expect(DISTRICT_POSTAL_PREFIXES.Guarda).toContain(code);
    }

    // Should NOT be in Castelo Branco
    for (const code of guardaPostalCodes) {
      expect(DISTRICT_POSTAL_PREFIXES['Castelo Branco']).not.toContain(code);
    }
  });

  it('should have all districts with at least one postal prefix (except diaspora)', () => {
    const diasporaDistricts = ['Açores', 'Madeira', 'Europa', 'Fora da Europa'];

    for (const [district, codes] of Object.entries(DISTRICT_POSTAL_PREFIXES)) {
      if (diasporaDistricts.includes(district)) {
        // Diaspora districts may have empty arrays
        continue;
      }
      expect(codes.length).toBeGreaterThan(0);
    }
  });

  it('should not have overlapping postal codes between Guarda and Castelo Branco', () => {
    // Issue #109: Guarda and Castelo Branco should have distinct postal codes
    const guardaCodes = new Set(DISTRICT_POSTAL_PREFIXES.Guarda || []);
    const casteloBrancoCodes = new Set(DISTRICT_POSTAL_PREFIXES['Castelo Branco'] || []);

    const overlap = [...guardaCodes].filter((code) => casteloBrancoCodes.has(code));
    if (overlap.length > 0) {
      console.error('Overlap between Guarda and Castelo Branco:', overlap);
    }
    expect(overlap).toHaveLength(0);
  });

  it('should cover all major postal code ranges for mainland Portugal', () => {
    // Major city postal code prefixes that should be mapped
    const majorCodes: Record<string, string> = {
      '1000': 'Lisboa', // Lisboa city center
      '4000': 'Porto', // Porto city center
      '3000': 'Coimbra', // Coimbra
      '8000': 'Faro', // Faro
      '6300': 'Guarda', // Guarda city
      '6000': 'Castelo Branco', // Castelo Branco city
    };

    for (const [code, expectedDistrict] of Object.entries(majorCodes)) {
      const found = DISTRICT_POSTAL_PREFIXES[expectedDistrict]?.includes(code);
      expect(found).toBe(true);
    }
  });
});

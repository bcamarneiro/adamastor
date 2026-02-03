import { describe, expect, it } from 'bun:test';

import { DISTRICT_POSTAL_PREFIXES } from './district-data.js';

describe('District Postal Prefixes', () => {
  // Known ambiguous CP4 codes that intentionally appear in two district arrays.
  // These correspond to postal codes that span two districts geographically.
  const KNOWN_AMBIGUOUS_CP4 = new Set([
    '2100', // Santarém / Setúbal
    '2495', // Leiria / Santarém
    '2890', // Santarém / Setúbal
    '2965', // Setúbal / Évora
    '3020', // Aveiro / Coimbra
    '3640', // Guarda / Viseu
    '4615', // Braga / Porto
    '4620', // Braga / Porto
    '4815', // Braga / Porto
    '4905', // Braga / Viana do Castelo
    '5040', // Porto / Vila Real
    '6250', // Castelo Branco / Guarda
    '6320', // Castelo Branco / Guarda
  ]);

  it('should have no unexpected duplicate postal codes across districts', () => {
    const postalToDistricts = new Map<string, string[]>();

    // Build a map of postal code -> districts
    for (const [district, postalCodes] of Object.entries(DISTRICT_POSTAL_PREFIXES)) {
      for (const postal of postalCodes) {
        const existing = postalToDistricts.get(postal) || [];
        existing.push(district);
        postalToDistricts.set(postal, existing);
      }
    }

    // Find unexpected duplicates (excluding known ambiguous CP4s)
    const duplicates: { postal: string; districts: string[] }[] = [];
    for (const [postal, districts] of postalToDistricts.entries()) {
      if (districts.length > 1 && !KNOWN_AMBIGUOUS_CP4.has(postal)) {
        duplicates.push({ postal, districts });
      }
    }

    // If there are unexpected duplicates, fail with a descriptive message
    if (duplicates.length > 0) {
      const duplicateList = duplicates
        .map((d) => `  ${d.postal}: ${d.districts.join(', ')}`)
        .join('\n');
      throw new Error(
        `Found ${duplicates.length} unexpected postal codes mapped to multiple districts:\n${duplicateList}`
      );
    }

    expect(duplicates).toHaveLength(0);
  });

  it('should have all known ambiguous CP4 codes in exactly two districts', () => {
    const postalToDistricts = new Map<string, string[]>();

    for (const [district, postalCodes] of Object.entries(DISTRICT_POSTAL_PREFIXES)) {
      for (const postal of postalCodes) {
        const existing = postalToDistricts.get(postal) || [];
        existing.push(district);
        postalToDistricts.set(postal, existing);
      }
    }

    for (const cp4 of KNOWN_AMBIGUOUS_CP4) {
      const districts = postalToDistricts.get(cp4) || [];
      expect(districts.length).toBe(2);
    }
  });

  it('should have Guarda postal codes 6300, 6305 only in Guarda; 6320 in both (ambiguous)', () => {
    const guardaPostals = DISTRICT_POSTAL_PREFIXES.Guarda || [];
    const casteloPostals = DISTRICT_POSTAL_PREFIXES['Castelo Branco'] || [];

    // 6300, 6305 should be in Guarda only
    expect(guardaPostals).toContain('6300');
    expect(guardaPostals).toContain('6305');
    expect(casteloPostals).not.toContain('6300');
    expect(casteloPostals).not.toContain('6305');

    // 6320 is ambiguous — should be in both
    expect(guardaPostals).toContain('6320');
    expect(casteloPostals).toContain('6320');
  });

  it('should have all districts with at least one postal prefix (except diaspora)', () => {
    const diasporaDistricts = ['Açores', 'Madeira', 'Europa', 'Fora da Europa'];

    for (const [district, postalCodes] of Object.entries(DISTRICT_POSTAL_PREFIXES)) {
      if (!diasporaDistricts.includes(district)) {
        expect(postalCodes.length).toBeGreaterThan(0);
      }
    }
  });

  it('should not have overlapping postal codes between neighboring districts (except ambiguous)', () => {
    // Specific checks for known conflict areas (excluding ambiguous CP4s)
    const checks = [
      // Guarda vs Castelo Branco (6300 series) — 6320 is ambiguous, skip it
      { code: '6300', shouldBe: 'Guarda', shouldNotBe: 'Castelo Branco' },
      { code: '6305', shouldBe: 'Guarda', shouldNotBe: 'Castelo Branco' },
      // Viseu vs Guarda (3550-3690 series)
      { code: '3550', shouldBe: 'Viseu', shouldNotBe: 'Guarda' },
      { code: '3610', shouldBe: 'Viseu', shouldNotBe: 'Guarda' },
      // Setúbal vs Lisboa (2840 series)
      { code: '2840', shouldBe: 'Setúbal', shouldNotBe: 'Lisboa' },
      // Vila Real vs Bragança (5000 series)
      { code: '5000', shouldBe: 'Vila Real', shouldNotBe: 'Bragança' },
      { code: '5400', shouldBe: 'Vila Real', shouldNotBe: 'Bragança' },
    ];

    for (const check of checks) {
      const shouldBePostals = DISTRICT_POSTAL_PREFIXES[check.shouldBe] || [];
      const shouldNotBePostals = DISTRICT_POSTAL_PREFIXES[check.shouldNotBe] || [];

      expect(shouldBePostals).toContain(check.code);
      expect(shouldNotBePostals).not.toContain(check.code);
    }
  });

  it('should cover all major postal code ranges for mainland Portugal', () => {
    // Verify that all 1xxx-8xxx prefixes are mapped to a district
    // (9xxx is islands - Açores/Madeira - intentionally empty in postal_prefixes)
    const allPrefixes = Object.values(DISTRICT_POSTAL_PREFIXES).flat();

    // Check major ranges have at least some coverage
    const ranges = ['1', '2', '3', '4', '5', '6', '7', '8'];
    for (const range of ranges) {
      const hasPrefix = allPrefixes.some((p) => p.startsWith(range));
      expect(hasPrefix).toBe(true);
    }
  });
});

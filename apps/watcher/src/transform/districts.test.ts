import { describe, expect, it } from 'bun:test';

import { DISTRICT_POSTAL_PREFIXES } from './district-data.js';

describe('District Postal Prefixes', () => {
  it('should have no duplicate postal codes across districts', () => {
    const postalToDistricts = new Map<string, string[]>();

    // Build a map of postal code -> districts
    for (const [district, postalCodes] of Object.entries(DISTRICT_POSTAL_PREFIXES)) {
      for (const postal of postalCodes) {
        const existing = postalToDistricts.get(postal) || [];
        existing.push(district);
        postalToDistricts.set(postal, existing);
      }
    }

    // Find duplicates
    const duplicates: { postal: string; districts: string[] }[] = [];
    for (const [postal, districts] of postalToDistricts.entries()) {
      if (districts.length > 1) {
        duplicates.push({ postal, districts });
      }
    }

    // If there are duplicates, fail with a descriptive message
    if (duplicates.length > 0) {
      const duplicateList = duplicates
        .map((d) => `  ${d.postal}: ${d.districts.join(', ')}`)
        .join('\n');
      throw new Error(
        `Found ${duplicates.length} postal codes mapped to multiple districts:\n${duplicateList}`
      );
    }

    expect(duplicates).toHaveLength(0);
  });

  it('should have Guarda postal codes 6300, 6305, 6320 only in Guarda district', () => {
    const guardaPostals = DISTRICT_POSTAL_PREFIXES.Guarda || [];
    const casteloPostals = DISTRICT_POSTAL_PREFIXES['Castelo Branco'] || [];

    // These should be in Guarda
    expect(guardaPostals).toContain('6300');
    expect(guardaPostals).toContain('6305');
    expect(guardaPostals).toContain('6320');

    // These should NOT be in Castelo Branco
    expect(casteloPostals).not.toContain('6300');
    expect(casteloPostals).not.toContain('6305');
    expect(casteloPostals).not.toContain('6320');
  });

  it('should have all districts with at least one postal prefix (except diaspora)', () => {
    const diasporaDistricts = ['Açores', 'Madeira', 'Europa', 'Fora da Europa'];

    for (const [district, postalCodes] of Object.entries(DISTRICT_POSTAL_PREFIXES)) {
      if (!diasporaDistricts.includes(district)) {
        expect(postalCodes.length).toBeGreaterThan(0);
      }
    }
  });

  it('should not have overlapping postal codes between neighboring districts', () => {
    // Specific checks for known conflict areas
    const checks = [
      // Guarda vs Castelo Branco (6300 series)
      { code: '6300', shouldBe: 'Guarda', shouldNotBe: 'Castelo Branco' },
      { code: '6305', shouldBe: 'Guarda', shouldNotBe: 'Castelo Branco' },
      { code: '6320', shouldBe: 'Guarda', shouldNotBe: 'Castelo Branco' },
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

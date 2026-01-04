import { describe, expect, it } from 'bun:test';

// Import the postal prefixes from districts.ts
// We need to read the file and extract the data since it's not exported
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Parse the DISTRICT_POSTAL_PREFIXES from districts.ts
function parseDistrictPostalPrefixes(): Record<string, string[]> {
  const filePath = join(import.meta.dir, 'districts.ts');
  const content = readFileSync(filePath, 'utf-8');

  // Find the DISTRICT_POSTAL_PREFIXES object
  const startMarker = 'const DISTRICT_POSTAL_PREFIXES: Record<string, string[]> = {';
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) {
    throw new Error('Could not find DISTRICT_POSTAL_PREFIXES in districts.ts');
  }

  // Find the matching closing brace
  let braceCount = 0;
  let endIndex = startIndex + startMarker.length;
  for (let i = startIndex + startMarker.length - 1; i < content.length; i++) {
    if (content[i] === '{') braceCount++;
    if (content[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  const objectString = content.substring(startIndex + startMarker.length - 1, endIndex);

  // Parse each district block - look for patterns like "DistrictName: [" or "'District Name': ["
  const result: Record<string, string[]> = {};

  // Match district entries: either unquoted identifiers or quoted strings followed by : [
  const lines = objectString.split('\n');
  let currentDistrict: string | null = null;
  let currentPostals: string[] = [];
  let inArray = false;

  for (const line of lines) {
    // Check for district name pattern: "Name: [" or "'Name': ["
    const districtMatch = line.match(/^\s*'([^']+)':\s*\[|^\s*([A-Za-zÀ-ÿ]+):\s*\[/);
    if (districtMatch) {
      // Save previous district if any
      if (currentDistrict) {
        result[currentDistrict] = currentPostals;
      }
      currentDistrict = districtMatch[1] ?? districtMatch[2] ?? null;
      currentPostals = [];
      inArray = true;
    }

    // Extract postal codes from current line
    if (inArray) {
      const postalMatches = line.matchAll(/'(\d{4})'/g);
      for (const m of postalMatches) {
        if (m[1]) {
          currentPostals.push(m[1]);
        }
      }
    }

    // Check for array end
    if (inArray && line.includes('],')) {
      inArray = false;
    }
  }

  // Save last district
  if (currentDistrict) {
    result[currentDistrict] = currentPostals;
  }

  return result;
}

describe('District Postal Prefixes', () => {
  const DISTRICT_POSTAL_PREFIXES = parseDistrictPostalPrefixes();

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
    const casteloPostals = DISTRICT_POSTAL_PREFIXES['Castelo Branco'] || []; // Needs bracket notation for space

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
});

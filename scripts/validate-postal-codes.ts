#!/usr/bin/env bun
/**
 * Validate postal code to district mappings against GeoNames data
 *
 * Usage: bun run scripts/validate-postal-codes.ts
 *
 * Downloads Portuguese postal code data from GeoNames and cross-references
 * with our DISTRICT_POSTAL_PREFIXES to find mismatches.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { DISTRICT_POSTAL_PREFIXES } from '../apps/watcher/src/transform/district-data.js';

// GeoNames uses Portuguese district names, map to our names
const GEONAMES_TO_OUR_DISTRICTS: Record<string, string> = {
  Aveiro: 'Aveiro',
  Beja: 'Beja',
  Braga: 'Braga',
  Bragança: 'Bragança',
  'Castelo Branco': 'Castelo Branco',
  Coimbra: 'Coimbra',
  Évora: 'Évora',
  Faro: 'Faro',
  Guarda: 'Guarda',
  Leiria: 'Leiria',
  Lisboa: 'Lisboa',
  Portalegre: 'Portalegre',
  Porto: 'Porto',
  Santarém: 'Santarém',
  Setúbal: 'Setúbal',
  'Viana do Castelo': 'Viana do Castelo',
  'Vila Real': 'Vila Real',
  Viseu: 'Viseu',
  // Islands - we don't map these
  'Região Autónoma dos Açores': 'Açores',
  'Região Autónoma da Madeira': 'Madeira',
};

interface PostalEntry {
  postalCode: string;
  prefix: string;
  district: string;
  placeName: string;
}

function parseGeoNames(data: string): PostalEntry[] {
  const entries: PostalEntry[] = [];
  const lines = data.trim().split('\n');

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 5) continue;

    const postalCode = parts[1]; // e.g., "3750-000"
    const district = parts[3]; // e.g., "Aveiro"
    const placeName = parts[2]; // Place name

    // Extract 4-digit prefix
    const prefix = postalCode.replace('-', '').substring(0, 4);

    entries.push({ postalCode, prefix, district, placeName });
  }

  return entries;
}

function buildPrefixToDistrictMap(): Map<string, string> {
  const map = new Map<string, string>();

  for (const [district, prefixes] of Object.entries(DISTRICT_POSTAL_PREFIXES)) {
    for (const prefix of prefixes) {
      map.set(prefix, district);
    }
  }

  return map;
}

function validatePostalCodes() {
  console.log('🔍 Validating postal codes against GeoNames...\n');

  // Download and parse GeoNames
  Bun.spawnSync([
    'curl',
    '-s',
    'http://download.geonames.org/export/zip/PT.zip',
    '-o',
    '/tmp/PT.zip',
  ]);
  execSync('unzip -o /tmp/PT.zip -d /tmp/geonames_pt 2>/dev/null || true');
  const rawData = readFileSync('/tmp/geonames_pt/PT.txt', 'utf-8');
  const geoEntries = parseGeoNames(rawData);

  console.log(`📊 GeoNames has ${geoEntries.length} postal code entries\n`);

  // Build our prefix -> district map
  const ourMap = buildPrefixToDistrictMap();
  console.log(`📊 Our data has ${ourMap.size} postal code prefixes\n`);

  // Group GeoNames entries by prefix to find the most common district per prefix
  const prefixStats = new Map<string, Map<string, number>>();

  for (const entry of geoEntries) {
    if (!prefixStats.has(entry.prefix)) {
      prefixStats.set(entry.prefix, new Map());
    }
    const districtCounts = prefixStats.get(entry.prefix) as Map<string, number>;
    const mappedDistrict = GEONAMES_TO_OUR_DISTRICTS[entry.district] || entry.district;
    districtCounts.set(mappedDistrict, (districtCounts.get(mappedDistrict) || 0) + 1);
  }

  // Find mismatches
  const mismatches: {
    prefix: string;
    ours: string | undefined;
    geonames: string;
    count: number;
  }[] = [];
  const missing: { prefix: string; geonames: string; count: number }[] = [];
  let matched = 0;

  for (const [prefix, districtCounts] of prefixStats.entries()) {
    // Find the most common district for this prefix in GeoNames
    let maxCount = 0;
    let dominantDistrict = '';
    for (const [district, count] of districtCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantDistrict = district;
      }
    }

    const ourDistrict = ourMap.get(prefix);

    if (!ourDistrict) {
      // Skip islands (9xxx) - we intentionally don't map them
      if (!prefix.startsWith('9')) {
        missing.push({ prefix, geonames: dominantDistrict, count: maxCount });
      }
    } else if (ourDistrict !== dominantDistrict) {
      mismatches.push({ prefix, ours: ourDistrict, geonames: dominantDistrict, count: maxCount });
    } else {
      matched++;
    }
  }

  // Report results
  console.log('='.repeat(60));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(60));

  console.log(`\n✅ Matched prefixes: ${matched}`);
  console.log(`❌ Mismatched prefixes: ${mismatches.length}`);
  console.log(`⚠️  Missing from our data (non-island): ${missing.length}`);

  if (mismatches.length > 0) {
    console.log('\n--- MISMATCHES ---');
    console.log('Prefix | Our District | GeoNames District | GeoNames Count');
    console.log('-'.repeat(60));
    const sortedMismatches = mismatches.toSorted((a, b) => a.prefix.localeCompare(b.prefix));
    for (const m of sortedMismatches) {
      console.log(
        `${m.prefix}   | ${(m.ours || 'N/A').padEnd(18)} | ${m.geonames.padEnd(18)} | ${m.count}`
      );
    }
  }

  if (missing.length > 0 && missing.length <= 50) {
    console.log('\n--- MISSING FROM OUR DATA ---');
    console.log('Prefix | GeoNames District | Count');
    console.log('-'.repeat(45));
    const sortedMissing = missing.toSorted((a, b) => a.prefix.localeCompare(b.prefix));
    for (const m of sortedMissing) {
      console.log(`${m.prefix}   | ${m.geonames.padEnd(18)} | ${m.count}`);
    }
  } else if (missing.length > 50) {
    console.log(`\n--- MISSING FROM OUR DATA (showing first 50 of ${missing.length}) ---`);
    console.log('Prefix | GeoNames District | Count');
    console.log('-'.repeat(45));
    const sortedMissing = missing.slice(0, 50).toSorted((a, b) => a.prefix.localeCompare(b.prefix));
    for (const m of sortedMissing) {
      console.log(`${m.prefix}   | ${m.geonames.padEnd(18)} | ${m.count}`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  if (mismatches.length === 0) {
    console.log('✅ All postal prefixes match GeoNames data!');
  } else {
    console.log(`⚠️  Found ${mismatches.length} mismatches to investigate`);
  }

  return { matched, mismatches, missing };
}

validatePostalCodes();

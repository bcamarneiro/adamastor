/**
 * Deputy Photo Audit & Fix Script
 *
 * This script audits all deputy photo URLs in the Supabase database and fixes
 * missing or incorrect URLs by setting them to the correct Parliament API format.
 *
 * Features:
 * - Queries all 230 deputies from Supabase
 * - Identifies missing (null/empty) photo URLs
 * - Identifies incorrect photo URLs (wrong format or broken links)
 * - Validates URLs return 200 status from Parliament API
 * - Updates database with correct URLs
 * - Generates detailed audit report
 *
 * Usage:
 *   bun run src/audit-deputy-photos.ts [--dry-run] [--fix] [--verbose]
 *
 * Options:
 *   --dry-run   Only audit, don't make any changes (default)
 *   --fix       Apply fixes to database
 *   --verbose   Show detailed output for each deputy
 */

import { supabase } from './supabase.js';
import { getPhotoUrl } from './transform/deputies/helpers.js';

interface AuditOptions {
  dryRun: boolean;
  fix: boolean;
  verbose: boolean;
}

interface DeputyRecord {
  id: string;
  name: string;
  short_name: string;
  external_id: number;
  photo_url: string | null;
  legislature: number;
  is_active: boolean;
}

interface AuditResult {
  deputyId: string;
  name: string;
  externalId: number;
  issue: 'missing' | 'incorrect' | 'valid' | 'unavailable';
  currentUrl: string | null;
  expectedUrl: string;
  httpStatus?: number;
  fixed: boolean;
  error?: string;
}

interface AuditSummary {
  total: number;
  missing: number;
  incorrect: number;
  valid: number;
  unavailable: number;
  fixed: number;
  errors: number;
}

function parseArgs(): AuditOptions {
  const args = process.argv.slice(2);
  const options: AuditOptions = {
    dryRun: true, // Default to dry-run for safety
    fix: false,
    verbose: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
      options.fix = false;
    } else if (arg === '--fix') {
      options.fix = true;
      options.dryRun = false;
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }

  return options;
}

async function fetchAllDeputies(): Promise<DeputyRecord[]> {
  console.log('📥 Fetching all deputies from Supabase...');

  const { data, error } = await supabase
    .from('deputies')
    .select('id, name, short_name, external_id, photo_url, legislature, is_active')
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch deputies: ${error.message}`);
  }

  console.log(`✅ Fetched ${data?.length || 0} deputies\n`);
  return data || [];
}

async function validatePhotoUrl(url: string): Promise<{ valid: boolean; status?: number }> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'manual' });

    // Check for redirects to nophoto.jpg (indicates no photo available)
    const location = response.headers.get('location');
    if (location?.includes('nophoto.jpg') || response.status === 302) {
      return { valid: false, status: 302 };
    }

    return { valid: response.status === 200, status: response.status };
  } catch (error) {
    return { valid: false };
  }
}

async function auditDeputy(
  deputy: DeputyRecord,
  options: AuditOptions
): Promise<AuditResult> {
  const expectedUrl = getPhotoUrl(deputy.external_id);
  const currentUrl = deputy.photo_url;

  // Check if URL is missing
  if (!currentUrl || currentUrl.trim() === '') {
    if (options.verbose) {
      console.log(`❌ [MISSING] ${deputy.name} (ID: ${deputy.external_id})`);
      console.log(`   Current: ${currentUrl || 'null'}`);
      console.log(`   Expected: ${expectedUrl}`);
    }

    return {
      deputyId: deputy.id,
      name: deputy.name,
      externalId: deputy.external_id,
      issue: 'missing',
      currentUrl,
      expectedUrl,
      fixed: false,
    };
  }

  // Check if URL has incorrect format
  if (currentUrl !== expectedUrl) {
    if (options.verbose) {
      console.log(`⚠️  [INCORRECT] ${deputy.name} (ID: ${deputy.external_id})`);
      console.log(`   Current: ${currentUrl}`);
      console.log(`   Expected: ${expectedUrl}`);
    }

    return {
      deputyId: deputy.id,
      name: deputy.name,
      externalId: deputy.external_id,
      issue: 'incorrect',
      currentUrl,
      expectedUrl,
      fixed: false,
    };
  }

  // Validate URL returns 200 status
  const validation = await validatePhotoUrl(expectedUrl);

  if (!validation.valid) {
    if (options.verbose) {
      console.log(`🚫 [UNAVAILABLE] ${deputy.name} (ID: ${deputy.external_id})`);
      console.log(`   URL: ${expectedUrl}`);
      console.log(`   Status: ${validation.status || 'error'}`);
    }

    return {
      deputyId: deputy.id,
      name: deputy.name,
      externalId: deputy.external_id,
      issue: 'unavailable',
      currentUrl,
      expectedUrl,
      httpStatus: validation.status,
      fixed: false,
    };
  }

  if (options.verbose) {
    console.log(`✅ [VALID] ${deputy.name} (ID: ${deputy.external_id})`);
  }

  return {
    deputyId: deputy.id,
    name: deputy.name,
    externalId: deputy.external_id,
    issue: 'valid',
    currentUrl,
    expectedUrl,
    httpStatus: 200,
    fixed: false,
  };
}

async function fixDeputyPhoto(result: AuditResult): Promise<boolean> {
  // Only fix missing or incorrect URLs, not unavailable ones
  if (result.issue !== 'missing' && result.issue !== 'incorrect') {
    return false;
  }

  // Validate the URL first
  const validation = await validatePhotoUrl(result.expectedUrl);
  if (!validation.valid) {
    console.log(`   ⚠️  Skipping fix - URL returns status ${validation.status || 'error'}`);
    return false;
  }

  try {
    const { error } = await supabase
      .from('deputies')
      .update({ photo_url: result.expectedUrl })
      .eq('id', result.deputyId);

    if (error) {
      throw error;
    }

    console.log(`   ✅ Fixed: ${result.name}`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Failed to fix: ${errorMsg}`);
    result.error = errorMsg;
    return false;
  }
}

function printSummary(results: AuditResult[], summary: AuditSummary, options: AuditOptions) {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total deputies audited: ${summary.total}`);
  console.log(`✅ Valid URLs: ${summary.valid} (${((summary.valid / summary.total) * 100).toFixed(1)}%)`);
  console.log(`❌ Missing URLs: ${summary.missing} (${((summary.missing / summary.total) * 100).toFixed(1)}%)`);
  console.log(`⚠️  Incorrect URLs: ${summary.incorrect} (${((summary.incorrect / summary.total) * 100).toFixed(1)}%)`);
  console.log(`🚫 Unavailable photos: ${summary.unavailable} (${((summary.unavailable / summary.total) * 100).toFixed(1)}%)`);

  if (options.fix) {
    console.log(`\n🔧 Fixed: ${summary.fixed} deputies`);
    console.log(`❌ Errors: ${summary.errors} deputies`);
  }

  // Print list of deputies with missing URLs
  const missingDeputies = results.filter((r) => r.issue === 'missing');
  if (missingDeputies.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log(`MISSING PHOTO URLs (${missingDeputies.length})`);
    console.log('-'.repeat(80));
    for (const deputy of missingDeputies) {
      console.log(`- ${deputy.name} (ID: ${deputy.externalId})`);
    }
  }

  // Print list of deputies with incorrect URLs
  const incorrectDeputies = results.filter((r) => r.issue === 'incorrect');
  if (incorrectDeputies.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log(`INCORRECT PHOTO URLs (${incorrectDeputies.length})`);
    console.log('-'.repeat(80));
    for (const deputy of incorrectDeputies) {
      console.log(`- ${deputy.name} (ID: ${deputy.externalId})`);
      console.log(`  Current: ${deputy.currentUrl}`);
      console.log(`  Expected: ${deputy.expectedUrl}`);
    }
  }

  // Print list of deputies without available photos
  const unavailableDeputies = results.filter((r) => r.issue === 'unavailable');
  if (unavailableDeputies.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log(`UNAVAILABLE PHOTOS (${unavailableDeputies.length})`);
    console.log('-'.repeat(80));
    console.log('These deputies have correct URL format but photos are not available from Parliament API:');
    for (const deputy of unavailableDeputies) {
      console.log(`- ${deputy.name} (ID: ${deputy.externalId}) - Status: ${deputy.httpStatus || 'error'}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

async function main() {
  const options = parseArgs();

  console.log('🔍 Deputy Photo URL Audit');
  console.log('='.repeat(80));
  console.log(`Mode: ${options.fix ? '🔧 FIX MODE' : '👁️  DRY-RUN MODE (no changes)'}`);
  console.log(`Verbose: ${options.verbose ? 'ON' : 'OFF'}`);
  console.log('='.repeat(80) + '\n');

  // Step 1: Fetch all deputies
  const deputies = await fetchAllDeputies();

  // Step 2: Audit each deputy
  console.log(`🔍 Auditing ${deputies.length} deputies...\n`);
  const results: AuditResult[] = [];

  for (const deputy of deputies) {
    const result = await auditDeputy(deputy, options);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Step 3: Fix issues if --fix flag is set
  if (options.fix) {
    console.log('\n🔧 Applying fixes...\n');

    const toFix = results.filter((r) => r.issue === 'missing' || r.issue === 'incorrect');
    console.log(`Found ${toFix.length} deputies to fix`);

    for (const result of toFix) {
      const fixed = await fixDeputyPhoto(result);
      if (fixed) {
        result.fixed = true;
      }

      // Small delay to avoid overwhelming database
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Step 4: Generate summary
  const summary: AuditSummary = {
    total: results.length,
    missing: results.filter((r) => r.issue === 'missing').length,
    incorrect: results.filter((r) => r.issue === 'incorrect').length,
    valid: results.filter((r) => r.issue === 'valid').length,
    unavailable: results.filter((r) => r.issue === 'unavailable').length,
    fixed: results.filter((r) => r.fixed).length,
    errors: results.filter((r) => r.error).length,
  };

  printSummary(results, summary, options);

  // Exit code based on issues found
  if (!options.fix && (summary.missing > 0 || summary.incorrect > 0)) {
    console.log('\n💡 Run with --fix flag to apply fixes');
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

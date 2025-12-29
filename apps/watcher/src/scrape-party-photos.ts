#!/usr/bin/env bun
/**
 * Scrape deputy photos from party websites.
 *
 * Usage:
 *   bun run src/scrape-party-photos.ts [--dry-run] [--parties=PSD,CH,BE] [--limit=N]
 *
 * Options:
 *   --dry-run       Show what would be done without making changes
 *   --parties=LIST  Only scrape specific parties (comma-separated: PSD,CH,BE)
 *   --limit=N       Only process first N photos
 */

import { scrapePartyPhotos } from './scrapers/party-photos.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const options: { dryRun: boolean; parties?: string[]; limit?: number } = {
    dryRun: false,
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--parties=')) {
      const partiesStr = arg.split('=')[1];
      if (partiesStr) {
        options.parties = partiesStr.split(',').map((p) => p.trim().toUpperCase());
      }
    } else if (arg.startsWith('--limit=')) {
      const limitStr = arg.split('=')[1];
      if (limitStr) {
        options.limit = Number.parseInt(limitStr, 10);
      }
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  const result = await scrapePartyPhotos(options);

  if (options.dryRun) {
    console.log('\n⚠️  This was a dry run. No changes were made.');
    console.log('Run without --dry-run to actually sync photos.');
  }

  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

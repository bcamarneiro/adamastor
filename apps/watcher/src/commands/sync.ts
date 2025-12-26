/**
 * Sync Command
 *
 * Full data pipeline: fetch + transform in one command.
 *
 * Usage: bun run src/commands/sync.ts
 *
 * This is the command run by the daily GitHub Action.
 * It fetches fresh data from Parliament and transforms it to the database.
 */

import { runTransformPipeline } from '../transform/index.js';
import { runFetch } from './fetch.js';

async function runSync(): Promise<void> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           GOV-PERF DATA SYNC                              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Step 1: Fetch fresh data
  const timestamp = await runFetch();

  console.log('\n');

  // Step 2: Transform to database
  await runTransformPipeline(timestamp);

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║           SYNC COMPLETE                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
}

// CLI entry point
if (import.meta.main) {
  runSync()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Sync failed:', err);
      process.exit(1);
    });
}

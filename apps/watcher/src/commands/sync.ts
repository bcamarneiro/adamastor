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
import { flushSentry, initSentry, reportError } from '../utils/sentry.js';
import { runFetch } from './fetch.js';

async function runSync(): Promise<number> {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           GOV-PERF DATA SYNC                              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Step 1: Fetch fresh data
  const timestamp = await runFetch();

  console.log('\n');

  // Step 2: Transform to database
  const exitCode = await runTransformPipeline(timestamp);

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║           SYNC COMPLETE                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  return exitCode;
}

// CLI entry point
if (import.meta.main) {
  // Initialize Sentry before running
  initSentry();

  runSync()
    .then(async (exitCode) => {
      await flushSentry();
      process.exit(exitCode);
    })
    .catch(async (err) => {
      console.error('Sync failed:', err);
      if (err instanceof Error) {
        reportError(err, { command: 'sync' });
      }
      await flushSentry();
      process.exit(1);
    });
}

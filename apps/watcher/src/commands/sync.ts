/**
 * Sync Command
 *
 * Full data pipeline: fetch + transform in one command.
 *
 * Usage: bun run src/commands/sync.ts [--force]
 *
 * Options:
 *   --force  Skip hash comparison and run full transform regardless of changes
 *
 * This is the command run by the daily GitHub Action.
 * It fetches fresh data from Parliament and transforms it to the database.
 * Uses hash comparison to skip transform when data hasn't changed.
 */

import { DATASETS, SNAPSHOT_PATH } from '../config.js';
import { checkAllDatasetsChanged, updateAllSyncStates } from '../sync-state.js';
import { runTransformPipeline } from '../transform/index.js';
import { flushSentry, initSentry, reportError } from '../utils/sentry.js';
import { runFetch } from './fetch.js';

interface SyncOptions {
  force?: boolean;
}

async function runSync(options: SyncOptions = {}): Promise<number> {
  const startTime = Date.now();

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           ADAMASTOR DATA SYNC                             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (options.force) {
    console.log('⚠️  Force mode enabled - will skip hash comparison\n');
  }

  // Step 1: Fetch fresh data
  const timestamp = await runFetch();
  const snapshotPath = `${SNAPSHOT_PATH}/${timestamp}`;

  console.log('\n');

  // Step 2: Check for changes (unless force mode)
  let changeResults: Map<string, { hasChanged: boolean; hash: string; fileSize: number }> | null =
    null;

  if (!options.force) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CHECKING FOR CHANGES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const datasetNames = DATASETS.map((d) => d.name);
    changeResults = await checkAllDatasetsChanged(snapshotPath, datasetNames);

    // Check if any core datasets changed (that require transform)
    const coreDatasets = ['informacao_base', 'iniciativas', 'atividades'];
    const coreChanges = coreDatasets.filter((name) => changeResults?.get(name)?.hasChanged);

    if (coreChanges.length > 0) {
      console.log(`🔄 Core datasets changed: ${coreChanges.join(', ')}`);
      console.log('   Running full transform pipeline...\n');
    } else {
      console.log('✅ No core datasets changed\n');
    }
  }

  // Step 3: Transform to database (always run - it handles its own optimizations)
  const exitCode = await runTransformPipeline(timestamp);

  // Step 4: Update sync state with new hashes
  if (changeResults) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('UPDATING SYNC STATE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await updateAllSyncStates(changeResults);
    console.log('  ✓ Sync state updated\n');
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           SYNC COMPLETE                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n⏱️  Total sync time: ${totalTime}s\n`);

  return exitCode;
}

// CLI entry point
if (import.meta.main) {
  // Initialize Sentry before running
  initSentry();

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options: SyncOptions = {
    force: args.includes('--force'),
  };

  runSync(options)
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

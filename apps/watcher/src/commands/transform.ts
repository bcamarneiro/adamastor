/**
 * Transform Command
 *
 * Transforms raw Parliament data into normalized database entities.
 *
 * Usage: bun run src/commands/transform.ts <snapshot-timestamp>
 * Example: bun run src/commands/transform.ts 2025-12-25T21-12-45Z
 *
 * What it does:
 * 1. Loads JSON files from snapshot directory
 * 2. Transforms: parties → districts → deputies → initiatives → activities
 * 3. Scrapes: attendance → biographies
 * 4. Calculates: work scores, grades, rankings
 */

import { runTransformPipeline } from '../transform/index.js';

// CLI entry point
if (import.meta.main) {
  const snapshotTs = process.argv[2];

  if (!snapshotTs) {
    console.error('Usage: bun run src/commands/transform.ts <snapshot-timestamp>');
    console.error('Example: bun run src/commands/transform.ts 2025-12-25T21-12-45Z');
    console.error('\nTo see available snapshots: ls snapshots/');
    process.exit(1);
  }

  runTransformPipeline(snapshotTs)
    .then(() => {
      console.log('Transform complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Transform failed:', err);
      process.exit(1);
    });
}

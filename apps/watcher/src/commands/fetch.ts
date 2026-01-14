/**
 * Fetch Command
 *
 * Downloads Parliament data, validates it, and archives to B2.
 *
 * Usage: bun run src/commands/fetch.ts
 *
 * What it does:
 * 1. Fetches 4 datasets from Parliament API
 * 2. Validates against JSON schemas
 * 3. Computes SHA256 checksums
 * 4. Uploads raw files to Backblaze B2
 * 5. Updates "latest" copies on Vercel Blob
 */

import { formatISO } from 'date-fns';
import schemaAgenda from '../../schemas/agenda.schema.json';
import schemaAtv from '../../schemas/atividades.schema.json';
import schemaBase from '../../schemas/informacao_base.schema.json';
import schemaIniciativas from '../../schemas/iniciativas.schema.json';
import { DATASETS, SNAPSHOT_PATH } from '../config.js';
import { fetchDatasets } from '../fetcher.js';
import { sha256 } from '../hash.js';
import { isBlobEnabled, makeLatest } from '../normalise.js';
import { isB2Enabled, uploadFile } from '../upload-b2.js';
import { validate } from '../validator.js';

const SCHEMAS: Record<string, object> = {
  informacao_base: schemaBase,
  agenda: schemaAgenda,
  atividades: schemaAtv,
  iniciativas: schemaIniciativas,
};

export async function runFetch(): Promise<string> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           FETCH - Parliament Data Download');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Generate timestamp for this snapshot
  const timestamp = formatISO(new Date(), { representation: 'complete' }).replace(/[:]/g, '-');
  console.log(`📅 Snapshot: ${timestamp}\n`);

  // Step 1: Fetch all datasets
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: DOWNLOAD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  await fetchDatasets(timestamp);

  // Step 2: Validate and hash
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: VALIDATE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const dataset of DATASETS) {
    const filePath = `${SNAPSHOT_PATH}/${timestamp}/${dataset.name}.json`;
    const schema = SCHEMAS[dataset.name];

    if (schema) {
      // Use non-strict mode: log validation errors as warnings but continue processing
      // biome-ignore lint/suspicious/noExplicitAny: Schema types from JSON don't match Ajv's strict typing
      await validate(filePath, schema as any, { strict: false });
      const checksum = await sha256(filePath);
      console.log(`  ✓ ${dataset.name} (sha256: ${checksum.slice(0, 16)}...)`);
    }
  }
  console.log();

  // Step 3: Upload to B2 (optional)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: ARCHIVE TO B2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (isB2Enabled()) {
    for (const dataset of DATASETS) {
      const local = `${SNAPSHOT_PATH}/${timestamp}/${dataset.name}.json`;
      const remote = `${timestamp}/${dataset.name}.json`;
      await uploadFile(local, remote);
      console.log(`  ✓ ${dataset.name} → B2`);
    }
  } else {
    console.log('  ⊘ B2 not configured, skipping archive step');
  }
  console.log();

  // Step 4: Update "latest" on Vercel Blob (optional)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 4: UPDATE LATEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (isBlobEnabled()) {
    for (const dataset of DATASETS) {
      const local = `${SNAPSHOT_PATH}/${timestamp}/${dataset.name}.json`;
      await makeLatest(local, dataset.name);
      console.log(`  ✓ ${dataset.name} → latest`);
    }
  } else {
    console.log('  ⊘ Blob storage not configured, skipping latest update');
  }
  console.log();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('           FETCH COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nTimestamp: ${timestamp}`);
  console.log(`Run transform with: bun run transform ${timestamp}\n`);

  return timestamp;
}

// CLI entry point
if (import.meta.main) {
  runFetch()
    .then((ts) => {
      console.log(`Success! Snapshot: ${ts}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fetch failed:', err);
      process.exit(1);
    });
}

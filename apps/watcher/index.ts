import { formatISO } from 'date-fns';
import schemaAgenda from './schemas/agenda.schema.json';
import schemaAtv from './schemas/atividades.schema.json';
import schemaBase from './schemas/informacao_base.schema.json';
import schemaIniciativas from './schemas/iniciativas.schema.json';
import { DATASETS, SNAPSHOT_PATH } from './src/config.js';
import { fetchDatasets } from './src/fetcher.js';
import { sha256 } from './src/hash.js';
import { makeLatest } from './src/normalise.js';
import { uploadFile } from './src/upload-b2.js';
import { validate } from './src/validator.js';

let errorCount = 0;

(async () => {
  try {
    console.log('[DEBUG] Script started');
    const ts = formatISO(new Date(), { representation: 'complete' }).replace(/[:]/g, '-');
    console.log(`[DEBUG] Timestamp generated: ${ts}`);
    await fetchDatasets(ts);
    console.log(`[DEBUG] Datasets fetched for timestamp: ${ts}`);

    // validate & hash
    for (const d of DATASETS) {
      try {
        const p = `${SNAPSHOT_PATH}/${ts}/${d.name}.json`;
        const schema =
          d.name === 'informacao_base'
            ? schemaBase
            : d.name === 'agenda'
              ? schemaAgenda
              : d.name === 'atividades'
                ? (schemaAtv as any)
                : (schemaIniciativas as any);
        console.log(`[DEBUG] Validating ${d.name} with schema`);
        await validate(p, schema);

        console.log(`[DEBUG] Calculating sha256 for ${d.name}`);
        const checksum = await sha256(p);
        console.log(`${d.name} • sha256 ${checksum}`);
      } catch (err) {
        console.error(`[ERROR] Failed to process ${d.name}:`, err);
        errorCount++;
      }
    }

    // compare with previous snapshot
    // (left as exercise – list snapshot folder, pick newest-1, run diffFiles)

    // upload raw files & index.json
    for (const d of DATASETS) {
      try {
        const local = `${SNAPSHOT_PATH}/${ts}/${d.name}.json`;
        const remote = `${ts}/${d.name}.json`;
        console.log(`[DEBUG] Uploading ${local} to ${remote}`);
        await uploadFile(local, remote);
      } catch (err) {
        console.error(`[ERROR] Failed to upload ${d.name}:`, err);
        errorCount++;
      }
    }

    // make "latest"
    for (const d of DATASETS) {
      try {
        const local = `${SNAPSHOT_PATH}/${ts}/${d.name}.json`;
        console.log(`[DEBUG] Making latest for ${d.name}`);
        await makeLatest(local, d.name);
      } catch (err) {
        console.error(`[ERROR] Failed to make latest for ${d.name}:`, err);
        errorCount++;
      }
    }

    if (errorCount > 0) {
      console.error(`[ERROR] Script completed with ${errorCount} error(s)`);
      process.exit(1);
    }

    console.log('[DEBUG] Script completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Script failed:', err);
    process.exit(1);
  }
})();

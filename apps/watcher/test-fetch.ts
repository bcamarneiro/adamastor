/**
 * Test script to verify Parliament API data fetching
 * Run with: bun run test-fetch.ts
 */

import { readFile, stat } from 'node:fs/promises';
import { formatISO } from 'date-fns';
import schemaAgenda from './schemas/agenda.schema.json';
import schemaAtv from './schemas/atividades.schema.json';
import schemaBase from './schemas/informacao_base.schema.json';
import schemaIniciativas from './schemas/iniciativas.schema.json';
import { DATASETS, SNAPSHOT_PATH } from './src/config.js';
import { fetchDatasets } from './src/fetcher.js';
import { sha256 } from './src/hash.js';
import { validate } from './src/validator.js';

async function formatBytes(bytes: number): Promise<string> {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function testFetch() {
  console.log('🚀 Testing Parliament API data fetch...\n');

  const ts = formatISO(new Date(), { representation: 'complete' }).replace(/[:]/g, '-');
  console.log(`📅 Timestamp: ${ts}\n`);

  // Step 1: Fetch
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: FETCHING FROM PARLIAMENT API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const fetchStart = Date.now();
  await fetchDatasets(ts);
  const fetchTime = ((Date.now() - fetchStart) / 1000).toFixed(1);
  console.log(`✅ Fetched all datasets in ${fetchTime}s\n`);

  // Step 2: Validate & analyze
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: VALIDATING & ANALYZING DATA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const d of DATASETS) {
    const filePath = `${SNAPSHOT_PATH}/${ts}/${d.name}.json`;
    const schema =
      d.name === 'informacao_base'
        ? schemaBase
        : d.name === 'agenda'
          ? schemaAgenda
          : d.name === 'atividades'
            ? (schemaAtv as any)
            : (schemaIniciativas as any);

    console.log(`📄 ${d.name}`);
    console.log(`   URL: ${d.url.substring(0, 60)}...`);

    // File size
    const fileStats = await stat(filePath);
    console.log(`   Size: ${await formatBytes(fileStats.size)}`);

    // Validate
    try {
      await validate(filePath, schema);
      console.log('   Validation: ✅ PASSED');
    } catch (err) {
      console.log(`   Validation: ❌ FAILED - ${err}`);
    }

    // Hash
    const checksum = await sha256(filePath);
    console.log(`   SHA256: ${checksum.substring(0, 16)}...`);

    // Parse and analyze content
    const raw = JSON.parse(await readFile(filePath, 'utf8'));

    if (d.name === 'informacao_base') {
      const deputados = raw.Deputados || [];
      const grupos = raw.GruposParlamentares || [];
      const circulos = raw.CirculosEleitorais || [];
      console.log('   Content:');
      console.log(`     - Deputies: ${deputados.length}`);
      console.log(`     - Parties: ${grupos.length}`);
      console.log(`     - Districts: ${circulos.length}`);
      console.log(`     - Legislature: ${raw.Legislatura?.legDes || 'N/A'}`);

      // Sample deputy
      if (deputados.length > 0) {
        const sample = deputados[0];
        console.log('   Sample Deputy:');
        console.log(`     - ID: ${sample.DepId}`);
        console.log(`     - Name: ${sample.DepNomeCompleto}`);
        console.log(`     - District: ${sample.DepCPDes}`);
        console.log(`     - Status: ${sample.DepSituacao?.silesdes || 'N/A'}`);
      }
    }

    if (d.name === 'atividades') {
      const atividades = raw.Atividades || raw.ArrayOfAtividades?.Atividades || [];
      console.log('   Content:');
      console.log(
        `     - Activities: ${Array.isArray(atividades) ? atividades.length : 'N/A (check structure)'}`
      );

      // Check structure
      console.log(`   Top-level keys: ${Object.keys(raw).join(', ')}`);
    }

    if (d.name === 'iniciativas') {
      const iniciativas = raw.Iniciativas || raw.ArrayOfIniciativas?.Iniciativas || [];
      console.log('   Content:');
      console.log(
        `     - Initiatives: ${Array.isArray(iniciativas) ? iniciativas.length : 'N/A (check structure)'}`
      );

      // Check structure
      console.log(`   Top-level keys: ${Object.keys(raw).join(', ')}`);

      // Sample initiative
      const list = Array.isArray(iniciativas) ? iniciativas : [];
      if (list.length > 0) {
        const sample = list[0];
        console.log('   Sample Initiative:');
        console.log(`     - ID: ${sample.IniId}`);
        console.log(`     - Title: ${(sample.IniTitulo || '').substring(0, 50)}...`);
        console.log(`     - Type: ${sample.IniTipo}`);
        console.log(`     - Status: ${sample.IniEstado}`);
      }
    }

    if (d.name === 'agenda') {
      const eventos = raw.Eventos || raw.ArrayOfEventos?.Eventos || [];
      console.log('   Content:');
      console.log(
        `     - Events: ${Array.isArray(eventos) ? eventos.length : 'N/A (check structure)'}`
      );
      console.log(`   Top-level keys: ${Object.keys(raw).join(', ')}`);
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n📁 Data saved to: ${SNAPSHOT_PATH}/${ts}/\n`);
}

testFetch().catch(console.error);

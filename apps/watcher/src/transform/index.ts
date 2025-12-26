import { readFile } from 'node:fs/promises';
import { SNAPSHOT_PATH } from '../config.js';
import { fetchAllAttendance } from '../scrapers/attendance.js';
import { countInterventions, distributeInterventionsToDeputies } from './activities.js';
import { transformAttendance } from './attendance.js';
import { transformBiographies } from './biography.js';
import { ensureDeputyStats, syncDeputyExtendedInfo, transformDeputies } from './deputies/index.js';
import { transformDistricts } from './districts.js';
import { transformInitiatives, upsertPartyVotes } from './initiatives.js';
import { transformParties } from './parties.js';
import {
  recalculateAllStats,
  updateDeputyInterventionCounts,
  updateDeputyProposalCounts,
  updatePartyVoteStats,
} from './stats.js';

export async function runTransformPipeline(snapshotTs: string): Promise<void> {
  const snapshotPath = `${SNAPSHOT_PATH}/${snapshotTs}`;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('           TRANSFORM PIPELINE - Parliament Data');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📁 Snapshot: ${snapshotPath}\n`);

  // Load data files
  console.log('📂 Loading data files...\n');

  const infoBase = JSON.parse(await readFile(`${snapshotPath}/informacao_base.json`, 'utf8'));
  console.log(
    `  informacao_base: ${infoBase.Deputados.length} deputados, ${infoBase.GruposParlamentares.length} parties, ${infoBase.CirculosEleitorais.length} districts`
  );

  const iniciativas = JSON.parse(await readFile(`${snapshotPath}/iniciativas.json`, 'utf8'));
  console.log(`  iniciativas: ${iniciativas.length} initiatives`);

  const atividades = JSON.parse(await readFile(`${snapshotPath}/atividades.json`, 'utf8'));
  console.log(`  atividades: ${atividades.Debates?.length || 0} debates\n`);

  // Step 1: Transform parties
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: PARTIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const partyMap = await transformParties(infoBase.GruposParlamentares);

  // Step 2: Transform districts
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 2: DISTRICTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const districtMap = await transformDistricts(infoBase.CirculosEleitorais);

  // Step 3: Transform deputies
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 3: DEPUTIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const deputyMaps = await transformDeputies(infoBase.Deputados, partyMap, districtMap);

  // Ensure deputy_stats records exist
  await ensureDeputyStats(deputyMaps.byDepId);

  // Sync extended deputy info (roles, party history, status history)
  await syncDeputyExtendedInfo(infoBase.Deputados, deputyMaps.byDepId, partyMap);

  // Step 4: Transform initiatives and extract votes
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 4: INITIATIVES & VOTES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  // Use byCadastroId for initiatives since authors use idCadastro (=DepCadId)
  const { partyVotes, authorCounts } = await transformInitiatives(
    iniciativas,
    deputyMaps.byCadastroId
  );

  // Upsert party votes
  await upsertPartyVotes(partyVotes);

  // Step 5: Process activities (interventions)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 5: ACTIVITIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const interventionsByParty = await countInterventions(atividades, partyMap);
  const interventionsByDeputy = await distributeInterventionsToDeputies(
    interventionsByParty,
    partyMap
  );

  // Step 6: Scrape and transform plenary attendance
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 6: PLENARY ATTENDANCE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  try {
    const { meetings, attendance } = await fetchAllAttendance();
    await transformAttendance(meetings, attendance);
  } catch (err) {
    console.error('  ⚠️  Attendance scraping failed (non-critical):', err);
    console.log('  Continuing with pipeline...\n');
  }

  // Step 7: Scrape and transform deputy biographies
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 7: DEPUTY BIOGRAPHIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  try {
    await transformBiographies();
  } catch (err) {
    console.error('  ⚠️  Biography scraping failed (non-critical):', err);
    console.log('  Continuing with pipeline...\n');
  }

  // Step 8: Update deputy stats
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 8: UPDATE STATISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Update proposal counts
  await updateDeputyProposalCounts(authorCounts);

  // Update intervention counts
  await updateDeputyInterventionCounts(interventionsByDeputy);

  // Update party vote stats
  await updatePartyVoteStats(partyMap);

  // Recalculate work scores and rankings
  await recalculateAllStats();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('           TRANSFORM PIPELINE COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// CLI entry point
if (import.meta.main) {
  const snapshotTs = process.argv[2];
  if (!snapshotTs) {
    console.error('Usage: bun run src/transform/index.ts <snapshot-timestamp>');
    console.error('Example: bun run src/transform/index.ts 2025-12-24T18-39-03Z');
    process.exit(1);
  }

  runTransformPipeline(snapshotTs).catch((err) => {
    console.error('Transform failed:', err);
    process.exit(1);
  });
}

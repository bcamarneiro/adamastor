import { readFile } from 'node:fs/promises';
import { FEATURES, SNAPSHOT_PATH } from '../config.js';
import { fetchAllAttendance } from '../scrapers/attendance.js';
import {
  getCurrentLegislature,
  updateLegislatureFromDetection,
  validateLegislature,
} from '../services/legislature.js';
import { pipelineResult, runStep } from '../utils/pipeline-result.js';
import { countInterventions, distributeInterventionsToDeputies } from './activities.js';
import { transformAttendance } from './attendance.js';
import { transformBiographies } from './biography.js';
import { ensureDeputyStats, syncDeputyExtendedInfo, transformDeputies } from './deputies/index.js';
import { transformDistricts } from './districts.js';
import { transformInitiatives, upsertPartyVotes } from './initiatives.js';
import { detectLegislatureFromData } from './legislature-detection.js';
import { transformParties } from './parties.js';
import {
  recalculateAllStats,
  updateDeputyInterventionCounts,
  updateDeputyProposalCounts,
  updatePartyVoteStats,
} from './stats.js';

export async function runTransformPipeline(snapshotTs: string): Promise<number> {
  const snapshotPath = `${SNAPSHOT_PATH}/${snapshotTs}`;
  const pipelineStart = Date.now();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('           TRANSFORM PIPELINE - Parliament Data');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📁 Snapshot: ${snapshotPath}\n`);

  // Load data files (can be parallelized)
  console.log('📂 Loading data files...\n');
  const loadStart = Date.now();

  const [infoBase, iniciativas, atividades] = await Promise.all([
    readFile(`${snapshotPath}/informacao_base.json`, 'utf8').then(JSON.parse),
    readFile(`${snapshotPath}/iniciativas.json`, 'utf8').then(JSON.parse),
    readFile(`${snapshotPath}/atividades.json`, 'utf8').then(JSON.parse),
  ]);

  console.log(
    `  informacao_base: ${infoBase.Deputados.length} deputados, ${infoBase.GruposParlamentares.length} parties, ${infoBase.CirculosEleitorais.length} districts`
  );
  console.log(`  iniciativas: ${iniciativas.length} initiatives`);
  console.log(`  atividades: ${atividades.Debates?.length || 0} debates`);
  console.log(`  ⏱️  Files loaded in ${((Date.now() - loadStart) / 1000).toFixed(1)}s\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGISLATURE AUTO-DETECTION (if feature flag enabled)
  // ═══════════════════════════════════════════════════════════════════════════
  if (FEATURES.legislatureAutoDetect) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('LEGISLATURE AUTO-DETECTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const detected = detectLegislatureFromData(infoBase);
      const validation = validateLegislature(detected);

      console.log(`  📊 Detected legislature: ${detected.number} (${detected.roman})`);
      console.log(`  📍 Source: ${detected.source}`);
      console.log(`  ✅ Matches constant: ${detected.matchesConstant ? 'Yes' : 'No'}`);

      if (validation.warnings.length > 0) {
        console.log(`  ⚠️  Warnings:`);
        for (const warning of validation.warnings) {
          console.log(`     - ${warning}`);
        }
      }

      // Store in database
      const updateResult = await updateLegislatureFromDetection(detected);
      if (updateResult.success) {
        console.log(`  💾 Stored in database config table\n`);
      } else {
        console.log(`  ⚠️  Failed to store in database: ${updateResult.error}\n`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`  ⚠️  Legislature detection failed: ${errorMessage}`);
      console.log(`  🔄 Falling back to constant value\n`);
    }
  } else {
    console.log('  ⊘ Legislature auto-detection disabled (LEGISLATURE_AUTO_DETECT=false)\n');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Foundation data (parties + districts run in parallel)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 1: FOUNDATION (Parties + Districts in parallel)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const phase1Start = Date.now();

  const [partyMap, districtMap] = await Promise.all([
    transformParties(infoBase.GruposParlamentares),
    transformDistricts(infoBase.CirculosEleitorais),
  ]);

  console.log(`  ⏱️  Phase 1 completed in ${((Date.now() - phase1Start) / 1000).toFixed(1)}s\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Deputies (depends on parties & districts)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 2: DEPUTIES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const phase2Start = Date.now();

  const deputyMaps = await transformDeputies(infoBase.Deputados, partyMap, districtMap);

  // Ensure deputy_stats records exist
  await ensureDeputyStats(deputyMaps.byDepId);

  // Sync extended deputy info (roles, party history, status history)
  await syncDeputyExtendedInfo(infoBase.Deputados, deputyMaps.byDepId, partyMap);

  console.log(`  ⏱️  Phase 2 completed in ${((Date.now() - phase2Start) / 1000).toFixed(1)}s\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Data transforms + scraping (all independent, run in parallel)
  // - Initiatives transform (CPU-bound)
  // - Activities transform (CPU-bound)
  // - Attendance scraping (I/O-bound)
  // - Biography scraping (I/O-bound)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 3: DATA TRANSFORMS + SCRAPING (in parallel)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const phase3Start = Date.now();

  // Variables to capture results from parallel tasks
  let authorCounts: Map<string, number> = new Map();
  let interventionsByDeputy: Map<string, number> = new Map();

  const phase3Results = await Promise.allSettled([
    // Task 1: Initiatives & Votes
    (async () => {
      console.log('  📋 Starting initiatives transform...');
      const result = await transformInitiatives(iniciativas, deputyMaps.byCadastroId);
      await upsertPartyVotes(result.partyVotes);
      authorCounts = result.authorCounts;
      console.log('  ✅ Initiatives complete');
      return result;
    })(),

    // Task 2: Activities (interventions)
    (async () => {
      console.log('  🎤 Starting activities transform...');
      const interventionsByParty = await countInterventions(atividades, partyMap);
      interventionsByDeputy = await distributeInterventionsToDeputies(
        interventionsByParty,
        partyMap
      );
      console.log('  ✅ Activities complete');
      return interventionsByDeputy;
    })(),

    // Task 3: Plenary Attendance (I/O-bound scraping with incremental support)
    runStep(
      'Plenary Attendance',
      async () => {
        console.log('  📊 Starting attendance scraping (incremental)...');
        const { meetings, attendance, skipped } = await fetchAllAttendance();
        await transformAttendance(meetings, attendance);
        console.log(`  ✅ Attendance complete (${skipped} meetings skipped)`);
        return { processed: attendance.length, failed: 0 };
      },
      { critical: false }
    ),

    // Task 4: Deputy Biographies (I/O-bound scraping with TTL)
    runStep(
      'Deputy Biographies',
      async () => {
        console.log('  📝 Starting biography scraping (TTL-filtered)...');
        const result = await transformBiographies();
        console.log(
          `  ✅ Biographies complete (${result.scraped} scraped, ${result.skipped} skipped)`
        );
        return { processed: result.scraped, failed: 0 };
      },
      { critical: false }
    ),
  ]);

  // Check for any failures in Phase 3
  for (const result of phase3Results) {
    if (result.status === 'rejected') {
      console.error('  ⚠️ Phase 3 task failed:', result.reason);
    }
  }

  console.log(`\n  ⏱️  Phase 3 completed in ${((Date.now() - phase3Start) / 1000).toFixed(1)}s\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: Statistics (depends on everything above)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHASE 4: UPDATE STATISTICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  const phase4Start = Date.now();

  // Update proposal counts
  await updateDeputyProposalCounts(authorCounts);

  // Update intervention counts
  await updateDeputyInterventionCounts(interventionsByDeputy);

  // Update party vote stats
  await updatePartyVoteStats(partyMap);

  // Recalculate work scores and rankings
  await runStep(
    'Recalculate Stats',
    async () => {
      await recalculateAllStats();
      return { processed: 1, failed: 0 };
    },
    { critical: true }
  );

  console.log(`  ⏱️  Phase 4 completed in ${((Date.now() - phase4Start) / 1000).toFixed(1)}s\n`);

  // Print summary and timing
  const totalTime = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`⏱️  TOTAL PIPELINE TIME: ${totalTime}s`);
  console.log('═══════════════════════════════════════════════════════════\n');

  pipelineResult.printSummary();
  return pipelineResult.getExitCode();
}

// CLI entry point
if (import.meta.main) {
  const snapshotTs = process.argv[2];
  if (!snapshotTs) {
    console.error('Usage: bun run src/transform/index.ts <snapshot-timestamp>');
    console.error('Example: bun run src/transform/index.ts 2025-12-24T18-39-03Z');
    process.exit(1);
  }

  runTransformPipeline(snapshotTs)
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((err) => {
      console.error('Transform failed:', err);
      process.exit(1);
    });
}

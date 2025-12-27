/**
 * Main deputy transformation logic.
 * Converts Parliament API data to database format and upserts deputies.
 */

import { supabase } from '../../supabase.js';
import { pipelineResult } from '../../utils/pipeline-result.js';
import { ProgressBar } from '../../utils/progress.js';
import {
  deduplicateDeputies,
  getCurrentParty,
  getMandateDates,
  getPhotoUrl,
  isActiveDeputy,
  parseLegislature,
} from './helpers.js';
import type { DeputyMaps, ParliamentDeputado } from './types.js';

export async function transformDeputies(
  deputados: ParliamentDeputado[],
  partyMap: Map<string, string>,
  districtMap: Map<number, string>
): Promise<DeputyMaps> {
  console.log(`📦 Transforming ${deputados.length} deputies...`);

  const byDepId = new Map<number, string>();
  const byCadastroId = new Map<number, string>();
  let activeCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // Deduplicate deputies by DepId (take most recent)
  const uniqueDeputies = deduplicateDeputies(deputados);

  console.log(`  Found ${uniqueDeputies.size} unique deputies`);

  const progress = new ProgressBar(uniqueDeputies.size, 'Deputies');

  for (const dep of uniqueDeputies.values()) {
    const partyAcronym = getCurrentParty(dep);
    const partyId = partyAcronym ? partyMap.get(partyAcronym) : null;
    const districtId = districtMap.get(dep.DepCPId);
    const isActive = isActiveDeputy(dep);
    const { start, end } = getMandateDates(dep);

    if (isActive) activeCount++;

    const deputy = {
      external_id: String(dep.DepId),
      name: dep.DepNomeCompleto,
      short_name: dep.DepNomeParlamentar,
      photo_url: getPhotoUrl(dep.DepId),
      party_id: partyId || undefined,
      district_id: districtId || undefined,
      is_active: isActive,
      mandate_start: start || undefined,
      mandate_end: end || undefined,
      legislature: parseLegislature(dep.LegDes),
    };

    const { data, error } = await supabase
      .from('deputies')
      .upsert(deputy, { onConflict: 'external_id' })
      .select('id, external_id')
      .single();

    if (error) {
      failedCount++;
      if (errors.length < 5) errors.push(`${dep.DepNomeParlamentar}: ${error.message}`);

      // Fail fast on authentication errors
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        progress.fail('Authentication failed');
        pipelineResult.addStep('Deputies', {
          status: 'error',
          processed: uniqueDeputies.size,
          failed: uniqueDeputies.size,
          errors: ['Authentication failed: Invalid Supabase API key'],
        });
        throw new Error('Authentication failed: Invalid Supabase API key');
      }
      progress.update();
      continue;
    }

    byDepId.set(dep.DepId, data.id);
    byCadastroId.set(dep.DepCadId, data.id);
    progress.update();
  }

  progress.complete(`${byDepId.size} loaded (${activeCount} active)`);

  // Record step result
  const status =
    failedCount === 0 ? 'success' : failedCount === uniqueDeputies.size ? 'error' : 'warning';
  pipelineResult.addStep('Deputies', {
    status,
    processed: uniqueDeputies.size,
    failed: failedCount,
    errors,
  });
  return { byDepId, byCadastroId };
}

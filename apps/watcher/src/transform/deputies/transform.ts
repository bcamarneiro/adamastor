/**
 * Main deputy transformation logic.
 * Converts Parliament API data to database format and upserts deputies.
 */

import { supabase } from '../../supabase.js';
import { pipelineResult } from '../../utils/pipeline-result.js';
import { ProgressBar } from '../../utils/progress.js';
import type { DeputyMaps, ParliamentDeputado } from './types.js';

function parseLegislature(legDes: string): number {
  const romanNumerals: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
    XI: 11,
    XII: 12,
    XIII: 13,
    XIV: 14,
    XV: 15,
    XVI: 16,
    XVII: 17,
    XVIII: 18,
    XIX: 19,
    XX: 20,
  };
  return romanNumerals[legDes] || 16;
}

function getPhotoUrl(depId: number): string {
  return `https://app.parlamento.pt/webutils/getimage.aspx?id=${depId}&type=deputado`;
}

function isActiveDeputy(dep: ParliamentDeputado): boolean {
  return dep.DepSituacao.some((sit) => {
    return sit.sioDes.toLowerCase().includes('efetivo');
  });
}

function getCurrentParty(dep: ParliamentDeputado): string | null {
  const now = new Date();
  const currentGP = dep.DepGP.find((gp) => {
    const endDate = gp.gpDtFim ? new Date(gp.gpDtFim) : null;
    return !endDate || endDate > now;
  });
  return currentGP?.gpSigla || dep.DepGP[0]?.gpSigla || null;
}

function getMandateDates(dep: ParliamentDeputado): { start: string | null; end: string | null } {
  let start: string | null = null;
  let end: string | null = null;

  for (const sit of dep.DepSituacao) {
    if (!start || sit.sioDtInicio < start) {
      start = sit.sioDtInicio;
    }
    if (sit.sioDtFim) {
      if (!end || sit.sioDtFim > end) {
        end = sit.sioDtFim;
      }
    }
  }

  return { start, end };
}

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
  const uniqueDeputies = new Map<number, ParliamentDeputado>();
  for (const dep of deputados) {
    const existing = uniqueDeputies.get(dep.DepId);
    if (!existing) {
      uniqueDeputies.set(dep.DepId, dep);
    } else {
      const existingDates = getMandateDates(existing);
      const newDates = getMandateDates(dep);
      if (newDates.start && (!existingDates.start || newDates.start > existingDates.start)) {
        uniqueDeputies.set(dep.DepId, dep);
      }
    }
  }

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
  const status = failedCount === 0 ? 'success' : failedCount === uniqueDeputies.size ? 'error' : 'warning';
  pipelineResult.addStep('Deputies', {
    status,
    processed: uniqueDeputies.size,
    failed: failedCount,
    errors,
  });
  return { byDepId, byCadastroId };
}

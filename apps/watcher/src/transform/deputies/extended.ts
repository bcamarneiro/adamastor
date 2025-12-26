/**
 * Extended deputy information sync.
 * Handles roles, party history, and status history.
 */

import { supabase } from '../../supabase.js';
import { ProgressBar } from '../../utils/progress.js';
import type { ParliamentDeputado } from './types.js';

export async function syncDeputyExtendedInfo(
  deputados: ParliamentDeputado[],
  deputyMap: Map<number, string>,
  partyMap: Map<string, string>
): Promise<void> {
  console.log('📋 Syncing extended deputy info (roles, party history, status)...');

  let rolesCount = 0;
  let partyHistoryCount = 0;
  let statusHistoryCount = 0;

  // Count deputies with valid IDs for progress
  const validDeputados = deputados.filter((dep) => deputyMap.has(dep.DepId));
  const progress = new ProgressBar(validDeputados.length, 'Extended Info');

  for (const dep of deputados) {
    const deputyId = deputyMap.get(dep.DepId);
    if (!deputyId) continue;

    // Sync roles (DepCargo)
    if (dep.DepCargo && dep.DepCargo.length > 0) {
      const roles = dep.DepCargo.map((cargo) => ({
        deputy_id: deputyId,
        role_name: cargo.carDes,
        role_id: cargo.carId,
        start_date: cargo.carDtInicio,
        end_date: cargo.carDtFim || undefined,
      }));

      await supabase.from('deputy_roles').delete().eq('deputy_id', deputyId);

      const { error: rolesError } = await supabase.from('deputy_roles').insert(roles);

      if (!rolesError) {
        rolesCount += roles.length;
      }
    }

    // Sync party history (DepGP)
    if (dep.DepGP && dep.DepGP.length > 0) {
      const partyHistory = dep.DepGP.map((gp) => ({
        deputy_id: deputyId,
        party_id: partyMap.get(gp.gpSigla) || undefined,
        party_acronym: gp.gpSigla,
        start_date: gp.gpDtInicio,
        end_date: gp.gpDtFim || undefined,
      }));

      await supabase.from('deputy_party_history').delete().eq('deputy_id', deputyId);

      const { error: partyError } = await supabase
        .from('deputy_party_history')
        .insert(partyHistory);

      if (!partyError) {
        partyHistoryCount += partyHistory.length;
      }
    }

    // Sync status history (DepSituacao)
    if (dep.DepSituacao && dep.DepSituacao.length > 0) {
      const statusHistory = dep.DepSituacao.map((sit) => ({
        deputy_id: deputyId,
        status: sit.sioDes,
        start_date: sit.sioDtInicio,
        end_date: sit.sioDtFim || undefined,
      }));

      await supabase.from('deputy_status_history').delete().eq('deputy_id', deputyId);

      const { error: statusError } = await supabase
        .from('deputy_status_history')
        .insert(statusHistory);

      if (!statusError) {
        statusHistoryCount += statusHistory.length;
      }
    }

    progress.update();
  }

  progress.complete(`${rolesCount} roles, ${partyHistoryCount} party, ${statusHistoryCount} status`);
}

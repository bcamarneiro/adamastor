import { useQuery } from '@tanstack/react-query';
import {
  type DeputyPartyHistory,
  type DeputyRole,
  type DeputyStatusHistory,
  supabase,
} from '../../lib/supabase';

export interface DeputyExtendedInfo {
  roles: DeputyRole[];
  partyHistory: DeputyPartyHistory[];
  statusHistory: DeputyStatusHistory[];
}

async function fetchDeputyExtendedInfo(deputyId: string): Promise<DeputyExtendedInfo> {
  const [rolesResult, partyHistoryResult, statusHistoryResult] = await Promise.all([
    supabase
      .from('deputy_roles')
      .select('*')
      .eq('deputy_id', deputyId)
      .order('start_date', { ascending: false }),
    supabase
      .from('deputy_party_history')
      .select('*')
      .eq('deputy_id', deputyId)
      .order('start_date', { ascending: false }),
    supabase
      .from('deputy_status_history')
      .select('*')
      .eq('deputy_id', deputyId)
      .order('start_date', { ascending: false }),
  ]);

  return {
    roles: rolesResult.data || [],
    partyHistory: partyHistoryResult.data || [],
    statusHistory: statusHistoryResult.data || [],
  };
}

export function useDeputyExtendedInfo(deputyId: string | null) {
  return useQuery({
    queryKey: ['deputy', 'extended', deputyId],
    queryFn: () => fetchDeputyExtendedInfo(deputyId!),
    enabled: !!deputyId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

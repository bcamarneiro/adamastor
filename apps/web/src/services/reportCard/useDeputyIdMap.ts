import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

/**
 * Fetches a mapping from Parliament API `external_id` (a.k.a. `DepId`) to the
 * Supabase deputy `id` (UUID). Used by pages that source their list from the
 * Parliament API (e.g. /parliament) but need to link to /deputado/:deputyId
 * which uses the Supabase UUID.
 */
async function fetchDeputyIdMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('deputy_details')
    .select('id, external_id')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching deputy id map:', error);
    throw new Error('Erro ao carregar mapa de deputados');
  }

  const map = new Map<string, string>();
  for (const row of data || []) {
    if (row.external_id && row.id) {
      map.set(String(row.external_id), row.id);
    }
  }
  return map;
}

export function useDeputyIdMap() {
  return useQuery({
    queryKey: ['deputy-id-map'],
    queryFn: fetchDeputyIdMap,
    staleTime: 1000 * 60 * 60, // 1 hour - data syncs daily
  });
}

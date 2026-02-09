import { useQuery } from '@tanstack/react-query';
import { type DeputyDetail, supabase } from '../../lib/supabase';

async function fetchDeputiesByParty(partyId: string): Promise<DeputyDetail[]> {
  const { data, error } = await supabase
    .from('deputy_details')
    .select('*')
    .eq('party_id', partyId)
    .eq('is_active', true)
    .order('work_score', { ascending: false });

  if (error) {
    console.error('Error fetching deputies by party:', error);
    throw new Error('Erro ao carregar deputados do partido');
  }

  return data || [];
}

export function useDeputiesByParty(partyId: string | null) {
  return useQuery({
    queryKey: ['deputies', 'party', partyId],
    queryFn: () => fetchDeputiesByParty(partyId as string),
    enabled: !!partyId,
    staleTime: 1000 * 60 * 60, // 1 hour - data syncs daily
  });
}

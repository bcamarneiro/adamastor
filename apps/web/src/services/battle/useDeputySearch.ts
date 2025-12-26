import { useQuery } from '@tanstack/react-query';
import { type DeputyDetail, supabase } from '../../lib/supabase';

async function searchDeputies(query: string): Promise<DeputyDetail[]> {
  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('deputy_details')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,short_name.ilike.%${query}%`)
    .order('work_score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error searching deputies:', error);
    throw new Error('Erro ao procurar deputados');
  }

  return data || [];
}

export function useDeputySearch(query: string) {
  return useQuery({
    queryKey: ['deputies', 'search', query],
    queryFn: () => searchDeputies(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

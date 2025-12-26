import { useQuery } from '@tanstack/react-query';
import { type DeputyDetail, supabase } from '../../lib/supabase';

async function fetchBottomWorkers(limit = 3): Promise<DeputyDetail[]> {
  const { data, error } = await supabase
    .from('deputy_details')
    .select('*')
    .eq('is_active', true)
    .order('work_score', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching bottom workers:', error);
    throw new Error('Erro ao carregar ranking');
  }

  return data || [];
}

export function useBottomWorkers(limit = 3) {
  return useQuery({
    queryKey: ['leaderboard', 'bottom', limit],
    queryFn: () => fetchBottomWorkers(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

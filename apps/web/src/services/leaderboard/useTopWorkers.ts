import { useQuery } from '@tanstack/react-query';
import { type DeputyDetail, supabase } from '../../lib/supabase';

async function fetchTopWorkers(limit = 3): Promise<DeputyDetail[]> {
  const { data, error } = await supabase
    .from('deputy_details')
    .select('*')
    .eq('is_active', true)
    .order('work_score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top workers:', error);
    throw new Error('Erro ao carregar ranking');
  }

  return data || [];
}

export function useTopWorkers(limit = 3) {
  return useQuery({
    queryKey: ['leaderboard', 'top', limit],
    queryFn: () => fetchTopWorkers(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

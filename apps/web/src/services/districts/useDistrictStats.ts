import { useQuery } from '@tanstack/react-query';
import { type DistrictStats, supabase } from '../../lib/supabase';

async function fetchDistrictStats(): Promise<DistrictStats[]> {
  const { data, error } = await supabase
    .from('district_stats')
    .select('*')
    .order('avg_work_score', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching district stats:', error);
    throw new Error('Erro ao carregar estatisticas dos distritos');
  }

  return data || [];
}

export function useDistrictStats() {
  return useQuery({
    queryKey: ['districts', 'stats'],
    queryFn: fetchDistrictStats,
    staleTime: 1000 * 60 * 60, // 1 hour - data syncs daily
  });
}

async function fetchDistrictById(districtId: string): Promise<DistrictStats | null> {
  const { data, error } = await supabase
    .from('district_stats')
    .select('*')
    .eq('id', districtId)
    .single();

  if (error) {
    console.error('Error fetching district:', error);
    return null;
  }

  return data;
}

export function useDistrictById(districtId: string | null) {
  return useQuery({
    queryKey: ['districts', 'detail', districtId],
    queryFn: () => fetchDistrictById(districtId as string),
    enabled: !!districtId,
    staleTime: 1000 * 60 * 5,
  });
}

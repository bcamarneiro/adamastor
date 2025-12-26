import { useQuery } from '@tanstack/react-query';
import { type DeputyDetail, supabase } from '../../lib/supabase';

async function fetchDeputiesByDistrict(districtId: string): Promise<DeputyDetail[]> {
  const { data, error } = await supabase
    .from('deputy_details')
    .select('*')
    .eq('district_id', districtId)
    .eq('is_active', true)
    .order('work_score', { ascending: false });

  if (error) {
    console.error('Error fetching deputies:', error);
    throw new Error('Erro ao carregar deputados');
  }

  return data || [];
}

export function useDeputiesByDistrict(districtId: string | null) {
  return useQuery({
    queryKey: ['deputies', 'district', districtId],
    queryFn: () => fetchDeputiesByDistrict(districtId!),
    enabled: !!districtId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

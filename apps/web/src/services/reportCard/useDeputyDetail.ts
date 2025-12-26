import { useQuery } from '@tanstack/react-query';
import { type DeputyDetail, supabase } from '../../lib/supabase';

async function fetchDeputyById(deputyId: string): Promise<DeputyDetail | null> {
  const { data, error } = await supabase
    .from('deputy_details')
    .select('*')
    .eq('id', deputyId)
    .single();

  if (error) {
    console.error('Error fetching deputy:', error);
    throw new Error('Erro ao carregar deputado');
  }

  return data;
}

export function useDeputyDetail(deputyId: string | null) {
  return useQuery({
    queryKey: ['deputy', deputyId],
    queryFn: () => fetchDeputyById(deputyId!),
    enabled: !!deputyId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

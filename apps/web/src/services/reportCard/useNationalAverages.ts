import { useQuery } from '@tanstack/react-query';
import { type NationalAverages, supabase } from '../../lib/supabase';

async function fetchNationalAverages(): Promise<NationalAverages> {
  const { data, error } = await supabase.rpc('get_national_averages');

  if (error) {
    console.error('Error fetching national averages:', error);
    throw new Error('Erro ao carregar médias nacionais');
  }

  return data as NationalAverages;
}

export function useNationalAverages() {
  return useQuery({
    queryKey: ['nationalAverages'],
    queryFn: fetchNationalAverages,
    staleTime: 1000 * 60 * 30, // 30 minutes - averages don't change often
  });
}

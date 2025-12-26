import { useQuery } from '@tanstack/react-query';
import { type District, supabase } from '../../lib/supabase';

interface DistrictResult {
  district: District | null;
  error: string | null;
}

async function findDistrictByPostal(postalCode: string): Promise<DistrictResult> {
  // Extract the first 4 digits from the postal code
  const postalPrefix = postalCode.replace(/\D/g, '').substring(0, 4);

  if (postalPrefix.length !== 4) {
    return { district: null, error: 'Código postal inválido' };
  }

  // Find district ID by postal prefix using the RPC function
  const { data: districtId, error: rpcError } = await supabase.rpc('find_district_by_postal', {
    postal_code: postalPrefix,
  });

  if (rpcError) {
    console.error('Error finding district:', rpcError);
    return { district: null, error: 'Erro ao procurar distrito' };
  }

  if (!districtId) {
    return { district: null, error: 'Distrito não encontrado para este código postal' };
  }

  // Fetch full district data
  const { data: district, error: fetchError } = await supabase
    .from('districts')
    .select('id, name, slug, postal_prefixes, deputy_count')
    .eq('id', districtId)
    .single();

  if (fetchError || !district) {
    console.error('Error fetching district:', fetchError);
    return { district: null, error: 'Erro ao carregar dados do distrito' };
  }

  return { district: district as District, error: null };
}

export function useDistrictByPostal(postalCode: string | null) {
  return useQuery({
    queryKey: ['district', postalCode],
    queryFn: () => findDistrictByPostal(postalCode!),
    enabled: !!postalCode && postalCode.length >= 4,
    staleTime: 1000 * 60 * 60, // 1 hour - districts don't change
  });
}

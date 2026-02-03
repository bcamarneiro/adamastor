import { useQuery } from '@tanstack/react-query';
import { type District, supabase } from '../../lib/supabase';

interface DistrictResult {
  district: District | null;
  error: string | null;
  ambiguous: boolean;
  alternativeDistrict?: string;
}

/**
 * CP4 codes that span two districts.
 * Key: CP4 prefix, Value: name of the alternative district.
 * The mapped district is the one currently in our database;
 * the alternative is the other one that shares the same CP4.
 */
const AMBIGUOUS_CP4: Record<string, string> = {
  '2100': 'Setúbal', // Santarém (Coruche) / Setúbal (Montijo)
  '2495': 'Santarém', // Leiria (Batalha, Leiria) / Santarém (Ourém)
  '2890': 'Setúbal', // Santarém (Benavente) / Setúbal (Alcochete)
  '2965': 'Évora', // Setúbal (Palmela) / Évora (Vendas Novas)
  '3020': 'Coimbra', // Aveiro (Mealhada) / Coimbra (Coimbra)
  '3640': 'Viseu', // Guarda (Trancoso) / Viseu (Sernancelhe)
  '4615': 'Porto', // Braga (Celorico de Basto) / Porto (Amarante, Felgueiras)
  '4620': 'Porto', // Braga (Vizela) / Porto (Lousada)
  '4815': 'Porto', // Braga (Guimarães, Vizela) / Porto (Felgueiras)
  '4905': 'Viana do Castelo', // Braga (Barcelos) / Viana do Castelo
  '5040': 'Vila Real', // Porto (Baião) / Vila Real (Mesão Frio, Peso da Régua)
  '6250': 'Guarda', // Castelo Branco (Belmonte) / Guarda (Sabugal)
  '6320': 'Guarda', // Castelo Branco (Penamacor) / Guarda (Sabugal)
};

async function findDistrictByPostal(postalCode: string): Promise<DistrictResult> {
  // Extract the first 4 digits from the postal code
  const postalPrefix = postalCode.replace(/\D/g, '').substring(0, 4);

  if (postalPrefix.length !== 4) {
    return { district: null, error: 'Código postal inválido', ambiguous: false };
  }

  // Find district ID by postal prefix using the RPC function
  const { data: districtId, error: rpcError } = await supabase.rpc('find_district_by_postal', {
    postal_code: postalPrefix,
  });

  if (rpcError) {
    console.error('Error finding district:', rpcError);
    return { district: null, error: 'Erro ao procurar distrito', ambiguous: false };
  }

  if (!districtId) {
    return {
      district: null,
      error: 'Distrito não encontrado para este código postal',
      ambiguous: false,
    };
  }

  // Fetch full district data
  const { data: district, error: fetchError } = await supabase
    .from('districts')
    .select('id, name, slug, postal_prefixes, deputy_count')
    .eq('id', districtId)
    .single();

  if (fetchError || !district) {
    console.error('Error fetching district:', fetchError);
    return { district: null, error: 'Erro ao carregar dados do distrito', ambiguous: false };
  }

  const ambiguousAlt = AMBIGUOUS_CP4[postalPrefix];
  const isAmbiguous = !!ambiguousAlt && ambiguousAlt !== (district as District).name;

  return {
    district: district as District,
    error: null,
    ambiguous: isAmbiguous,
    alternativeDistrict: isAmbiguous ? ambiguousAlt : undefined,
  };
}

export function useDistrictByPostal(postalCode: string | null) {
  return useQuery({
    queryKey: ['district', postalCode],
    queryFn: () => findDistrictByPostal(postalCode as string),
    enabled: !!postalCode && postalCode.length >= 4,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - districts don't change
  });
}

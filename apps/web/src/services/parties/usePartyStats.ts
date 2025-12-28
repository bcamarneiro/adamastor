import { useQuery } from '@tanstack/react-query';
import { type PartyStats, supabase } from '../../lib/supabase';

async function fetchPartyStats(): Promise<PartyStats[]> {
  const { data, error } = await supabase
    .from('party_stats')
    .select('*')
    .order('avg_work_score', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching party stats:', error);
    throw new Error('Erro ao carregar estatisticas dos partidos');
  }

  return data || [];
}

export function usePartyStats() {
  return useQuery({
    queryKey: ['parties', 'stats'],
    queryFn: fetchPartyStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

async function fetchPartyById(partyId: string): Promise<PartyStats | null> {
  const { data, error } = await supabase
    .from('party_stats')
    .select('*')
    .eq('id', partyId)
    .single();

  if (error) {
    console.error('Error fetching party:', error);
    return null;
  }

  return data;
}

export function usePartyById(partyId: string | null) {
  return useQuery({
    queryKey: ['parties', 'detail', partyId],
    queryFn: () => fetchPartyById(partyId as string),
    enabled: !!partyId,
    staleTime: 1000 * 60 * 5,
  });
}

import { useQuery } from '@tanstack/react-query';
import { type DeputyDetail, supabase } from '../../lib/supabase';

interface RankingsFilters {
  partyId?: string | null;
  districtId?: string | null;
}

interface PaginatedRankings {
  deputies: DeputyDetail[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function fetchFullRankings(
  page = 1,
  pageSize = 20,
  filters: RankingsFilters = {}
): Promise<PaginatedRankings> {
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('deputy_details')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('work_score', { ascending: false });

  if (filters.partyId) {
    query = query.eq('party_id', filters.partyId);
  }

  if (filters.districtId) {
    query = query.eq('district_id', filters.districtId);
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching rankings:', error);
    throw new Error('Erro ao carregar ranking completo');
  }

  const total = count || 0;

  return {
    deputies: data || [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function useFullRankings(page = 1, pageSize = 20, filters: RankingsFilters = {}) {
  return useQuery({
    queryKey: ['leaderboard', 'full', page, pageSize, filters],
    queryFn: () => fetchFullRankings(page, pageSize, filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
}

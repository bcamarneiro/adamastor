import { supabase } from '@/lib/supabase';
import type { DeputyDetail } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 300;

async function searchDeputies(query: string): Promise<DeputyDetail[]> {
  if (query.length < MIN_SEARCH_LENGTH) return [];

  const { data, error } = await supabase
    .from('deputy_details')
    .select('*')
    .or(`name.ilike.%${query}%,short_name.ilike.%${query}%`)
    .eq('is_active', true)
    .order('work_score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error searching deputies:', error);
    return [];
  }

  return data || [];
}

export function useDeputySearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce the search term
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['deputy-search', debouncedTerm],
    queryFn: () => searchDeputies(debouncedTerm),
    enabled: debouncedTerm.length >= MIN_SEARCH_LENGTH,
    staleTime: 1000 * 60 * 60, // 1 hour - data syncs daily
  });

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    hasMinChars: searchTerm.length >= MIN_SEARCH_LENGTH,
  };
}

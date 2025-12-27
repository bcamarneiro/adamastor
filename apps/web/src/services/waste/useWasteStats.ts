import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { TOTAL_DEPUTIES, YEARLY_SALARY } from './constants';

interface WasteStats {
  totalDeputies: number;
  lowWorkDeputies: number; // Deputies with grade D or F
  avgWorkScore: number;
  lowWorkersPercentage: number;
  totalSalaryWaste: number; // Estimated salary going to low-performers
}

async function fetchWasteStats(): Promise<WasteStats> {
  // Get count of low-performing deputies (grade D or F)
  const { data: lowPerformers, error: lowError } = await supabase
    .from('deputy_details')
    .select('id, work_score, grade')
    .eq('is_active', true)
    .in('grade', ['D', 'F']);

  if (lowError) {
    console.error('Error fetching low performers:', lowError);
    throw new Error('Erro ao calcular desperdicio');
  }

  // Get total active deputies and average work score
  const { data: allDeputies, error: allError } = await supabase
    .from('deputy_details')
    .select('id, work_score')
    .eq('is_active', true);

  if (allError) {
    console.error('Error fetching all deputies:', allError);
    throw new Error('Erro ao calcular desperdicio');
  }

  const totalDeputies = allDeputies?.length || TOTAL_DEPUTIES;
  const lowWorkDeputies = lowPerformers?.length || 0;
  const avgWorkScore =
    allDeputies?.reduce((sum, d) => sum + (d.work_score || 0), 0) / totalDeputies || 0;
  const lowWorkersPercentage = (lowWorkDeputies / totalDeputies) * 100;

  // Calculate estimated salary waste (salary of D/F deputies)
  const totalSalaryWaste = lowWorkDeputies * YEARLY_SALARY;

  return {
    totalDeputies,
    lowWorkDeputies,
    avgWorkScore,
    lowWorkersPercentage,
    totalSalaryWaste,
  };
}

export function useWasteStats() {
  return useQuery({
    queryKey: ['waste', 'stats'],
    queryFn: fetchWasteStats,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

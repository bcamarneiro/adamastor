import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

interface WasteStats {
  totalDeputies: number;
  lowWorkDeputies: number; // Deputies with grade D or F
  avgWorkScore: number;
  lowWorkersPercentage: number;
  totalSalaryWaste: number; // Estimated salary going to low-performers
}

// Constants for calculation
const DEPUTY_MONTHLY_SALARY = 4021; // euros
const MONTHS_PER_YEAR = 14; // 14 salaries in Portugal
const YEARLY_SALARY = DEPUTY_MONTHLY_SALARY * MONTHS_PER_YEAR;
const TOTAL_DEPUTIES = 230;
const PARLIAMENT_BUDGET_SHARE = 0.001; // Parliament represents ~0.1% of state budget (approximate)

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

export { DEPUTY_MONTHLY_SALARY, YEARLY_SALARY, TOTAL_DEPUTIES, PARLIAMENT_BUDGET_SHARE };

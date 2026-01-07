import { useMemo } from 'react';
import type { DistrictStats } from '../../lib/supabase';
import {
  useComparison,
  type MetricConfig,
  type ComparisonMetric,
} from '../../hooks/useComparison';

/**
 * Type alias for backwards compatibility.
 * DistrictComparisonMetric is now the same as the generic ComparisonMetric.
 */
export type DistrictComparisonMetric = ComparisonMetric;

/**
 * Result of comparing two districts across multiple metrics.
 * Preserves backwards compatibility with districtA/districtB naming.
 */
export interface DistrictComparisonResult {
  districtA: DistrictStats;
  districtB: DistrictStats;
  metrics: DistrictComparisonMetric[];
  winsA: number;
  winsB: number;
  ties: number;
  winner: 'A' | 'B' | 'tie';
}

/**
 * Metric configurations for district comparison.
 * Defined outside hook to maintain stable references.
 */
const districtMetricsConfig: MetricConfig<DistrictStats>[] = [
  {
    label: 'Pontuacao Media',
    getValue: (d) => d.avg_work_score,
    higherIsBetter: true,
  },
  {
    label: 'Assiduidade Media',
    getValue: (d) => d.avg_attendance_rate,
    higherIsBetter: true,
  },
  {
    label: 'Deputados Ativos',
    getValue: (d) => d.active_deputies,
    higherIsBetter: true,
  },
];

/**
 * Hook for comparing two districts across multiple metrics.
 *
 * Compares districts on: avg_work_score, avg_attendance_rate, and active_deputies.
 *
 * @param districtA - First district to compare
 * @param districtB - Second district to compare
 * @returns DistrictComparisonResult with metrics, win counts, and overall winner; or null if either district is null
 */
export function useCompareDistricts(
  districtA: DistrictStats | null,
  districtB: DistrictStats | null
): DistrictComparisonResult | null {
  const genericResult = useComparison(districtA, districtB, {
    metrics: districtMetricsConfig,
  });

  // Transform generic result to district-specific format for backwards compatibility
  return useMemo(() => {
    if (!genericResult) return null;

    return {
      districtA: genericResult.entityA,
      districtB: genericResult.entityB,
      metrics: genericResult.metrics,
      winsA: genericResult.winsA,
      winsB: genericResult.winsB,
      ties: genericResult.ties,
      winner: genericResult.winner,
    };
  }, [genericResult]);
}

import { useMemo } from 'react';
import type { DistrictStats } from '../../lib/supabase';
import type { ComparisonMetric } from '@/types/comparison';
import {
  useComparison,
  type MetricConfig,
} from '../../hooks/useComparison';

// Re-export for backward compatibility
export type { ComparisonMetric };

/**
 * Type alias for backward compatibility.
 * DistrictComparisonMetric is identical to the shared ComparisonMetric type.
 * @deprecated Use ComparisonMetric from @/types/comparison instead
 */
export type DistrictComparisonMetric = ComparisonMetric;

/**
 * District-specific comparison result with legacy property names.
 * Preserves backwards compatibility with districtA/districtB naming.
 */
export interface DistrictComparisonResult {
  districtA: DistrictStats;
  districtB: DistrictStats;
  metrics: ComparisonMetric[];
  winsA: number;
  winsB: number;
  ties: number;
  winner: 'A' | 'B' | 'tie';
}

/**
 * Metrics configuration for district comparison.
 * Defines the 3 metrics used to compare districts.
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
 * Compare two districts and determine which performs better.
 *
 * This hook uses the generic useComparison hook internally while maintaining
 * backward compatibility with the original API that uses districtA/districtB
 * property names.
 *
 * Compares districts on: avg_work_score, avg_attendance_rate, and active_deputies.
 *
 * @param districtA - First district to compare (or null)
 * @param districtB - Second district to compare (or null)
 * @returns Comparison result with metrics and winner, or null if either district is null
 *
 * @example
 * const comparison = useCompareDistricts(districtA, districtB);
 * if (comparison) {
 *   console.log(comparison.districtA.name, 'vs', comparison.districtB.name);
 *   console.log('Winner:', comparison.winner);
 * }
 */
export function useCompareDistricts(
  districtA: DistrictStats | null,
  districtB: DistrictStats | null
): DistrictComparisonResult | null {
  const genericResult = useComparison(districtA, districtB, {
    metrics: districtMetricsConfig,
  });

  // Transform generic result to district-specific format for backward compatibility
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
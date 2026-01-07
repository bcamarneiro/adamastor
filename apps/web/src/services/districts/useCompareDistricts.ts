import type { DistrictStats } from '../../lib/supabase';
import {
  createCompareHook,
  type ComparisonMetric,
  type ComparisonResult,
  type MetricConfig,
} from '../compare';

/**
 * Type alias for backward compatibility.
 * DistrictComparisonMetric is identical to the shared ComparisonMetric type.
 */
export type DistrictComparisonMetric = ComparisonMetric;

/**
 * District-specific comparison result with legacy property names.
 * Extends ComparisonResult<DistrictStats> and adds districtA/districtB aliases.
 */
export interface DistrictComparisonResult extends ComparisonResult<DistrictStats> {
  /** Alias for entityA - maintains backward compatibility */
  districtA: DistrictStats;
  /** Alias for entityB - maintains backward compatibility */
  districtB: DistrictStats;
}

/**
 * Metrics configuration for district comparison.
 * Defines the 3 metrics used to compare districts.
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
 * Internal hook created by the factory.
 * Returns the generic ComparisonResult<DistrictStats>.
 */
const useCompareDistrictsBase = createCompareHook<DistrictStats>(districtMetricsConfig);

/**
 * Compare two districts and determine which performs better.
 *
 * This hook uses the createCompareHook factory internally while maintaining
 * backward compatibility with the original API that uses districtA/districtB
 * property names.
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
  const baseResult = useCompareDistrictsBase(districtA, districtB);

  if (!baseResult) return null;

  // Add legacy property names for backward compatibility
  return {
    ...baseResult,
    districtA: baseResult.entityA,
    districtB: baseResult.entityB,
  };
}
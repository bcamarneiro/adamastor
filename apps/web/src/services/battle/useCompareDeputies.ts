import type { DeputyDetail } from '../../lib/supabase';
import {
  createCompareHook,
  type ComparisonMetric,
  type ComparisonResult,
  type MetricConfig,
  type CompareOptions,
} from '../compare';

/**
 * Type alias for backward compatibility.
 * DeputyComparisonMetric is identical to the shared ComparisonMetric type.
 */
export type DeputyComparisonMetric = ComparisonMetric;

/**
 * Deputy-specific comparison result with legacy property names.
 * Extends ComparisonResult<DeputyDetail> and adds deputyA/deputyB aliases.
 * Includes scoreDifference which is always calculated for deputy comparisons.
 */
export interface DeputyComparisonResult extends ComparisonResult<DeputyDetail> {
  /** Alias for entityA - maintains backward compatibility */
  deputyA: DeputyDetail;
  /** Alias for entityB - maintains backward compatibility */
  deputyB: DeputyDetail;
  /** Score difference based on work_score (always present for deputies) */
  scoreDifference: number;
}

/**
 * Metrics configuration for deputy comparison.
 * Defines the 5 metrics used to compare deputies.
 * Note: national_rank uses higherIsBetter: false since lower rank is better.
 */
const deputyMetricsConfig: MetricConfig<DeputyDetail>[] = [
  {
    label: 'Pontuacao Global',
    getValue: (d) => d.work_score,
    higherIsBetter: true,
  },
  {
    label: 'Propostas',
    getValue: (d) => d.proposal_count,
    higherIsBetter: true,
  },
  {
    label: 'Intervencoes',
    getValue: (d) => d.intervention_count,
    higherIsBetter: true,
  },
  {
    label: 'Perguntas',
    getValue: (d) => d.question_count,
    higherIsBetter: true,
  },
  {
    label: 'Ranking Nacional',
    getValue: (d) => d.national_rank,
    higherIsBetter: false, // Lower rank is better
  },
];

/**
 * Options for deputy comparison.
 * Uses work_score as tiebreaker when metric wins are equal.
 * Calculates score difference based on work_score.
 */
const deputyCompareOptions: CompareOptions<DeputyDetail> = {
  tiebreaker: (a, b) => {
    if (a.work_score > b.work_score) return 'A';
    if (b.work_score > a.work_score) return 'B';
    return 'tie';
  },
  scoreDifference: (a, b) => Math.abs(a.work_score - b.work_score),
};

/**
 * Internal hook created by the factory.
 * Returns the generic ComparisonResult<DeputyDetail>.
 */
const useCompareDeputiesBase = createCompareHook<DeputyDetail>(
  deputyMetricsConfig,
  deputyCompareOptions
);

/**
 * Compare two deputies and determine which performs better.
 *
 * This hook uses the createCompareHook factory internally while maintaining
 * backward compatibility with the original API that uses deputyA/deputyB
 * property names.
 *
 * Includes:
 * - 5 comparison metrics (Pontuacao Global, Propostas, Intervencoes, Perguntas, Ranking Nacional)
 * - work_score tiebreaker when metric wins are equal
 * - scoreDifference calculation based on work_score
 *
 * @param deputyA - First deputy to compare (or null)
 * @param deputyB - Second deputy to compare (or null)
 * @returns Comparison result with metrics and winner, or null if either deputy is null
 *
 * @example
 * const comparison = useCompareDeputies(deputyA, deputyB);
 * if (comparison) {
 *   console.log(comparison.deputyA.short_name, 'vs', comparison.deputyB.short_name);
 *   console.log('Winner:', comparison.winner);
 *   console.log('Score difference:', comparison.scoreDifference);
 * }
 */
export function useCompareDeputies(
  deputyA: DeputyDetail | null,
  deputyB: DeputyDetail | null
): DeputyComparisonResult | null {
  const baseResult = useCompareDeputiesBase(deputyA, deputyB);

  if (!baseResult) return null;

  // Add legacy property names for backward compatibility
  // scoreDifference is guaranteed to exist due to deputyCompareOptions
  return {
    ...baseResult,
    deputyA: baseResult.entityA,
    deputyB: baseResult.entityB,
    scoreDifference: baseResult.scoreDifference as number,
  };
}

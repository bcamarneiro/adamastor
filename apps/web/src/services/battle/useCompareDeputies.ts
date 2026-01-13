import { useMemo } from 'react';
import { type ComparisonMetric, type MetricConfig, useComparison } from '../../hooks/useComparison';
import type { DeputyDetail } from '../../lib/supabase';

/**
 * Type alias for backward compatibility.
 * DeputyComparisonMetric is identical to the shared ComparisonMetric type.
 */
export type DeputyComparisonMetric = ComparisonMetric;

/**
 * Result of comparing two deputies across multiple metrics.
 * Preserves backwards compatibility with deputyA/deputyB naming.
 * Includes:
 * - deputyA/deputyB: The two deputies being compared
 * - metrics: Array of comparison metrics with winners determined
 * - winsA/winsB/ties: Count of metrics won by each deputy or tied
 * - winner: Overall winner ('A', 'B', or 'tie')
 * - scoreDifference: Absolute difference in work_score
 */
export interface DeputyComparisonResult {
  deputyA: DeputyDetail;
  deputyB: DeputyDetail;
  metrics: ComparisonMetric[];
  winsA: number;
  winsB: number;
  ties: number;
  winner: 'A' | 'B' | 'tie';
  scoreDifference: number;
}

/**
 * Metric configurations for deputy comparison.
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
 * Tiebreaker function using work_score.
 * Returns 'A' if deputyA has higher work_score, 'B' if deputyB does, 'tie' if equal.
 */
function workScoreTiebreaker(deputyA: DeputyDetail, deputyB: DeputyDetail): 'A' | 'B' | 'tie' {
  if (deputyA.work_score > deputyB.work_score) return 'A';
  if (deputyB.work_score > deputyA.work_score) return 'B';
  return 'tie';
}

/**
 * Extract work_score for scoreDifference calculation.
 */
function getWorkScore(deputy: DeputyDetail): number {
  return deputy.work_score;
}

/**
 * Compare two deputies and determine which performs better.
 *
 * This hook uses the useComparison hook internally while maintaining
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
  const genericResult = useComparison(deputyA, deputyB, {
    metrics: deputyMetricsConfig,
    tiebreaker: workScoreTiebreaker,
    getScore: getWorkScore,
  });

  // Transform generic result to deputy-specific format for backwards compatibility
  return useMemo(() => {
    if (!genericResult) return null;

    return {
      deputyA: genericResult.entityA,
      deputyB: genericResult.entityB,
      metrics: genericResult.metrics,
      winsA: genericResult.winsA,
      winsB: genericResult.winsB,
      ties: genericResult.ties,
      winner: genericResult.winner,
      // scoreDifference is always defined here because we provide getScore
      scoreDifference: genericResult.scoreDifference!,
    };
  }, [genericResult]);
}

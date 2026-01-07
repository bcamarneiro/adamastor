import { useMemo } from 'react';
import type { DeputyDetail } from '../../lib/supabase';
import {
  useComparison,
  type MetricConfig,
  type ComparisonMetric,
} from '../../hooks/useComparison';

/**
 * Result of comparing two deputies across multiple metrics.
 * Preserves backwards compatibility with deputyA/deputyB naming.
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
 * Defined outside hook to maintain stable references.
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
function workScoreTiebreaker(
  deputyA: DeputyDetail,
  deputyB: DeputyDetail
): 'A' | 'B' | 'tie' {
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
 * Hook for comparing two deputies across multiple metrics.
 *
 * Compares deputies on: work_score, proposal_count, intervention_count,
 * question_count, and national_rank (lower is better).
 *
 * Uses work_score as a tiebreaker when the number of metric wins is equal.
 *
 * @param deputyA - First deputy to compare
 * @param deputyB - Second deputy to compare
 * @returns DeputyComparisonResult with metrics, win counts, and overall winner; or null if either deputy is null
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

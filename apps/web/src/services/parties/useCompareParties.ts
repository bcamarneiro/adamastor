import { useMemo } from 'react';
import type { PartyStats } from '../../lib/supabase';
import {
  useComparison,
  type MetricConfig,
  type ComparisonMetric,
} from '../../hooks/useComparison';

/**
 * Type alias for backwards compatibility.
 * PartyComparisonMetric is now the same as the generic ComparisonMetric.
 */
export type PartyComparisonMetric = ComparisonMetric;

/**
 * Result of comparing two parties across multiple metrics.
 * Preserves backwards compatibility with partyA/partyB naming.
 */
export interface PartyComparisonResult {
  partyA: PartyStats;
  partyB: PartyStats;
  metrics: PartyComparisonMetric[];
  winsA: number;
  winsB: number;
  ties: number;
  winner: 'A' | 'B' | 'tie';
}

/**
 * Metric configurations for party comparison.
 * Defined outside hook to maintain stable references.
 */
const partyMetricsConfig: MetricConfig<PartyStats>[] = [
  {
    label: 'Pontuacao Media',
    getValue: (p) => p.avg_work_score,
    higherIsBetter: true,
  },
  {
    label: 'Total de Propostas',
    getValue: (p) => p.total_proposals,
    higherIsBetter: true,
  },
  {
    label: 'Total de Intervencoes',
    getValue: (p) => p.total_interventions,
    higherIsBetter: true,
  },
  {
    label: 'Total de Perguntas',
    getValue: (p) => p.total_questions,
    higherIsBetter: true,
  },
  {
    label: 'Propostas por Deputado',
    getValue: (p) =>
      p.deputy_count > 0 ? (p.total_proposals ?? 0) / p.deputy_count : 0,
    higherIsBetter: true,
  },
];

/**
 * Hook for comparing two political parties across multiple metrics.
 *
 * Compares parties on: avg_work_score, total_proposals, total_interventions,
 * total_questions, and proposals per deputy.
 *
 * @param partyA - First party to compare
 * @param partyB - Second party to compare
 * @returns PartyComparisonResult with metrics, win counts, and overall winner; or null if either party is null
 */
export function useCompareParties(
  partyA: PartyStats | null,
  partyB: PartyStats | null
): PartyComparisonResult | null {
  const genericResult = useComparison(partyA, partyB, {
    metrics: partyMetricsConfig,
  });

  // Transform generic result to party-specific format for backwards compatibility
  return useMemo(() => {
    if (!genericResult) return null;

    return {
      partyA: genericResult.entityA,
      partyB: genericResult.entityB,
      metrics: genericResult.metrics,
      winsA: genericResult.winsA,
      winsB: genericResult.winsB,
      ties: genericResult.ties,
      winner: genericResult.winner,
    };
  }, [genericResult]);
}
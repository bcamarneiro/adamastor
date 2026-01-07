import type { PartyStats } from '../../lib/supabase';
import {
  createCompareHook,
  type ComparisonMetric,
  type ComparisonResult,
  type MetricConfig,
} from '../compare';

/**
 * Type alias for backward compatibility.
 * PartyComparisonMetric is identical to the shared ComparisonMetric type.
 */
export type PartyComparisonMetric = ComparisonMetric;

/**
 * Party-specific comparison result with legacy property names.
 * Extends ComparisonResult<PartyStats> and adds partyA/partyB aliases.
 */
export interface PartyComparisonResult extends ComparisonResult<PartyStats> {
  /** Alias for entityA - maintains backward compatibility */
  partyA: PartyStats;
  /** Alias for entityB - maintains backward compatibility */
  partyB: PartyStats;
}

/**
 * Metrics configuration for party comparison.
 * Defines the 5 metrics used to compare parties, including the derived
 * "Propostas por Deputado" metric.
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
    getValue: (p) => (p.deputy_count > 0 ? (p.total_proposals ?? 0) / p.deputy_count : 0),
    higherIsBetter: true,
  },
];

/**
 * Internal hook created by the factory.
 * Returns the generic ComparisonResult<PartyStats>.
 */
const useComparePartiesBase = createCompareHook<PartyStats>(partyMetricsConfig);

/**
 * Compare two parties and determine which performs better.
 *
 * This hook uses the createCompareHook factory internally while maintaining
 * backward compatibility with the original API that uses partyA/partyB
 * property names.
 *
 * @param partyA - First party to compare (or null)
 * @param partyB - Second party to compare (or null)
 * @returns Comparison result with metrics and winner, or null if either party is null
 *
 * @example
 * const comparison = useCompareParties(partyA, partyB);
 * if (comparison) {
 *   console.log(comparison.partyA.name, 'vs', comparison.partyB.name);
 *   console.log('Winner:', comparison.winner);
 * }
 */
export function useCompareParties(
  partyA: PartyStats | null,
  partyB: PartyStats | null
): PartyComparisonResult | null {
  const baseResult = useComparePartiesBase(partyA, partyB);

  if (!baseResult) return null;

  // Add legacy property names for backward compatibility
  return {
    ...baseResult,
    partyA: baseResult.entityA,
    partyB: baseResult.entityB,
  };
}
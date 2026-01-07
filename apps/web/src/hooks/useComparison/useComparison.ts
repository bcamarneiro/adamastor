import { useMemo } from 'react';
import { compare } from './compare';
import type { ComparisonMetric, ComparisonResult, MetricConfig } from './types';

/**
 * Options for the useComparison hook.
 * @template T The entity type being compared
 */
export interface UseComparisonOptions<T> {
  /** Array of metric configurations for comparison */
  metrics: MetricConfig<T>[];
  /**
   * Optional tiebreaker function called when winsA equals winsB.
   * Should return 'A' if entityA wins, 'B' if entityB wins, or 'tie' if still tied.
   */
  tiebreaker?: (entityA: T, entityB: T) => 'A' | 'B' | 'tie';
  /**
   * Optional function to extract a score for calculating scoreDifference.
   * When provided, the absolute difference between the two scores will be included in the result.
   */
  getScore?: (entity: T) => number;
}

/**
 * Generic hook for comparing two entities across multiple metrics.
 *
 * This hook provides a standardized way to compare entities of any type,
 * calculating metrics, determining winners, and optionally applying tiebreaker logic.
 *
 * @template T The entity type being compared
 * @param entityA - First entity to compare (null returns null result)
 * @param entityB - Second entity to compare (null returns null result)
 * @param options - Configuration options including metrics, tiebreaker, and score extraction
 * @returns ComparisonResult with metrics, win counts, and overall winner; or null if either entity is null
 *
 * @example
 * // Basic usage with metric configs
 * const result = useComparison(partyA, partyB, {
 *   metrics: [
 *     { label: 'Score', getValue: (p) => p.avg_score, higherIsBetter: true },
 *     { label: 'Rank', getValue: (p) => p.rank, higherIsBetter: false },
 *   ],
 * });
 *
 * @example
 * // With tiebreaker and score difference
 * const result = useComparison(deputyA, deputyB, {
 *   metrics: [...],
 *   tiebreaker: (a, b) => {
 *     if (a.work_score > b.work_score) return 'A';
 *     if (b.work_score > a.work_score) return 'B';
 *     return 'tie';
 *   },
 *   getScore: (d) => d.work_score,
 * });
 */
export function useComparison<T>(
  entityA: T | null,
  entityB: T | null,
  options: UseComparisonOptions<T>
): ComparisonResult<T> | null {
  const { metrics: metricsConfig, tiebreaker, getScore } = options;

  return useMemo(() => {
    if (!entityA || !entityB) return null;

    // Calculate metrics using the provided config
    const metrics: ComparisonMetric[] = metricsConfig.map((config) => {
      const valueA = config.getValue(entityA) ?? 0;
      const valueB = config.getValue(entityB) ?? 0;
      const higherIsBetter = config.higherIsBetter ?? true;
      const { winnerA, winnerB, tie } = compare(valueA, valueB, higherIsBetter);

      return {
        label: config.label,
        valueA,
        valueB,
        winnerA,
        winnerB,
        tie,
        higherIsBetter,
      };
    });

    // Count wins and ties
    const winsA = metrics.filter((m) => m.winnerA).length;
    const winsB = metrics.filter((m) => m.winnerB).length;
    const ties = metrics.filter((m) => m.tie).length;

    // Determine overall winner
    let winner: 'A' | 'B' | 'tie';
    if (winsA > winsB) {
      winner = 'A';
    } else if (winsB > winsA) {
      winner = 'B';
    } else {
      // Wins are equal - use tiebreaker if provided, otherwise tie
      winner = tiebreaker ? tiebreaker(entityA, entityB) : 'tie';
    }

    // Calculate score difference if score extractor is provided
    const scoreDifference = getScore
      ? Math.abs(getScore(entityA) - getScore(entityB))
      : undefined;

    return {
      entityA,
      entityB,
      metrics,
      winsA,
      winsB,
      ties,
      winner,
      scoreDifference,
    };
  }, [entityA, entityB, metricsConfig, tiebreaker, getScore]);
}

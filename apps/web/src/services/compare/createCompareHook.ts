import { useMemo } from 'react';
import type { ComparisonMetric, ComparisonResult, MetricConfig, CompareOptions } from './types';
import { compare } from './utils';

/**
 * Factory function that creates a typed comparison hook for any entity type.
 *
 * This eliminates duplication between useCompareDistricts, useCompareParties,
 * and useCompareDeputies by abstracting the common comparison logic.
 *
 * @template T - The entity type being compared (e.g., DeputyDetail, PartyStats, DistrictStats)
 * @param metricsConfig - Array of metric configurations defining how to compare entities
 * @param options - Optional configuration for tiebreakers and score difference calculation
 * @returns A typed hook function that compares two entities
 *
 * @example
 * // Create a comparison hook for deputies
 * const useCompareDeputies = createCompareHook<DeputyDetail>(
 *   [
 *     { label: 'Pontuacao Global', getValue: (d) => d.work_score, higherIsBetter: true },
 *     { label: 'Ranking Nacional', getValue: (d) => d.national_rank, higherIsBetter: false },
 *   ],
 *   {
 *     tiebreaker: (a, b) => a.work_score > b.work_score ? 'A' : b.work_score > a.work_score ? 'B' : 'tie',
 *     scoreDifference: (a, b) => Math.abs(a.work_score - b.work_score),
 *   }
 * );
 *
 * // Use the hook
 * const result = useCompareDeputies(deputyA, deputyB);
 */
export function createCompareHook<T>(
  metricsConfig: MetricConfig<T>[],
  options?: CompareOptions<T>
): (entityA: T | null, entityB: T | null) => ComparisonResult<T> | null {
  return function useCompare(
    entityA: T | null,
    entityB: T | null
  ): ComparisonResult<T> | null {
    return useMemo(() => {
      if (!entityA || !entityB) return null;

      const metrics: ComparisonMetric[] = metricsConfig.map((config) => {
        const valueA = config.getValue(entityA) ?? 0;
        const valueB = config.getValue(entityB) ?? 0;
        const { winnerA, winnerB, tie } = compare(valueA, valueB, config.higherIsBetter);

        return {
          label: config.label,
          valueA,
          valueB,
          winnerA,
          winnerB,
          tie,
          higherIsBetter: config.higherIsBetter,
        };
      });

      const winsA = metrics.filter((m) => m.winnerA).length;
      const winsB = metrics.filter((m) => m.winnerB).length;
      const ties = metrics.filter((m) => m.tie).length;

      // Determine winner based on metric wins
      let winner: 'A' | 'B' | 'tie';
      if (winsA > winsB) {
        winner = 'A';
      } else if (winsB > winsA) {
        winner = 'B';
      } else {
        // Apply tiebreaker if provided, otherwise result is a tie
        winner = options?.tiebreaker?.(entityA, entityB) ?? 'tie';
      }

      // Build result object
      const result: ComparisonResult<T> = {
        entityA,
        entityB,
        metrics,
        winsA,
        winsB,
        ties,
        winner,
      };

      // Add scoreDifference if calculator is provided
      if (options?.scoreDifference) {
        result.scoreDifference = options.scoreDifference(entityA, entityB);
      }

      return result;
    }, [entityA, entityB]);
  };
}

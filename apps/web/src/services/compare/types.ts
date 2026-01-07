/**
 * Generic comparison types for the createCompareHook factory.
 *
 * These types abstract the common patterns found in useCompareDistricts,
 * useCompareParties, and useCompareDeputies into reusable, type-safe generics.
 */

/**
 * Result of comparing two values for a single metric.
 */
export interface ComparisonMetric {
  /** Display label for the metric */
  label: string;
  /** Value for entity A */
  valueA: number;
  /** Value for entity B */
  valueB: number;
  /** Whether entity A wins this metric */
  winnerA: boolean;
  /** Whether entity B wins this metric */
  winnerB: boolean;
  /** Whether this metric is a tie */
  tie: boolean;
  /** Whether higher values are better for this metric */
  higherIsBetter: boolean;
}

/**
 * Complete result of comparing two entities.
 *
 * @template T - The entity type being compared (e.g., DeputyDetail, PartyStats)
 */
export interface ComparisonResult<T> {
  /** First entity in the comparison */
  entityA: T;
  /** Second entity in the comparison */
  entityB: T;
  /** Array of metric comparison results */
  metrics: ComparisonMetric[];
  /** Number of metrics won by entity A */
  winsA: number;
  /** Number of metrics won by entity B */
  winsB: number;
  /** Number of tied metrics */
  ties: number;
  /** Overall winner based on metric wins (and optional tiebreaker) */
  winner: 'A' | 'B' | 'tie';
  /** Optional score difference (when configured via CompareOptions) */
  scoreDifference?: number;
}

/**
 * Configuration for a comparison metric.
 *
 * Used to define how to extract and compare values for a specific metric.
 *
 * @template T - The entity type being compared
 */
export interface MetricConfig<T> {
  /** Display label for the metric */
  label: string;
  /** Function to extract the metric value from an entity */
  getValue: (entity: T) => number | null;
  /** Whether higher values are better (default: true) */
  higherIsBetter: boolean;
}

/**
 * Options for customizing comparison behavior.
 *
 * @template T - The entity type being compared
 */
export interface CompareOptions<T> {
  /**
   * Custom tiebreaker function called when metric wins are equal.
   * Should return the winner based on entity-specific logic.
   */
  tiebreaker?: (entityA: T, entityB: T) => 'A' | 'B' | 'tie';

  /**
   * Function to calculate the score difference between entities.
   * The result will be included in ComparisonResult.scoreDifference.
   */
  scoreDifference?: (entityA: T, entityB: T) => number;
}

/**
 * Result of comparing two values for a single metric.
 * Includes winner flags and tie detection.
 */
export interface ComparisonMetric {
  /** Display label for this metric */
  label: string;
  /** Value for entity A */
  valueA: number;
  /** Value for entity B */
  valueB: number;
  /** True if entity A wins this metric */
  winnerA: boolean;
  /** True if entity B wins this metric */
  winnerB: boolean;
  /** True if values are equal (tie) */
  tie: boolean;
  /** Whether higher values are better for this metric (default: true) */
  higherIsBetter: boolean;
}

/**
 * Configuration for defining a comparison metric.
 * Used to declaratively specify how to extract and compare values from entities.
 * @template T The entity type being compared
 */
export interface MetricConfig<T> {
  /** Display label for this metric */
  label: string;
  /** Function to extract the numeric value from an entity */
  getValue: (entity: T) => number | null;
  /** Whether higher values are better (default: true) */
  higherIsBetter?: boolean;
}

/**
 * Complete result of comparing two entities across multiple metrics.
 * @template T The entity type being compared
 */
export interface ComparisonResult<T> {
  /** First entity being compared */
  entityA: T;
  /** Second entity being compared */
  entityB: T;
  /** Array of individual metric comparison results */
  metrics: ComparisonMetric[];
  /** Number of metrics where entity A wins */
  winsA: number;
  /** Number of metrics where entity B wins */
  winsB: number;
  /** Number of metrics that are tied */
  ties: number;
  /** Overall winner: 'A', 'B', or 'tie' */
  winner: 'A' | 'B' | 'tie';
  /** Optional numeric score difference (e.g., for work_score) */
  scoreDifference?: number;
}

/**
 * Shared comparison metric interface used by district and party comparison components.
 * Represents a single metric being compared between two entities (A vs B).
 */
export interface ComparisonMetric {
  label: string;
  valueA: number;
  valueB: number;
  winnerA: boolean;
  winnerB: boolean;
  tie: boolean;
  higherIsBetter: boolean;
}

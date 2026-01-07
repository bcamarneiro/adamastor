/**
 * Utility functions for entity comparisons.
 */

/**
 * Result of comparing two values.
 */
export interface CompareResult {
  /** Whether value A wins the comparison */
  winnerA: boolean;
  /** Whether value B wins the comparison */
  winnerB: boolean;
  /** Whether the values are tied */
  tie: boolean;
}

/**
 * Compares two numeric values and determines a winner.
 *
 * Null values are treated as 0 for comparison purposes.
 *
 * @param a - First value to compare (null treated as 0)
 * @param b - Second value to compare (null treated as 0)
 * @param higherIsBetter - If true, higher value wins; if false, lower value wins (default: true)
 * @returns Object indicating which value won or if it's a tie
 *
 * @example
 * // Higher is better (default)
 * compare(10, 5) // { winnerA: true, winnerB: false, tie: false }
 * compare(5, 10) // { winnerA: false, winnerB: true, tie: false }
 * compare(5, 5)  // { winnerA: false, winnerB: false, tie: true }
 *
 * @example
 * // Lower is better (e.g., rankings)
 * compare(1, 5, false) // { winnerA: true, winnerB: false, tie: false }
 * compare(5, 1, false) // { winnerA: false, winnerB: true, tie: false }
 *
 * @example
 * // Null handling
 * compare(null, 5)  // { winnerA: false, winnerB: true, tie: false }
 * compare(null, null) // { winnerA: false, winnerB: false, tie: true }
 */
export function compare(
  a: number | null,
  b: number | null,
  higherIsBetter = true
): CompareResult {
  const valA = a ?? 0;
  const valB = b ?? 0;

  if (valA === valB) {
    return { winnerA: false, winnerB: false, tie: true };
  }

  const aWins = higherIsBetter ? valA > valB : valA < valB;
  return {
    winnerA: aWins,
    winnerB: !aWins,
    tie: false,
  };
}

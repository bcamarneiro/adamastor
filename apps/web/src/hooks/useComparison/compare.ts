/**
 * Result of comparing two values.
 * Contains flags indicating which value wins or if there's a tie.
 */
export interface CompareResult {
  /** True if value A wins the comparison */
  winnerA: boolean;
  /** True if value B wins the comparison */
  winnerB: boolean;
  /** True if both values are equal (tie) */
  tie: boolean;
}

/**
 * Compares two numeric values and determines a winner.
 *
 * @param a - First value to compare (null is treated as 0)
 * @param b - Second value to compare (null is treated as 0)
 * @param higherIsBetter - When true, higher values win; when false, lower values win (default: true)
 * @returns Object with winnerA, winnerB, and tie boolean flags
 *
 * @example
 * // Higher value wins (default)
 * compare(10, 5) // { winnerA: true, winnerB: false, tie: false }
 *
 * @example
 * // Lower value wins (e.g., for rankings)
 * compare(1, 5, false) // { winnerA: true, winnerB: false, tie: false }
 *
 * @example
 * // Tie detection
 * compare(5, 5) // { winnerA: false, winnerB: false, tie: true }
 *
 * @example
 * // Null handling (null treated as 0)
 * compare(null, 5) // { winnerA: false, winnerB: true, tie: false }
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

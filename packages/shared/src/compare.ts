// Compare utility for determining winners between two values

/**
 * Result of comparing two values
 */
export interface CompareResult {
  winnerA: boolean;
  winnerB: boolean;
  tie: boolean;
}

/**
 * Compare two nullable numbers and determine the winner.
 *
 * @param a - First value to compare (null treated as 0)
 * @param b - Second value to compare (null treated as 0)
 * @param higherIsBetter - If true, higher value wins; if false, lower value wins
 * @returns CompareResult indicating which value won or if it's a tie
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

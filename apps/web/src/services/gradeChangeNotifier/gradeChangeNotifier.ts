import { scoreToGrade } from 'shared';
import type { GradeChange, GradeChangeAlert, GradeDirection, WatchConfig } from './types';
import { GRADE_ORDER } from './types';

/**
 * Detects whether a grade change has occurred between old and new work scores.
 *
 * Returns a {@link GradeChange} describing the shift, or `null` if the
 * grade stayed the same.
 *
 * @example
 * detectGradeChange(92, 88)
 * // → { oldGrade: 'A', newGrade: 'B', direction: 'down' }
 *
 * detectGradeChange(55, 72)
 * // → { oldGrade: 'C', newGrade: 'B', direction: 'up' }
 *
 * detectGradeChange(80, 82)
 * // → null  (both are 'B')
 */
export function detectGradeChange(oldScore: number, newScore: number): GradeChange | null {
  const oldGrade = scoreToGrade(oldScore);
  const newGrade = scoreToGrade(newScore);

  if (oldGrade === newGrade) {
    return null;
  }

  const direction: GradeDirection = GRADE_ORDER[newGrade] > GRADE_ORDER[oldGrade] ? 'up' : 'down';

  return { oldGrade, newGrade, direction };
}

/**
 * Creates a {@link GradeChangeAlert} payload for a single deputy.
 *
 * @param deputyId - The deputy's unique identifier.
 * @param deputyName - The deputy's display name.
 * @param change - The grade change detected by {@link detectGradeChange}.
 */
export function createGradeChangeAlert(
  deputyId: string,
  deputyName: string,
  change: GradeChange
): GradeChangeAlert {
  return {
    id: `gca-${deputyId}-${Date.now()}`,
    deputyId,
    deputyName,
    change,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Computes grade change alerts for all watched deputies given their old and
 * new work scores.
 *
 * @param oldScores - Map of deputy id → previous work score.
 * @param newScores - Map of deputy id → current work score.
 * @param deputyNames - Map of deputy id → display name.
 * @param config - Watch configuration (which deputies to monitor).
 * @returns An array of {@link GradeChangeAlert} for deputies whose grade changed.
 */
export function computeAlerts(
  oldScores: Record<string, number>,
  newScores: Record<string, number>,
  deputyNames: Record<string, string>,
  config: WatchConfig
): GradeChangeAlert[] {
  const alerts: GradeChangeAlert[] = [];

  for (const deputyId of config.deputyIds) {
    const oldScore = oldScores[deputyId];
    const newScore = newScores[deputyId];
    const name = deputyNames[deputyId];

    if (oldScore === undefined || newScore === undefined || !name) {
      continue;
    }

    const change = detectGradeChange(oldScore, newScore);
    if (change) {
      alerts.push(createGradeChangeAlert(deputyId, name, change));
    }
  }

  return alerts;
}

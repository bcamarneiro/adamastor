/**
 * Order mapping for grade comparison (higher index = better grade).
 */
export const GRADE_ORDER: Record<string, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
};

/**
 * The direction of a grade change.
 */
export type GradeDirection = 'up' | 'down';

/**
 * Describes a detected grade change for a single deputy.
 */
export interface GradeChange {
  /** The previous grade (before the change) */
  oldGrade: string;
  /** The new grade (after the change) */
  newGrade: string;
  /** Whether the deputy improved ('up') or declined ('down') */
  direction: GradeDirection;
}

/**
 * Alert payload produced when a watched deputy's grade changes.
 */
export interface GradeChangeAlert {
  /** Unique id for this alert */
  id: string;
  /** The deputy this alert is about */
  deputyId: string;
  /** Human-readable deputy name */
  deputyName: string;
  /** The grade change details */
  change: GradeChange;
  /** Timestamp when the alert was generated (ISO-8601) */
  timestamp: string;
}

/**
 * Configuration for which deputies are being watched.
 */
export interface WatchConfig {
  deputyIds: string[];
}

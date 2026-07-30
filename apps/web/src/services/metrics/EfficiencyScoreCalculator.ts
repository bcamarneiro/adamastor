/**
 * Legislative Efficiency Score Calculator
 *
 * Distinguishes between parliamentary "activity" (what deputies do) and
 * "output" (what deputies achieve). The efficiency score measures how much
 * legislative result a deputy produces per unit of activity.
 *
 * ## Concepts
 *
 * **Activity** = raw input volume: proposals submitted, interventions made,
 *   questions asked, attendance
 *
 * **Output** = legislative results: votes cast (decision-making participation),
 *   consistent plenary attendance (being present when it matters)
 *
 * ## Formula
 *
 *   ActivityScore = normalized average of all activity metrics (0–100)
 *   OutputScore   = weighted output metrics (0–100)
 *   Efficiency    = OutputScore / max(ActivityScore, 1) — ratio of output to input
 *   FinalScore    = clamp(Efficiency * 50, 0, 100)
 *
 * A score of 50 means output matches activity (1:1). Above 50 means the deputy
 * achieves more output relative to activity. Below 50 means activity exceeds
 * results — high motion, low impact.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw activity metrics — what a deputy *does* (input). */
export interface ActivityMetrics {
  /** Percentage of plenary sessions attended (0–100). */
  attendanceRate: number;
  /** Number of legislative proposals authored or co-authored. */
  proposalsSubmitted: number;
  /** Number of parliamentary interventions (speeches, debates). */
  interventionsMade: number;
  /** Number of written questions submitted to the government. */
  questionsAsked: number;
}

/** Output metrics — what a deputy *achieves* (results). */
export interface OutputMetrics {
  /** Votes actually cast out of total possible votes. */
  votesCast: number;
  /** Total votes the deputy could have participated in. */
  totalVotes: number;
  /** Number of plenary sessions attended. */
  sessionsAttended: number;
  /** Total plenary sessions held. */
  totalSessions: number;
}

/** Weights for activity components (must sum to 1.0). */
export const ACTIVITY_WEIGHTS = {
  attendance: 0.3,
  proposals: 0.3,
  interventions: 0.25,
  questions: 0.15,
} as const;

/** Weights for output components (must sum to 1.0). */
export const OUTPUT_WEIGHTS = {
  voteParticipation: 0.5,
  sessionAttendance: 0.5,
} as const;

/** Human-readable labels keyed by efficiency score band. */
export const EFFICIENCY_LABELS = {
  exceptional: 'Excecional',
  high: 'Elevada',
  moderate: 'Moderada',
  low: 'Baixa',
  minimal: 'Mínima',
} as const;

/** Grade thresholds for the efficiency score. */
export const EFFICIENCY_THRESHOLDS = {
  A: 75,
  B: 60,
  C: 45,
  D: 30,
  F: 0,
} as const;

export type EfficiencyGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface EfficiencyScore {
  /** Computed activity score (0–100). */
  activityScore: number;
  /** Computed output score (0–100). */
  outputScore: number;
  /** Output-to-activity ratio (0–2+). */
  efficiencyRatio: number;
  /** Final efficiency score (0–100). */
  efficiencyScore: number;
  /** Letter grade derived from the efficiency score. */
  grade: EfficiencyGrade;
  /** Human-readable label for the score band. */
  label: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a raw count to a 0–1 scale using a baseline average.
 *
 * A deputy at the baseline gets ~0.5. Twice the baseline → 1.0.
 * Zero counts → 0. This prevents outlier deputies from skewing
 * the score too heavily.
 */
function normalizeCount(value: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return Math.min(value / (baseline * 2), 1);
}

/**
 * Compute the aggregate activity score (0–100).
 *
 * Each metric is normalised so the deputy-level average maps to 50,
 * individual metrics are then weighted and summed.
 */
function computeActivityScore(metrics: ActivityMetrics): number {
  // Normalize counts: use a baseline where "average" is ~50 points.
  // These baselines represent a typical active deputy in the Portuguese
  // Parliament over one legislative session.
  const normProposals = normalizeCount(
    metrics.proposalsSubmitted,
    10 // baseline average proposals
  );
  const normInterventions = normalizeCount(
    metrics.interventionsMade,
    25 // baseline average interventions
  );
  const normQuestions = normalizeCount(
    metrics.questionsAsked,
    8 // baseline average questions
  );

  return (
    metrics.attendanceRate * ACTIVITY_WEIGHTS.attendance +
    normProposals * ACTIVITY_WEIGHTS.proposals * 100 +
    normInterventions * ACTIVITY_WEIGHTS.interventions * 100 +
    normQuestions * ACTIVITY_WEIGHTS.questions * 100
  );
}

/**
 * Compute the aggregate output score (0–100).
 */
function computeOutputScore(metrics: OutputMetrics): number {
  // Vote participation rate (0–100)
  const voteParticipation =
    metrics.totalVotes > 0 ? (metrics.votesCast / metrics.totalVotes) * 100 : 0;

  // Session attendance rate (0–100)
  const sessionAttendance =
    metrics.totalSessions > 0 ? (metrics.sessionsAttended / metrics.totalSessions) * 100 : 0;

  return (
    voteParticipation * OUTPUT_WEIGHTS.voteParticipation +
    sessionAttendance * OUTPUT_WEIGHTS.sessionAttendance
  );
}

/** Map a 0–100 score to a letter grade. */
export function scoreToGrade(score: number): EfficiencyGrade {
  if (score >= EFFICIENCY_THRESHOLDS.A) return 'A';
  if (score >= EFFICIENCY_THRESHOLDS.B) return 'B';
  if (score >= EFFICIENCY_THRESHOLDS.C) return 'C';
  if (score >= EFFICIENCY_THRESHOLDS.D) return 'D';
  return 'F';
}

/** Map a 0–100 score to a Portuguese-language label. */
export function scoreToLabel(score: number): string {
  if (score >= 75) return EFFICIENCY_LABELS.exceptional;
  if (score >= 60) return EFFICIENCY_LABELS.high;
  if (score >= 45) return EFFICIENCY_LABELS.moderate;
  if (score >= 30) return EFFICIENCY_LABELS.low;
  return EFFICIENCY_LABELS.minimal;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute the full efficiency score from raw activity + output data.
 *
 * All numeric inputs must be non-negative. The calculator handles zero
 * activity gracefully (returns 0 efficiency).
 */
export function calculateEfficiencyScore(
  activity: ActivityMetrics,
  output: OutputMetrics
): EfficiencyScore {
  const activityScore = computeActivityScore(activity);
  const outputScore = computeOutputScore(output);
  const efficiencyRatio = activityScore > 0 ? outputScore / activityScore : 0;

  // Scale so that ratio 1.0 maps to 50 (balanced), max 2.0 → 100
  const efficiencyScore = Math.min(Math.round(efficiencyRatio * 50), 100);

  return {
    activityScore: Math.round(activityScore),
    outputScore: Math.round(outputScore),
    efficiencyRatio: Math.round(efficiencyRatio * 100) / 100,
    efficiencyScore,
    grade: scoreToGrade(efficiencyScore),
    label: scoreToLabel(efficiencyScore),
  };
}

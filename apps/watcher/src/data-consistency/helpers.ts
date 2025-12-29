/**
 * Data consistency helper functions
 * These mirror the PostgreSQL functions for testing
 */

/**
 * Convert work score to grade
 * A >= 85, B >= 70, C >= 55, D >= 40, F < 40
 */
export function scoreToGrade(score: number | null): string {
  if (score === null) return 'F';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Calculate work score using the same formula as PostgreSQL
 * Formula: attendance (40%) + proposals (30%) + interventions (20%) + questions (10%)
 * Individual components capped at 200% to prevent outliers
 */
export function calculateWorkScore(
  attendance: number,
  proposals: number,
  avgProposals: number,
  interventions: number,
  avgInterventions: number,
  questions: number,
  avgQuestions: number
): number {
  const attendanceComponent = (attendance ?? 0) * 0.4;

  const proposalRatio = avgProposals > 0 ? (proposals / avgProposals) * 100 : 0;
  const proposalComponent = Math.min(proposalRatio, 200) * 0.3;

  const interventionRatio = avgInterventions > 0 ? (interventions / avgInterventions) * 100 : 0;
  const interventionComponent = Math.min(interventionRatio, 200) * 0.2;

  const questionRatio = avgQuestions > 0 ? (questions / avgQuestions) * 100 : 0;
  const questionComponent = Math.min(questionRatio, 200) * 0.1;

  const total = attendanceComponent + proposalComponent + interventionComponent + questionComponent;
  return Math.round(total * 100) / 100;
}

/**
 * Grade thresholds for reference
 */
export const GRADE_THRESHOLDS = {
  A: 85,
  B: 70,
  C: 55,
  D: 40,
  F: 0,
} as const;

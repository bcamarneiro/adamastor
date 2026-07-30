import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_WEIGHTS,
  EFFICIENCY_LABELS,
  OUTPUT_WEIGHTS,
  calculateEfficiencyScore,
  scoreToGrade,
  scoreToLabel,
} from './EfficiencyScoreCalculator';
import type { ActivityMetrics, OutputMetrics } from './EfficiencyScoreCalculator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A typical active deputy — attends most sessions, moderate activity. */
const typicalActivity: ActivityMetrics = {
  attendanceRate: 85,
  proposalsSubmitted: 12,
  interventionsMade: 30,
  questionsAsked: 10,
};

/** Typical output — good vote participation, decent attendance record. */
const typicalOutput: OutputMetrics = {
  votesCast: 450,
  totalVotes: 500,
  sessionsAttended: 40,
  totalSessions: 50,
};

// ---------------------------------------------------------------------------
// Activity vs Output distinction
// ---------------------------------------------------------------------------

describe('EfficiencyScoreCalculator — activity vs output distinction', () => {
  it('should assign a lower efficiency score when activity is high but output is low', () => {
    const busyButIneffective = calculateEfficiencyScore(
      {
        attendanceRate: 95,
        proposalsSubmitted: 100,
        interventionsMade: 80,
        questionsAsked: 50,
      },
      {
        votesCast: 50,
        totalVotes: 500,
        sessionsAttended: 10,
        totalSessions: 50,
      }
    );

    // High activity, low output → efficiency should be low
    expect(busyButIneffective.activityScore).toBeGreaterThan(70);
    expect(busyButIneffective.outputScore).toBeLessThan(20);
    expect(busyButIneffective.efficiencyRatio).toBeLessThan(0.3);
    expect(busyButIneffective.efficiencyScore).toBeLessThan(20);
  });

  it('should assign a higher efficiency score when output matches or exceeds activity norm', () => {
    const effective = calculateEfficiencyScore(
      {
        attendanceRate: 80,
        proposalsSubmitted: 8,
        interventionsMade: 20,
        questionsAsked: 5,
      },
      {
        votesCast: 490,
        totalVotes: 500,
        sessionsAttended: 48,
        totalSessions: 50,
      }
    );

    // Moderate activity, high output → efficiency should be high
    expect(effective.activityScore).toBeLessThan(80);
    expect(effective.outputScore).toBeGreaterThan(80);
    expect(effective.efficiencyRatio).toBeGreaterThan(1);
    expect(effective.efficiencyScore).toBeGreaterThan(50);
  });

  it('should distinguish a "talker" (high interventions) from a "doer" (high vote participation)', () => {
    const talker = calculateEfficiencyScore(
      {
        attendanceRate: 70,
        proposalsSubmitted: 5,
        interventionsMade: 200, // speaks a lot
        questionsAsked: 3,
      },
      {
        votesCast: 100,
        totalVotes: 500,
        sessionsAttended: 20,
        totalSessions: 50,
      }
    );

    const doer = calculateEfficiencyScore(
      {
        attendanceRate: 90,
        proposalsSubmitted: 15,
        interventionsMade: 20, // speaks less
        questionsAsked: 8,
      },
      {
        votesCast: 495,
        totalVotes: 500,
        sessionsAttended: 49,
        totalSessions: 50,
      }
    );

    // The "doer" should have a higher efficiency score than the "talker"
    expect(doer.efficiencyScore).toBeGreaterThan(talker.efficiencyScore);
    // Talker's activity can be high (interventions count) but output is low
    expect(talker.outputScore).toBeLessThan(doer.outputScore);
  });
});

// ---------------------------------------------------------------------------
// Core calculator
// ---------------------------------------------------------------------------

describe('calculateEfficiencyScore', () => {
  it('should return a complete EfficiencyScore for typical input', () => {
    const result = calculateEfficiencyScore(typicalActivity, typicalOutput);

    expect(result).toHaveProperty('activityScore');
    expect(result).toHaveProperty('outputScore');
    expect(result).toHaveProperty('efficiencyRatio');
    expect(result).toHaveProperty('efficiencyScore');
    expect(result).toHaveProperty('grade');
    expect(result).toHaveProperty('label');

    // All scores should be within 0–100
    expect(result.activityScore).toBeGreaterThanOrEqual(0);
    expect(result.activityScore).toBeLessThanOrEqual(100);
    expect(result.outputScore).toBeGreaterThanOrEqual(0);
    expect(result.outputScore).toBeLessThanOrEqual(100);
    expect(result.efficiencyScore).toBeGreaterThanOrEqual(0);
    expect(result.efficiencyScore).toBeLessThanOrEqual(100);
  });

  it('should handle a perfectly balanced deputy (output ≈ activity)', () => {
    // Create input where output score ≈ activity score
    const result = calculateEfficiencyScore(
      {
        attendanceRate: 85,
        proposalsSubmitted: 10,
        interventionsMade: 25,
        questionsAsked: 8,
      },
      {
        votesCast: 450,
        totalVotes: 500, // 90%
        sessionsAttended: 45,
        totalSessions: 50, // 90%
      }
    );

    // With 90% output and ~balanced activity, ratio should be around 0.90–1.10
    expect(result.efficiencyRatio).toBeGreaterThan(0.8);
    expect(result.efficiencyRatio).toBeLessThan(1.5);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('calculateEfficiencyScore — edge cases', () => {
  it('should return zero efficiency when all metrics are zero', () => {
    const result = calculateEfficiencyScore(
      {
        attendanceRate: 0,
        proposalsSubmitted: 0,
        interventionsMade: 0,
        questionsAsked: 0,
      },
      {
        votesCast: 0,
        totalVotes: 0,
        sessionsAttended: 0,
        totalSessions: 0,
      }
    );

    expect(result.activityScore).toBe(0);
    expect(result.outputScore).toBe(0);
    expect(result.efficiencyRatio).toBe(0);
    expect(result.efficiencyScore).toBe(0);
    expect(result.grade).toBe('F');
    expect(result.label).toBe(EFFICIENCY_LABELS.minimal);
  });

  it('should handle zero total votes gracefully (no division by zero)', () => {
    const result = calculateEfficiencyScore(typicalActivity, {
      votesCast: 0,
      totalVotes: 0,
      sessionsAttended: 0,
      totalSessions: 0,
    });

    expect(result.outputScore).toBe(0);
    expect(result.efficiencyRatio).toBe(0);
    expect(result.efficiencyScore).toBe(0);
  });

  it('should handle zero total sessions gracefully', () => {
    const result = calculateEfficiencyScore(typicalActivity, {
      votesCast: 100,
      totalVotes: 200,
      sessionsAttended: 0,
      totalSessions: 0,
    });

    // Vote participation contributes 50% of output, session attendance 0%
    expect(result.outputScore).toBe(25); // (100/200 * 100) * 0.5 = 25
  });

  it('should cap efficiency score at 100', () => {
    const result = calculateEfficiencyScore(
      {
        attendanceRate: 10,
        proposalsSubmitted: 0,
        interventionsMade: 0,
        questionsAsked: 0,
      },
      {
        votesCast: 500,
        totalVotes: 500,
        sessionsAttended: 50,
        totalSessions: 50,
      }
    );

    expect(result.efficiencyScore).toBeLessThanOrEqual(100);
  });

  it('should handle very large numbers without overflow', () => {
    const result = calculateEfficiencyScore(
      {
        attendanceRate: 100,
        proposalsSubmitted: 10_000,
        interventionsMade: 10_000,
        questionsAsked: 10_000,
      },
      {
        votesCast: 1_000_000,
        totalVotes: 1_000_000,
        sessionsAttended: 1_000,
        totalSessions: 1_000,
      }
    );

    expect(result.efficiencyScore).toBeGreaterThanOrEqual(0);
    expect(result.efficiencyScore).toBeLessThanOrEqual(100);
  });

  it('should not produce NaN for any valid input', () => {
    const result = calculateEfficiencyScore(
      { attendanceRate: 50, proposalsSubmitted: 5, interventionsMade: 10, questionsAsked: 3 },
      { votesCast: 250, totalVotes: 500, sessionsAttended: 25, totalSessions: 50 }
    );

    expect(Number.isNaN(result.activityScore)).toBe(false);
    expect(Number.isNaN(result.outputScore)).toBe(false);
    expect(Number.isNaN(result.efficiencyRatio)).toBe(false);
    expect(Number.isNaN(result.efficiencyScore)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Weight constants
// ---------------------------------------------------------------------------

describe('weight constants', () => {
  it('should have activity weights that sum to 1.0', () => {
    const sum =
      ACTIVITY_WEIGHTS.attendance +
      ACTIVITY_WEIGHTS.proposals +
      ACTIVITY_WEIGHTS.interventions +
      ACTIVITY_WEIGHTS.questions;
    expect(sum).toBeCloseTo(1.0);
  });

  it('should have output weights that sum to 1.0', () => {
    const sum = OUTPUT_WEIGHTS.voteParticipation + OUTPUT_WEIGHTS.sessionAttendance;
    expect(sum).toBeCloseTo(1.0);
  });
});

// ---------------------------------------------------------------------------
// Grade classification
// ---------------------------------------------------------------------------

describe('scoreToGrade', () => {
  it('should return A for scores at or above the A threshold', () => {
    expect(scoreToGrade(75)).toBe('A');
    expect(scoreToGrade(100)).toBe('A');
  });

  it('should return B for scores between B and A thresholds', () => {
    expect(scoreToGrade(60)).toBe('B');
    expect(scoreToGrade(74)).toBe('B');
  });

  it('should return C for scores between C and B thresholds', () => {
    expect(scoreToGrade(45)).toBe('C');
    expect(scoreToGrade(59)).toBe('C');
  });

  it('should return D for scores between D and C thresholds', () => {
    expect(scoreToGrade(30)).toBe('D');
    expect(scoreToGrade(44)).toBe('D');
  });

  it('should return F for scores below the D threshold', () => {
    expect(scoreToGrade(0)).toBe('F');
    expect(scoreToGrade(29)).toBe('F');
  });
});

// ---------------------------------------------------------------------------
// Label classification
// ---------------------------------------------------------------------------

describe('scoreToLabel', () => {
  it('should return Portuguese labels for each band', () => {
    expect(scoreToLabel(90)).toBe(EFFICIENCY_LABELS.exceptional);
    expect(scoreToLabel(70)).toBe(EFFICIENCY_LABELS.high);
    expect(scoreToLabel(55)).toBe(EFFICIENCY_LABELS.moderate);
    expect(scoreToLabel(40)).toBe(EFFICIENCY_LABELS.low);
    expect(scoreToLabel(10)).toBe(EFFICIENCY_LABELS.minimal);
  });
});

// ---------------------------------------------------------------------------
// Activity score decomposition
// ---------------------------------------------------------------------------

describe('EfficiencyScore — activity score components', () => {
  it('should weight attendance at 30%', () => {
    const perfectAttendance = calculateEfficiencyScore(
      { ...typicalActivity, attendanceRate: 100 },
      typicalOutput
    );
    const noAttendance = calculateEfficiencyScore(
      { ...typicalActivity, attendanceRate: 0 },
      typicalOutput
    );

    // 100% attendance contributes 30 raw points (100 * 0.30)
    const diff = perfectAttendance.activityScore - noAttendance.activityScore;
    expect(diff).toBeCloseTo(30, -1); // ~30, allowing rounding
    expect(perfectAttendance.activityScore).toBeGreaterThan(noAttendance.activityScore);
  });

  it('should weight proposals at 30% (normalized)', () => {
    const manyProposals = calculateEfficiencyScore(
      { ...typicalActivity, proposalsSubmitted: 20 }, // 2× baseline → 1.0 norm → 30 pts
      typicalOutput
    );
    const noProposals = calculateEfficiencyScore(
      { ...typicalActivity, proposalsSubmitted: 0 },
      typicalOutput
    );

    expect(manyProposals.activityScore).toBeGreaterThan(noProposals.activityScore);
  });
});

// ---------------------------------------------------------------------------
// Integration scenario: dashboard API shape
// ---------------------------------------------------------------------------

describe('calculateEfficiencyScore — dashboard API integration', () => {
  it('should produce a score object with all required fields for the transparency dashboard', () => {
    const score = calculateEfficiencyScore(typicalActivity, typicalOutput);

    // Fields expected by the dashboard API consumer
    expect(typeof score.activityScore).toBe('number');
    expect(typeof score.outputScore).toBe('number');
    expect(typeof score.efficiencyRatio).toBe('number');
    expect(typeof score.efficiencyScore).toBe('number');
    expect(['A', 'B', 'C', 'D', 'F']).toContain(score.grade);
    expect(typeof score.label).toBe('string');
    expect(score.label.length).toBeGreaterThan(0);
  });

  it('should compute distinct activity and output scores for the same deputy', () => {
    const score = calculateEfficiencyScore(typicalActivity, typicalOutput);

    // Activity and output are separate, independently computable dimensions
    expect(score.activityScore).not.toBe(score.outputScore);
  });
});

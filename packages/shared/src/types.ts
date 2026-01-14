// Core entity types - shared between watcher and web

// ===================
// LEGISLATURE CONFIGURATION
// ===================
// Current Portuguese Parliament legislature
// Update this when a new legislature begins

/** Current legislature number (XVII = 17, started June 2025) */
export const CURRENT_LEGISLATURE = 17;

/** Roman numeral representation for display */
export const CURRENT_LEGISLATURE_ROMAN = 'XVII';

/** Legislature display label */
export const CURRENT_LEGISLATURE_LABEL = `${CURRENT_LEGISLATURE_ROMAN} Legislatura`;

/** Constitutional number of deputies in Portuguese Parliament */
export const TOTAL_DEPUTIES = 230;

/**
 * Convert legislature number to Roman numeral
 */
export function legislatureToRoman(legislature: number): string {
  const romanNumerals: Record<number, string> = {
    14: 'XIV',
    15: 'XV',
    16: 'XVI',
    17: 'XVII',
    18: 'XVIII',
    19: 'XIX',
    20: 'XX',
  };
  return romanNumerals[legislature] || legislature.toString();
}

// ===================
// ENTITY TYPES
// ===================

export interface Party {
  id: string;
  externalId: string;
  acronym: string;
  name: string;
  color?: string;
}

export interface District {
  id: string;
  name: string;
  postalPrefixes: string[];
  deputyCount?: number;
}

export interface Deputy {
  id: string;
  externalId: string;
  name: string;
  shortName?: string;
  partyId: string;
  districtId: string;
  photoUrl?: string;
  mandateStart?: string;
  mandateEnd?: string;
  isActive: boolean;
  legislature: number;
}

export interface DeputyStats {
  deputyId: string;
  totalSessions: number;
  sessionsAttended: number;
  totalVotes: number;
  votesCast: number;
  proposalCount: number;
  interventionCount: number;
  questionCount: number;
  attendanceRate: number;
  workScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  districtRank?: number;
  nationalRank?: number;
  calculatedAt: string;
}

export interface Initiative {
  id: string;
  externalId: string;
  title: string;
  type?: string;
  typeDesc?: string;
  status?: string;
  submittedAt?: string;
  legislature: number;
}

export interface Vote {
  id: string;
  sessionId: string;
  deputyId: string;
  initiativeId?: string;
  vote: 'favor' | 'contra' | 'abstencao' | 'ausente';
  votedAt?: string;
}

export interface Intervention {
  id: string;
  externalId?: string;
  deputyId: string;
  sessionId?: string;
  date: string;
  type?: string;
}

// Work Score calculation weights
export const WORK_SCORE_WEIGHTS = {
  attendance: 0.4,
  proposals: 0.3,
  interventions: 0.2,
  questions: 0.1,
} as const;

// Grade thresholds
export const GRADE_THRESHOLDS = {
  A: 85,
  B: 70,
  C: 55,
  D: 40,
  F: 0,
} as const;

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

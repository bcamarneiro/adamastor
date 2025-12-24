// Core entity types - shared between watcher and web

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
  grade: "A" | "B" | "C" | "D" | "F";
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
  vote: "favor" | "contra" | "abstencao" | "ausente";
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

export function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= GRADE_THRESHOLDS.A) return "A";
  if (score >= GRADE_THRESHOLDS.B) return "B";
  if (score >= GRADE_THRESHOLDS.C) return "C";
  if (score >= GRADE_THRESHOLDS.D) return "D";
  return "F";
}

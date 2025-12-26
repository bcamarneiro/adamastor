import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database
export interface Party {
  id: string;
  acronym: string;
  name: string;
  color: string | null;
}

export interface District {
  id: string;
  name: string;
  slug: string;
  postal_prefixes: string[];
  deputy_count: number | null;
}

export interface Deputy {
  id: string;
  external_id: string;
  name: string;
  short_name: string;
  photo_url: string | null;
  party_id: string | null;
  district_id: string | null;
  is_active: boolean;
  mandate_start: string | null;
  mandate_end: string | null;
  legislature: number;
}

export interface DeputyStats {
  id: string;
  deputy_id: string;
  proposal_count: number;
  intervention_count: number;
  question_count: number;
  party_votes_favor: number;
  party_votes_against: number;
  party_votes_abstain: number;
  party_total_votes: number;
  work_score: number;
  grade: string;
  national_rank: number;
  district_rank: number;
  calculated_at: string;
}

// View types for combined data
export interface DeputyDetail {
  id: string;
  external_id: string;
  name: string;
  short_name: string;
  photo_url: string | null;
  is_active: boolean;
  mandate_start: string | null;
  mandate_end: string | null;
  legislature: number;
  party_id: string | null;
  party_acronym: string | null;
  party_name: string | null;
  party_color: string | null;
  district_id: string | null;
  district_name: string | null;
  district_slug: string | null;
  proposal_count: number;
  intervention_count: number;
  question_count: number;
  party_votes_favor: number;
  party_votes_against: number;
  party_votes_abstain: number;
  party_total_votes: number;
  work_score: number;
  grade: string;
  national_rank: number;
  district_rank: number;
  // Attendance
  attendance_rate: number | null;
  meetings_attended: number | null;
  meetings_total: number | null;
  // Biography
  birth_date: string | null;
  profession: string | null;
  education: string | null;
  bio_narrative: string | null;
  biography_source_url: string | null;
  biography_scraped_at: string | null;
  // Source tracking
  last_synced_at: string | null;
  deputy_source_url: string | null;
  deputy_source_type: 'api' | 'scraper' | null;
  deputy_source_name: string | null;
}

export interface NationalAverages {
  avg_proposals: number;
  avg_interventions: number;
  avg_questions: number;
  avg_work_score: number;
  avg_attendance: number;
}

// Extended deputy information types
export interface DeputyRole {
  id: string;
  deputy_id: string;
  role_name: string;
  role_id: number | null;
  start_date: string;
  end_date: string | null;
}

export interface DeputyPartyHistory {
  id: string;
  deputy_id: string;
  party_id: string | null;
  party_acronym: string;
  start_date: string;
  end_date: string | null;
}

export interface DeputyStatusHistory {
  id: string;
  deputy_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
}

// Data source types for traceability
export interface DataSource {
  id: string;
  code: string;
  name: string;
  source_type: 'api' | 'scraper';
  base_url: string | null;
  description: string | null;
  is_active: boolean;
}

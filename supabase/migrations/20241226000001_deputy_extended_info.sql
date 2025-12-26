-- ===================
-- DEPUTY EXTENDED INFORMATION
-- ===================
-- Migration: 20241226000001_deputy_extended_info
-- Description: Add tables for deputy roles, party history, and status changes

-- ===================
-- DEPUTY ROLES/POSITIONS
-- ===================
-- Tracks positions like Presidente, Vice-Presidente, Secretário, etc.

CREATE TABLE deputy_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deputy_id UUID NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,           -- e.g., "Presidente", "Vice-Presidente"
  role_id INTEGER,                   -- Parliament's internal ID
  start_date DATE NOT NULL,
  end_date DATE,                     -- NULL if currently active
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deputy_roles_deputy ON deputy_roles(deputy_id);
CREATE INDEX idx_deputy_roles_active ON deputy_roles(deputy_id) WHERE end_date IS NULL;

-- ===================
-- PARTY AFFILIATION HISTORY
-- ===================
-- Tracks party changes (mudança de partido)

CREATE TABLE deputy_party_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deputy_id UUID NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id),
  party_acronym TEXT NOT NULL,       -- Store acronym directly for historical reference
  start_date DATE NOT NULL,
  end_date DATE,                     -- NULL if current party
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deputy_party_history_deputy ON deputy_party_history(deputy_id);
CREATE INDEX idx_deputy_party_history_dates ON deputy_party_history(start_date, end_date);

-- ===================
-- DEPUTY STATUS HISTORY
-- ===================
-- Tracks status changes (Efetivo, Suspenso, Renunciou, Suplente)

CREATE TABLE deputy_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deputy_id UUID NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
  status TEXT NOT NULL,              -- "Efetivo", "Suspenso", "Renunciou", "Suplente"
  start_date DATE NOT NULL,
  end_date DATE,                     -- NULL if current status
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deputy_status_history_deputy ON deputy_status_history(deputy_id);
CREATE INDEX idx_deputy_status_history_status ON deputy_status_history(status);

-- ===================
-- UPDATE DEPUTY_DETAILS VIEW
-- ===================
-- Add computed fields for extra info

DROP VIEW IF EXISTS deputy_details;

CREATE OR REPLACE VIEW deputy_details AS
SELECT
  d.id,
  d.external_id,
  d.name,
  d.short_name,
  d.photo_url,
  d.is_active,
  d.mandate_start,
  d.mandate_end,
  d.legislature,
  p.id as party_id,
  p.acronym as party_acronym,
  p.name as party_name,
  p.color as party_color,
  dist.id as district_id,
  dist.name as district_name,
  dist.slug as district_slug,
  COALESCE(s.proposal_count, 0) as proposal_count,
  COALESCE(s.intervention_count, 0) as intervention_count,
  COALESCE(s.question_count, 0) as question_count,
  COALESCE(s.party_votes_favor, 0) as party_votes_favor,
  COALESCE(s.party_votes_against, 0) as party_votes_against,
  COALESCE(s.party_votes_abstain, 0) as party_votes_abstain,
  COALESCE(s.party_total_votes, 0) as party_total_votes,
  COALESCE(s.work_score, 0) as work_score,
  COALESCE(s.grade, 'F') as grade,
  COALESCE(s.national_rank, 0) as national_rank,
  COALESCE(s.district_rank, 0) as district_rank,
  -- Count party changes (switched parties)
  (SELECT COUNT(*) FROM deputy_party_history dph WHERE dph.deputy_id = d.id) - 1 as party_changes_count,
  -- Check if has leadership role
  EXISTS(SELECT 1 FROM deputy_roles dr WHERE dr.deputy_id = d.id AND dr.end_date IS NULL) as has_active_role,
  -- Get current role name
  (SELECT dr.role_name FROM deputy_roles dr WHERE dr.deputy_id = d.id AND dr.end_date IS NULL ORDER BY dr.start_date DESC LIMIT 1) as current_role,
  -- Get current status
  (SELECT dsh.status FROM deputy_status_history dsh WHERE dsh.deputy_id = d.id ORDER BY dsh.start_date DESC LIMIT 1) as current_status
FROM deputies d
LEFT JOIN parties p ON d.party_id = p.id
LEFT JOIN districts dist ON d.district_id = dist.id
LEFT JOIN deputy_stats s ON s.deputy_id = d.id;

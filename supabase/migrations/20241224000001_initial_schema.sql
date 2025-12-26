-- ===================
-- GOV-PERF Initial Schema
-- ===================
-- Migration: 20241224000001_initial_schema
-- Description: Core tables for Portuguese Parliament tracker

-- ===================
-- EXTENSIONS
-- ===================
-- Note: uuid-ossp is pre-installed in Supabase but in the 'extensions' schema
-- We use gen_random_uuid() instead which is built into PostgreSQL 13+
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy search

-- ===================
-- CORE ENTITIES
-- ===================

CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  acronym TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,  -- Hex color for UI (#FF0000)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  postal_prefixes TEXT[] NOT NULL,  -- ['1000', '1100', ...]
  deputy_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for postal code lookup
CREATE INDEX idx_districts_postal ON districts USING GIN(postal_prefixes);

CREATE TABLE deputies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  party_id UUID REFERENCES parties(id),
  district_id UUID REFERENCES districts(id),
  photo_url TEXT,
  mandate_start DATE,
  mandate_end DATE,
  is_active BOOLEAN DEFAULT true,
  legislature INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deputies_party ON deputies(party_id);
CREATE INDEX idx_deputies_district ON deputies(district_id);
CREATE INDEX idx_deputies_active ON deputies(is_active) WHERE is_active = true;
CREATE INDEX idx_deputies_name_search ON deputies USING GIN(name gin_trgm_ops);

-- ===================
-- ACTIVITY TRACKING
-- ===================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  type TEXT,  -- 'plenary', 'committee'
  legislature INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_date ON sessions(date);

CREATE TABLE initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  number TEXT,  -- e.g., "PL 123/XVI"
  type TEXT,
  type_desc TEXT,
  status TEXT,
  submitted_at DATE,
  legislature INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_initiatives_type ON initiatives(type);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_submitted ON initiatives(submitted_at);

CREATE TABLE initiative_authors (
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  deputy_id UUID REFERENCES deputies(id) ON DELETE CASCADE,
  PRIMARY KEY (initiative_id, deputy_id)
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  deputy_id UUID REFERENCES deputies(id),
  initiative_id UUID REFERENCES initiatives(id),
  vote TEXT NOT NULL CHECK (vote IN ('favor', 'contra', 'abstencao', 'ausente')),
  voted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, deputy_id, initiative_id)
);

CREATE INDEX idx_votes_deputy ON votes(deputy_id);
CREATE INDEX idx_votes_vote ON votes(vote);
CREATE INDEX idx_votes_session ON votes(session_id);

CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  deputy_id UUID REFERENCES deputies(id),
  session_id UUID REFERENCES sessions(id),
  date DATE NOT NULL,
  type TEXT,  -- 'plenary', 'committee', 'question'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interventions_deputy ON interventions(deputy_id);
CREATE INDEX idx_interventions_date ON interventions(date);

-- ===================
-- COMPUTED STATS
-- ===================

CREATE TABLE deputy_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputy_id UUID UNIQUE REFERENCES deputies(id) ON DELETE CASCADE,

  -- Raw counts
  total_sessions INTEGER DEFAULT 0,
  sessions_attended INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  votes_cast INTEGER DEFAULT 0,
  proposal_count INTEGER DEFAULT 0,
  intervention_count INTEGER DEFAULT 0,
  question_count INTEGER DEFAULT 0,

  -- Calculated rates
  attendance_rate DECIMAL(5,2),

  -- Work Score
  work_score DECIMAL(5,2),
  grade CHAR(1) CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),

  -- Rankings
  district_rank INTEGER,
  national_rank INTEGER,

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deputy_stats_score ON deputy_stats(work_score DESC);
CREATE INDEX idx_deputy_stats_grade ON deputy_stats(grade);
CREATE INDEX idx_deputy_stats_rank ON deputy_stats(national_rank);

-- ===================
-- AUDIT TRAIL
-- ===================

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_data JSONB,
  new_data JSONB,
  diff JSONB,
  source_file TEXT,
  source_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_events(created_at);

-- Prevent updates/deletes on audit_events (append-only)
CREATE RULE audit_no_update AS ON UPDATE TO audit_events DO INSTEAD NOTHING;
CREATE RULE audit_no_delete AS ON DELETE TO audit_events DO INSTEAD NOTHING;

-- ===================
-- SYNC METADATA
-- ===================

CREATE TABLE sync_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  datasets_synced TEXT[],
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  b2_snapshot_path TEXT
);

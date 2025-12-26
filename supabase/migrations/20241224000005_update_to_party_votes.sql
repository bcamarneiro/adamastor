-- ===================
-- GOV-PERF Schema Update: Party-Level Votes
-- ===================
-- Migration: 20241224000005_update_to_party_votes
-- Description: Updates schema to reflect Parliament API data limitations
--
-- The Parliament API only provides voting data at PARTY level, not individual deputy level.
-- This migration:
-- 1. Removes the old votes table (per-deputy, which we can't populate)
-- 2. Creates party_votes table (party-level voting as provided by API)
-- 3. Updates deputy_stats to remove attendance (can't measure) and add party vote counts
-- 4. Updates all functions and views accordingly

-- ===================
-- STEP 1: Drop views that depend on columns we're removing
-- ===================
DROP VIEW IF EXISTS district_stats;
DROP VIEW IF EXISTS party_stats;
DROP VIEW IF EXISTS rankings;
DROP VIEW IF EXISTS deputy_details;

-- ===================
-- STEP 2: Drop old votes table (empty, never populated)
-- ===================
DROP TABLE IF EXISTS votes;

-- ===================
-- STEP 3: Create party_votes table
-- ===================
CREATE TABLE party_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,
  initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
  session_number INTEGER,
  voted_at DATE NOT NULL,
  result TEXT CHECK (result IN ('approved', 'rejected')),
  is_unanimous BOOLEAN DEFAULT false,
  parties_favor TEXT[] DEFAULT '{}',
  parties_against TEXT[] DEFAULT '{}',
  parties_abstain TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_party_votes_initiative ON party_votes(initiative_id);
CREATE INDEX idx_party_votes_date ON party_votes(voted_at);
CREATE INDEX idx_party_votes_result ON party_votes(result);

-- ===================
-- STEP 4: Update deputy_stats table
-- ===================
-- Remove attendance-related columns (can't measure per-deputy)
ALTER TABLE deputy_stats
  DROP COLUMN IF EXISTS total_sessions,
  DROP COLUMN IF EXISTS sessions_attended,
  DROP COLUMN IF EXISTS total_votes,
  DROP COLUMN IF EXISTS votes_cast,
  DROP COLUMN IF EXISTS attendance_rate;

-- Add party vote stats columns
ALTER TABLE deputy_stats
  ADD COLUMN IF NOT EXISTS party_votes_favor INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_votes_against INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_votes_abstain INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS party_total_votes INTEGER DEFAULT 0;

-- ===================
-- STEP 5: Update functions
-- ===================

-- Revised Work Score formula (no attendance, new weights: 50/35/15)
-- Score of 100 = average performance
CREATE OR REPLACE FUNCTION calculate_work_score(
  p_proposals DECIMAL,
  p_avg_proposals DECIMAL,
  p_interventions DECIMAL,
  p_avg_interventions DECIMAL,
  p_questions DECIMAL,
  p_avg_questions DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND((
    LEAST(COALESCE(p_proposals / NULLIF(p_avg_proposals, 0), 0) * 100, 200) * 0.50 +
    LEAST(COALESCE(p_interventions / NULLIF(p_avg_interventions, 0), 0) * 100, 200) * 0.35 +
    LEAST(COALESCE(p_questions / NULLIF(p_avg_questions, 0), 0) * 100, 200) * 0.15
  ), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Revised grade thresholds (calibrated for new formula)
CREATE OR REPLACE FUNCTION score_to_grade(score DECIMAL) RETURNS CHAR(1) AS $$
BEGIN
  RETURN CASE
    WHEN score >= 120 THEN 'A'  -- 20%+ above average
    WHEN score >= 90 THEN 'B'   -- Near or slightly below average
    WHEN score >= 60 THEN 'C'   -- Moderately below average
    WHEN score >= 30 THEN 'D'   -- Significantly below average
    ELSE 'F'                     -- Very low activity
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Revised get_national_averages (no attendance)
CREATE OR REPLACE FUNCTION get_national_averages()
RETURNS json AS $$
SELECT json_build_object(
  'avg_proposal_count', ROUND(AVG(ds.proposal_count)::numeric, 1),
  'avg_intervention_count', ROUND(AVG(ds.intervention_count)::numeric, 1),
  'avg_question_count', ROUND(AVG(ds.question_count)::numeric, 1),
  'avg_work_score', ROUND(AVG(ds.work_score)::numeric, 1),
  'total_deputies', COUNT(*),
  'total_active_deputies', COUNT(*) FILTER (WHERE d.is_active)
)
FROM deputy_stats ds
JOIN deputies d ON ds.deputy_id = d.id;
$$ LANGUAGE sql STABLE;

-- Revised recalculate_all_stats (no attendance in formula)
CREATE OR REPLACE FUNCTION recalculate_all_stats()
RETURNS void AS $$
DECLARE
  avg_proposals DECIMAL;
  avg_interventions DECIMAL;
  avg_questions DECIMAL;
BEGIN
  -- Calculate averages from current data
  SELECT
    COALESCE(AVG(proposal_count), 1),
    COALESCE(AVG(intervention_count), 1),
    COALESCE(AVG(question_count), 1)
  INTO avg_proposals, avg_interventions, avg_questions
  FROM deputy_stats;

  -- Update all work scores (revised formula, no attendance)
  UPDATE deputy_stats ds
  SET
    work_score = calculate_work_score(
      proposal_count,
      avg_proposals,
      intervention_count,
      avg_interventions,
      question_count,
      avg_questions
    ),
    calculated_at = NOW();

  -- Update grades
  UPDATE deputy_stats
  SET grade = score_to_grade(work_score);

  -- Update national rankings
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY work_score DESC NULLS LAST) as rank
    FROM deputy_stats
  )
  UPDATE deputy_stats ds
  SET national_rank = r.rank
  FROM ranked r
  WHERE ds.id = r.id;

  -- Update district rankings
  WITH district_ranked AS (
    SELECT
      ds.id,
      ROW_NUMBER() OVER (
        PARTITION BY d.district_id
        ORDER BY ds.work_score DESC NULLS LAST
      ) as rank
    FROM deputy_stats ds
    JOIN deputies d ON ds.deputy_id = d.id
  )
  UPDATE deputy_stats ds
  SET district_rank = dr.rank
  FROM district_ranked dr
  WHERE ds.id = dr.id;
END;
$$ LANGUAGE plpgsql;

-- ===================
-- STEP 5: Update views
-- ===================

-- Drop existing views (must recreate them)
DROP VIEW IF EXISTS district_stats;
DROP VIEW IF EXISTS party_stats;
DROP VIEW IF EXISTS rankings;
DROP VIEW IF EXISTS deputy_details;

-- Recreate deputy_details view (without attendance)
CREATE VIEW deputy_details AS
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
  p.id AS party_id,
  p.acronym AS party_acronym,
  p.name AS party_name,
  p.color AS party_color,
  dist.id AS district_id,
  dist.name AS district_name,
  ds.work_score,
  ds.grade,
  ds.national_rank,
  ds.district_rank,
  ds.proposal_count,
  ds.intervention_count,
  ds.question_count,
  ds.party_votes_favor,
  ds.party_votes_against,
  ds.party_votes_abstain,
  ds.party_total_votes,
  ds.calculated_at AS stats_updated_at
FROM deputies d
LEFT JOIN parties p ON d.party_id = p.id
LEFT JOIN districts dist ON d.district_id = dist.id
LEFT JOIN deputy_stats ds ON d.id = ds.deputy_id;

-- Recreate rankings view (without attendance)
CREATE VIEW rankings AS
SELECT
  d.id,
  d.name,
  d.short_name,
  d.photo_url,
  p.acronym AS party,
  p.color AS party_color,
  dist.name AS district,
  ds.work_score,
  ds.grade,
  ds.national_rank,
  ds.district_rank,
  ds.proposal_count,
  ds.intervention_count,
  ds.question_count
FROM deputies d
JOIN deputy_stats ds ON d.id = ds.deputy_id
JOIN parties p ON d.party_id = p.id
JOIN districts dist ON d.district_id = dist.id
WHERE d.is_active = true
ORDER BY ds.work_score DESC;

-- Recreate party_stats view (without attendance)
CREATE VIEW party_stats AS
SELECT
  p.id,
  p.acronym,
  p.name,
  p.color,
  COUNT(d.id) AS deputy_count,
  ROUND(AVG(ds.work_score)::numeric, 2) AS avg_work_score,
  SUM(ds.proposal_count) AS total_proposals,
  SUM(ds.intervention_count) AS total_interventions,
  SUM(ds.question_count) AS total_questions
FROM parties p
LEFT JOIN deputies d ON d.party_id = p.id AND d.is_active = true
LEFT JOIN deputy_stats ds ON ds.deputy_id = d.id
GROUP BY p.id, p.acronym, p.name, p.color
ORDER BY avg_work_score DESC NULLS LAST;

-- Recreate district_stats view (without attendance)
CREATE VIEW district_stats AS
SELECT
  dist.id,
  dist.name,
  dist.deputy_count AS seat_count,
  COUNT(d.id) AS active_deputies,
  ROUND(AVG(ds.work_score)::numeric, 2) AS avg_work_score
FROM districts dist
LEFT JOIN deputies d ON d.district_id = dist.id AND d.is_active = true
LEFT JOIN deputy_stats ds ON ds.deputy_id = d.id
GROUP BY dist.id, dist.name, dist.deputy_count
ORDER BY avg_work_score DESC NULLS LAST;

-- ===================
-- STEP 6: RLS for new table
-- ===================
ALTER TABLE party_votes ENABLE ROW LEVEL SECURITY;

-- Public read access for party_votes
CREATE POLICY "Public can read party_votes"
  ON party_votes FOR SELECT
  USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access party_votes"
  ON party_votes FOR ALL
  USING (auth.role() = 'service_role');

-- ===================
-- STEP 7: Add slugify function for URL-friendly names
-- ===================
CREATE OR REPLACE FUNCTION slugify(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        translate(input, 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiioooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ===================
-- STEP 8: Add helper function for district lookup with full info
-- ===================
CREATE OR REPLACE FUNCTION get_district_by_postal(postal_code TEXT)
RETURNS json AS $$
DECLARE
  prefix TEXT;
  result json;
BEGIN
  prefix := LEFT(postal_code, 4);

  SELECT json_build_object(
    'id', dist.id,
    'name', dist.name,
    'slug', slugify(dist.name),
    'deputy_count', dist.deputy_count,
    'active_deputies', COUNT(d.id)
  )
  INTO result
  FROM districts dist
  LEFT JOIN deputies d ON d.district_id = dist.id AND d.is_active = true
  WHERE prefix = ANY(dist.postal_prefixes)
  GROUP BY dist.id, dist.name, dist.deputy_count
  LIMIT 1;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

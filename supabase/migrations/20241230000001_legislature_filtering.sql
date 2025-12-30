-- ===================
-- Legislature Filtering
-- ===================
-- Migration: 20241230000001_legislature_filtering
-- Description: Ensure all views and functions filter by current legislature (XVII = 17)
-- Fixes Issue #48: Calculations must use only current legislature data

-- ===================
-- CONFIGURATION
-- ===================
-- Current legislature: XVII (17)
-- This should match CURRENT_LEGISLATURE in apps/watcher/src/config.ts

-- ===================
-- UPDATE DEFAULT VALUES
-- ===================
-- Change default legislature from 16 to 17 for new records

ALTER TABLE deputies ALTER COLUMN legislature SET DEFAULT 17;
ALTER TABLE sessions ALTER COLUMN legislature SET DEFAULT 17;
ALTER TABLE initiatives ALTER COLUMN legislature SET DEFAULT 17;
ALTER TABLE plenary_meetings ALTER COLUMN legislature SET DEFAULT 17;

-- ===================
-- ADD LEGISLATURE INDEX TO DEPUTIES
-- ===================
CREATE INDEX IF NOT EXISTS idx_deputies_legislature ON deputies(legislature);

-- ===================
-- UPDATE VIEWS WITH LEGISLATURE FILTERING
-- ===================

-- Deputy details view - filter by current legislature
DROP VIEW IF EXISTS deputy_details CASCADE;
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
  p.acronym AS party_acronym,
  p.name AS party_name,
  p.color AS party_color,
  dist.name AS district_name,
  ds.attendance_rate,
  ds.work_score,
  ds.grade,
  ds.national_rank,
  ds.district_rank,
  ds.proposal_count,
  ds.intervention_count,
  ds.question_count,
  ds.calculated_at AS stats_updated_at
FROM deputies d
LEFT JOIN parties p ON d.party_id = p.id
LEFT JOIN districts dist ON d.district_id = dist.id
LEFT JOIN deputy_stats ds ON d.id = ds.deputy_id
WHERE d.legislature = 17;

-- Rankings view - filter by current legislature
DROP VIEW IF EXISTS rankings CASCADE;
CREATE VIEW rankings AS
SELECT
  d.id,
  d.name,
  d.short_name,
  d.photo_url,
  d.legislature,
  p.acronym AS party,
  p.color AS party_color,
  dist.name AS district,
  ds.work_score,
  ds.grade,
  ds.national_rank,
  ds.district_rank,
  ds.attendance_rate,
  ds.proposal_count,
  ds.intervention_count
FROM deputies d
JOIN deputy_stats ds ON d.id = ds.deputy_id
JOIN parties p ON d.party_id = p.id
JOIN districts dist ON d.district_id = dist.id
WHERE d.is_active = true
  AND d.legislature = 17
ORDER BY ds.work_score DESC;

-- Party stats view - filter by current legislature
DROP VIEW IF EXISTS party_stats CASCADE;
CREATE VIEW party_stats AS
SELECT
  p.id,
  p.acronym,
  p.name,
  p.color,
  COUNT(d.id) AS deputy_count,
  ROUND(AVG(ds.work_score)::numeric, 2) AS avg_work_score,
  ROUND(AVG(ds.attendance_rate)::numeric, 2) AS avg_attendance_rate,
  SUM(ds.proposal_count) AS total_proposals,
  SUM(ds.intervention_count) AS total_interventions
FROM parties p
LEFT JOIN deputies d ON d.party_id = p.id AND d.is_active = true AND d.legislature = 17
LEFT JOIN deputy_stats ds ON ds.deputy_id = d.id
GROUP BY p.id, p.acronym, p.name, p.color
HAVING COUNT(d.id) > 0
ORDER BY avg_work_score DESC NULLS LAST;

-- District stats view - filter by current legislature
DROP VIEW IF EXISTS district_stats CASCADE;
CREATE VIEW district_stats AS
SELECT
  dist.id,
  dist.name,
  dist.deputy_count AS seat_count,
  COUNT(d.id) AS active_deputies,
  ROUND(AVG(ds.work_score)::numeric, 2) AS avg_work_score,
  ROUND(AVG(ds.attendance_rate)::numeric, 2) AS avg_attendance_rate
FROM districts dist
LEFT JOIN deputies d ON d.district_id = dist.id AND d.is_active = true AND d.legislature = 17
LEFT JOIN deputy_stats ds ON ds.deputy_id = d.id
GROUP BY dist.id, dist.name, dist.deputy_count
ORDER BY avg_work_score DESC NULLS LAST;

-- Deputy attendance summary view - filter by current legislature
-- Fixed: Move legislature filter to WHERE clause to avoid excluding valid attendance records
DROP VIEW IF EXISTS deputy_attendance_summary CASCADE;
CREATE VIEW deputy_attendance_summary AS
SELECT
  d.id as deputy_id,
  d.name,
  d.short_name,
  d.legislature,
  p.acronym as party,
  COUNT(pa.id) as total_meetings,
  COUNT(CASE WHEN pa.status = 'present' THEN 1 END) as meetings_present,
  COUNT(CASE WHEN pa.status != 'present' THEN 1 END) as meetings_absent,
  ROUND(
    CASE
      WHEN COUNT(pa.id) > 0
      THEN (COUNT(CASE WHEN pa.status = 'present' THEN 1 END)::DECIMAL / COUNT(pa.id)) * 100
      ELSE 0
    END,
    1
  ) as attendance_rate
FROM deputies d
LEFT JOIN plenary_attendance pa ON pa.deputy_id = d.id
LEFT JOIN plenary_meetings pm ON pa.meeting_id = pm.id
LEFT JOIN parties p ON d.party_id = p.id
WHERE d.is_active = true
  AND d.legislature = 17
  AND (pm.legislature = 17 OR pm.id IS NULL)
GROUP BY d.id, d.name, d.short_name, d.legislature, p.acronym;

-- ===================
-- UPDATE FUNCTIONS WITH LEGISLATURE FILTERING
-- ===================

-- Get national averages - filter by current legislature
-- Must DROP first because return type changed from TABLE to json
DROP FUNCTION IF EXISTS get_national_averages();

CREATE FUNCTION get_national_averages()
RETURNS json AS $$
SELECT json_build_object(
  'legislature', 17,
  'avg_attendance_rate', ROUND(AVG(ds.attendance_rate)::numeric, 1),
  'avg_proposal_count', ROUND(AVG(ds.proposal_count)::numeric, 1),
  'avg_intervention_count', ROUND(AVG(ds.intervention_count)::numeric, 1),
  'avg_question_count', ROUND(AVG(ds.question_count)::numeric, 1),
  'avg_work_score', ROUND(AVG(ds.work_score)::numeric, 1),
  'total_deputies', COUNT(*),
  'total_active_deputies', COUNT(*) FILTER (WHERE d.is_active),
  'absence_rate', ROUND(100 - AVG(ds.attendance_rate)::numeric, 1)
)
FROM deputy_stats ds
JOIN deputies d ON ds.deputy_id = d.id
WHERE d.legislature = 17;
$$ LANGUAGE sql STABLE;

-- Recalculate all stats - filter by current legislature
-- Uses existing data in deputy_stats (populated by transform pipeline)
-- and adds legislature filtering to rankings
CREATE OR REPLACE FUNCTION recalculate_all_stats()
RETURNS void AS $$
DECLARE
  avg_proposals DECIMAL;
  avg_interventions DECIMAL;
  avg_questions DECIMAL;
BEGIN
  -- Step 1: Update attendance stats from plenary attendance summary (filtered by legislature)
  UPDATE deputy_stats ds
  SET
    meetings_attended = COALESCE(att.meetings_present, 0),
    meetings_total = COALESCE(att.total_meetings, 0),
    attendance_rate = COALESCE(att.attendance_rate, 0)
  FROM deputy_attendance_summary att
  JOIN deputies d ON ds.deputy_id = d.id
  WHERE att.deputy_id = ds.deputy_id
    AND d.legislature = 17;

  -- Step 2: Calculate averages for work score formula (only current legislature)
  SELECT
    COALESCE(AVG(ds.proposal_count), 1),
    COALESCE(AVG(ds.intervention_count), 1),
    COALESCE(AVG(ds.question_count), 1)
  INTO avg_proposals, avg_interventions, avg_questions
  FROM deputy_stats ds
  JOIN deputies d ON ds.deputy_id = d.id
  WHERE d.legislature = 17;

  -- Step 3: Calculate work score using the formula (only current legislature)
  UPDATE deputy_stats ds
  SET
    work_score = calculate_work_score(
      ds.attendance_rate,
      ds.proposal_count,
      avg_proposals,
      ds.intervention_count,
      avg_interventions,
      ds.question_count,
      avg_questions
    ),
    calculated_at = NOW()
  FROM deputies d
  WHERE ds.deputy_id = d.id
    AND d.legislature = 17;

  -- Step 4: Update grades based on work score (only current legislature)
  UPDATE deputy_stats ds
  SET grade = score_to_grade(ds.work_score)
  FROM deputies d
  WHERE ds.deputy_id = d.id
    AND d.legislature = 17;

  -- Step 5: Update national rankings (only for current legislature)
  WITH ranked AS (
    SELECT ds.deputy_id, ROW_NUMBER() OVER (ORDER BY ds.work_score DESC NULLS LAST) as rank
    FROM deputy_stats ds
    JOIN deputies d ON ds.deputy_id = d.id
    WHERE d.legislature = 17
  )
  UPDATE deputy_stats ds
  SET national_rank = r.rank
  FROM ranked r
  WHERE ds.deputy_id = r.deputy_id;

  -- Step 6: Update district rankings (only for current legislature)
  WITH district_ranked AS (
    SELECT
      ds.deputy_id,
      ROW_NUMBER() OVER (
        PARTITION BY d.district_id
        ORDER BY ds.work_score DESC NULLS LAST
      ) as rank
    FROM deputy_stats ds
    JOIN deputies d ON ds.deputy_id = d.id
    WHERE d.legislature = 17
  )
  UPDATE deputy_stats ds
  SET district_rank = dr.rank
  FROM district_ranked dr
  WHERE ds.deputy_id = dr.deputy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION recalculate_all_stats() TO service_role;

-- ===================
-- COMMENTS
-- ===================
COMMENT ON VIEW deputy_details IS 'Deputy details filtered by current legislature (XVII)';
COMMENT ON VIEW rankings IS 'Deputy rankings filtered by current legislature (XVII)';
COMMENT ON VIEW party_stats IS 'Party statistics aggregated from current legislature (XVII) deputies only';
COMMENT ON VIEW district_stats IS 'District statistics aggregated from current legislature (XVII) deputies only';
COMMENT ON FUNCTION get_national_averages() IS 'National averages for current legislature (XVII)';
COMMENT ON FUNCTION recalculate_all_stats() IS 'Recalculate stats for current legislature (XVII) deputies only';

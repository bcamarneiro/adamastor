-- ===================
-- Fix Ranking Active Filter
-- ===================
-- Migration: 20241231000004_fix_ranking_active_filter
-- Description: Fix rankings to only include active deputies
-- Fixes:
--   - Issue #67: National/district ranks exceed 230 (total deputy count)
--   - Issue #68: Suspended deputies appear in "lazy" ranking with 0 pts
-- Root Cause:
--   The recalculate_all_stats() function was ranking ALL deputies in legislature 17,
--   including inactive/suspended ones. This caused ranks like #1174 when there are
--   only 230 active deputies.

-- ===================
-- FIX: Update recalculate_all_stats() to filter by is_active in ranking CTEs
-- ===================
-- IMPORTANT: This migration ONLY modifies Steps 5 and 6 (ranking calculations).
-- Steps 1-4 remain unchanged and continue to use:
--   - deputy_attendance_summary view for attendance
--   - calculate_work_score() function with normalization
--   - score_to_grade() function for grades

CREATE OR REPLACE FUNCTION recalculate_all_stats()
RETURNS void AS $$
DECLARE
  avg_proposals DECIMAL;
  avg_interventions DECIMAL;
  avg_questions DECIMAL;
BEGIN
  -- Step 1: Update attendance stats from plenary attendance summary (filtered by legislature)
  -- UNCHANGED from original
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
  -- UNCHANGED from original
  SELECT
    COALESCE(AVG(ds.proposal_count), 1),
    COALESCE(AVG(ds.intervention_count), 1),
    COALESCE(AVG(ds.question_count), 1)
  INTO avg_proposals, avg_interventions, avg_questions
  FROM deputy_stats ds
  JOIN deputies d ON ds.deputy_id = d.id
  WHERE d.legislature = 17;

  -- Step 3: Calculate work score using the formula (only current legislature)
  -- UNCHANGED from original - uses calculate_work_score() with normalization
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
  -- UNCHANGED from original
  UPDATE deputy_stats ds
  SET grade = score_to_grade(ds.work_score)
  FROM deputies d
  WHERE ds.deputy_id = d.id
    AND d.legislature = 17;

  -- Step 5: Update national rankings (only for ACTIVE current legislature deputies)
  -- FIX: Added d.is_active = true filter to exclude inactive/suspended deputies
  WITH ranked AS (
    SELECT ds.deputy_id, ROW_NUMBER() OVER (ORDER BY ds.work_score DESC NULLS LAST) as rank
    FROM deputy_stats ds
    JOIN deputies d ON ds.deputy_id = d.id
    WHERE d.legislature = 17
      AND d.is_active = true  -- FIX: Only rank active deputies
  )
  UPDATE deputy_stats ds
  SET national_rank = r.rank
  FROM ranked r
  WHERE ds.deputy_id = r.deputy_id;

  -- Set NULL rank for inactive deputies (they shouldn't appear in rankings)
  UPDATE deputy_stats ds
  SET national_rank = NULL
  FROM deputies d
  WHERE ds.deputy_id = d.id
    AND d.legislature = 17
    AND d.is_active = false;

  -- Step 6: Update district rankings (only for ACTIVE current legislature deputies)
  -- FIX: Added d.is_active = true filter to exclude inactive/suspended deputies
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
      AND d.is_active = true  -- FIX: Only rank active deputies
  )
  UPDATE deputy_stats ds
  SET district_rank = dr.rank
  FROM district_ranked dr
  WHERE ds.deputy_id = dr.deputy_id;

  -- Set NULL rank for inactive deputies (they shouldn't appear in rankings)
  UPDATE deputy_stats ds
  SET district_rank = NULL
  FROM deputies d
  WHERE ds.deputy_id = d.id
    AND d.legislature = 17
    AND d.is_active = false;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public  -- Security fix: Set search_path for SECURITY DEFINER
SECURITY DEFINER;

-- ===================
-- PERMISSIONS
-- ===================
-- Grant execute permission to service_role (required for ETL pipeline)
GRANT EXECUTE ON FUNCTION recalculate_all_stats() TO service_role;

-- ===================
-- COMMENTS
-- ===================
COMMENT ON FUNCTION recalculate_all_stats() IS 'Recalculates all deputy stats including work scores (using calculate_work_score with normalization), grades, and rankings. Rankings only include active deputies.';

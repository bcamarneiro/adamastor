-- ===================
-- Fix National Averages
-- ===================
-- Migration: 20260206190100_fix_national_averages_null
-- Description: Fixes the get_national_averages function to return 0 instead of NULL when no data is available.

-- Must DROP first because the body is changing
DROP FUNCTION IF EXISTS get_national_averages();

CREATE FUNCTION get_national_averages()
RETURNS json AS $$
SELECT json_build_object(
  'legislature', 17,
  'avg_attendance_rate', COALESCE(ROUND(AVG(ds.attendance_rate)::numeric, 1), 0),
  'avg_proposal_count', COALESCE(ROUND(AVG(ds.proposal_count)::numeric, 1), 0),
  'avg_intervention_count', COALESCE(ROUND(AVG(ds.intervention_count)::numeric, 1), 0),
  'avg_question_count', COALESCE(ROUND(AVG(ds.question_count)::numeric, 1), 0),
  'avg_work_score', COALESCE(ROUND(AVG(ds.work_score)::numeric, 1), 0),
  'total_deputies', COUNT(d.id),
  'total_active_deputies', COUNT(d.id) FILTER (WHERE d.is_active),
  'absence_rate', COALESCE(ROUND(100 - AVG(ds.attendance_rate)::numeric, 1), 100)
)
FROM deputy_stats ds
RIGHT JOIN deputies d ON ds.deputy_id = d.id
WHERE d.legislature = 17;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_national_averages() IS 'National averages for current legislature (XVII), fixed to handle NULLs.';

-- Additionally, it seems more correct to use a RIGHT JOIN from deputy_stats to deputies
-- to ensure all deputies from the legislature are counted in total_deputies, even if they have no stats.
-- And if there are no attendance records, the absence rate should be 100%, not 0.

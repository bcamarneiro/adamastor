-- ===================
-- FIX recalculate_all_stats function
-- ===================
-- Migration: 20241225000001_fix_recalculate_stats
-- Description: Fix UPDATE statements to include WHERE clauses for RLS compatibility

-- Drop and recreate the function with proper WHERE clauses
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

  -- Update all work scores (with WHERE clause for RLS)
  UPDATE deputy_stats
  SET
    work_score = calculate_work_score(
      proposal_count,
      avg_proposals,
      intervention_count,
      avg_interventions,
      question_count,
      avg_questions
    ),
    calculated_at = NOW()
  WHERE id IS NOT NULL;  -- All rows

  -- Update grades (with WHERE clause for RLS)
  UPDATE deputy_stats
  SET grade = score_to_grade(work_score)
  WHERE id IS NOT NULL;  -- All rows

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION recalculate_all_stats() TO service_role;

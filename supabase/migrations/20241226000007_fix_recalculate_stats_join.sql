-- ===================
-- FIX recalculate_all_stats function
-- ===================
-- Migration: 20241226000007_fix_recalculate_stats_join
-- Description:
-- 1. Fix invalid reference to FROM-clause entry for table "ds"
-- 2. Remove dependency on non-existent deputy_proposal_counts view
-- 3. Use existing data in deputy_stats (populated by transform pipeline)

CREATE OR REPLACE FUNCTION recalculate_all_stats()
RETURNS void AS $$
DECLARE
  avg_proposals DECIMAL;
  avg_interventions DECIMAL;
  avg_questions DECIMAL;
BEGIN
  -- Step 1: Update attendance stats from plenary attendance summary
  UPDATE deputy_stats ds
  SET
    meetings_attended = COALESCE(att.meetings_present, 0),
    meetings_total = COALESCE(att.total_meetings, 0),
    attendance_rate = COALESCE(att.attendance_rate, 0)
  FROM deputy_attendance_summary att
  WHERE att.deputy_id = ds.deputy_id;

  -- Step 2: Calculate averages for work score formula
  SELECT
    COALESCE(AVG(proposal_count), 1),
    COALESCE(AVG(intervention_count), 1),
    COALESCE(AVG(question_count), 1)
  INTO avg_proposals, avg_interventions, avg_questions
  FROM deputy_stats;

  -- Step 3: Calculate work score using the original formula
  -- Formula: attendance (40%) + proposals (30%) + interventions (20%) + questions (10%)
  UPDATE deputy_stats
  SET
    work_score = calculate_work_score(
      attendance_rate,
      proposal_count,
      avg_proposals,
      intervention_count,
      avg_interventions,
      question_count,
      avg_questions
    ),
    calculated_at = NOW()
  WHERE id IS NOT NULL;  -- All rows (satisfies RLS WHERE requirement)

  -- Step 4: Update grades based on work score
  UPDATE deputy_stats
  SET grade = score_to_grade(work_score)
  WHERE id IS NOT NULL;  -- All rows

  -- Step 5: Update national rankings
  WITH ranked AS (
    SELECT deputy_id, ROW_NUMBER() OVER (ORDER BY work_score DESC NULLS LAST) as rank
    FROM deputy_stats
  )
  UPDATE deputy_stats ds
  SET national_rank = r.rank
  FROM ranked r
  WHERE ds.deputy_id = r.deputy_id;

  -- Step 6: Update district rankings
  WITH district_ranked AS (
    SELECT
      ds.deputy_id,
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
  WHERE ds.deputy_id = dr.deputy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION recalculate_all_stats() TO service_role;

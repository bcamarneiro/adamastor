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
-- FIX: Update recalculate_all_stats() to filter by is_active
-- ===================

CREATE OR REPLACE FUNCTION recalculate_all_stats()
RETURNS void AS $$
BEGIN
  -- Step 1: Calculate work scores (only for current legislature deputies)
  UPDATE deputy_stats ds
  SET work_score = (
    COALESCE(ds.proposal_count, 0) * 10 +
    COALESCE(ds.intervention_count, 0) * 5 +
    COALESCE(ds.question_count, 0) * 3
  ),
  calculated_at = NOW()
  FROM deputies d
  WHERE ds.deputy_id = d.id
    AND d.legislature = 17;

  -- Step 2: Calculate party vote alignment (only current legislature)
  UPDATE deputy_stats ds
  SET
    party_votes_favor = pv.favor,
    party_votes_against = pv.against,
    party_votes_abstain = pv.abstain,
    party_total_votes = pv.total
  FROM (
    SELECT
      v.deputy_id,
      COUNT(*) FILTER (WHERE v.vote_type = 'favor') as favor,
      COUNT(*) FILTER (WHERE v.vote_type = 'against') as against,
      COUNT(*) FILTER (WHERE v.vote_type = 'abstention') as abstain,
      COUNT(*) as total
    FROM votes v
    JOIN deputies d ON v.deputy_id = d.id
    WHERE d.legislature = 17
    GROUP BY v.deputy_id
  ) pv
  WHERE ds.deputy_id = pv.deputy_id;

  -- Step 3: Calculate attendance from plenary_attendance (only current legislature)
  UPDATE deputy_stats ds
  SET
    attendance_rate = att.rate,
    meetings_attended = att.attended,
    meetings_total = att.total
  FROM (
    SELECT
      pa.deputy_id,
      COUNT(*) FILTER (WHERE pa.status = 'present') as attended,
      COUNT(*) as total,
      ROUND(
        CASE
          WHEN COUNT(*) > 0
          THEN (COUNT(*) FILTER (WHERE pa.status = 'present')::DECIMAL / COUNT(*)) * 100
          ELSE 0
        END,
        1
      ) as rate
    FROM plenary_attendance pa
    JOIN plenary_meetings pm ON pa.meeting_id = pm.id
    WHERE pm.legislature = 17
    GROUP BY pa.deputy_id
  ) att
  WHERE ds.deputy_id = att.deputy_id;

  -- Step 4: Update grades based on work score (only current legislature)
  UPDATE deputy_stats ds
  SET grade = score_to_grade(ds.work_score)
  FROM deputies d
  WHERE ds.deputy_id = d.id
    AND d.legislature = 17;

  -- Step 5: Update national rankings (only for ACTIVE current legislature deputies)
  -- FIX: Added d.is_active = true filter
  WITH ranked AS (
    SELECT ds.deputy_id, ROW_NUMBER() OVER (ORDER BY ds.work_score DESC NULLS LAST) as rank
    FROM deputy_stats ds
    JOIN deputies d ON ds.deputy_id = d.id
    WHERE d.legislature = 17
      AND d.is_active = true
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
  -- FIX: Added d.is_active = true filter
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
      AND d.is_active = true
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================
-- COMMENTS
-- ===================
COMMENT ON FUNCTION recalculate_all_stats() IS 'Recalculates all deputy stats including work scores, grades, and rankings. Rankings only include active deputies.';

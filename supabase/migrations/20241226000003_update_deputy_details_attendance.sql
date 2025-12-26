-- ===================
-- Update deputy_details view to include attendance metrics
-- ===================
-- Migration: 20241226000003_update_deputy_details_attendance
-- Description: Add meetings_attended, meetings_total to deputy_details view

-- Drop and recreate the view with attendance fields
DROP VIEW IF EXISTS deputy_details;

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
  d.party_id,
  p.acronym AS party_acronym,
  p.name AS party_name,
  p.color AS party_color,
  d.district_id,
  dist.name AS district_name,
  dist.slug AS district_slug,
  -- Activity metrics
  ds.proposal_count,
  ds.intervention_count,
  ds.question_count,
  -- Voting alignment
  ds.party_votes_favor,
  ds.party_votes_against,
  ds.party_votes_abstain,
  ds.party_total_votes,
  -- Performance
  ds.work_score,
  ds.grade,
  ds.national_rank,
  ds.district_rank,
  -- Attendance (NEW)
  ds.attendance_rate,
  ds.meetings_attended,
  ds.meetings_total,
  -- Metadata
  ds.calculated_at AS stats_updated_at
FROM deputies d
LEFT JOIN parties p ON d.party_id = p.id
LEFT JOIN districts dist ON d.district_id = dist.id
LEFT JOIN deputy_stats ds ON d.id = ds.deputy_id;

-- Drop and recreate get_national_averages to include attendance
DROP FUNCTION IF EXISTS get_national_averages();

CREATE OR REPLACE FUNCTION get_national_averages()
RETURNS TABLE(
  avg_proposals DECIMAL,
  avg_interventions DECIMAL,
  avg_questions DECIMAL,
  avg_work_score DECIMAL,
  avg_attendance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(ds.proposal_count)::DECIMAL, 2) AS avg_proposals,
    ROUND(AVG(ds.intervention_count)::DECIMAL, 2) AS avg_interventions,
    ROUND(AVG(ds.question_count)::DECIMAL, 2) AS avg_questions,
    ROUND(AVG(ds.work_score)::DECIMAL, 2) AS avg_work_score,
    ROUND(AVG(ds.attendance_rate)::DECIMAL, 2) AS avg_attendance
  FROM deputy_stats ds
  JOIN deputies d ON ds.deputy_id = d.id
  WHERE d.is_active = true;
END;
$$ LANGUAGE plpgsql;

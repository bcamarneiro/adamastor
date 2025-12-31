-- ===================
-- Fix deputy_details view - add missing district_id
-- ===================
-- Migration: 20241231000001_fix_deputy_details_district_id
-- Description: Add district_id column that was accidentally removed in legislature_filtering migration
-- Fixes: 400 errors on district pages (e.g., /distrito/porto)

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
  dist.id AS district_id,
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

-- Grant access
GRANT SELECT ON deputy_details TO anon, authenticated;

COMMENT ON VIEW deputy_details IS 'Deputy details filtered by current legislature (XVII) with district_id for filtering';

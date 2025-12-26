-- Migration: Update deputy_details view to include source tracking
-- Purpose: Expose source information for data traceability in UI

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
  d.biography_id,
  -- Party info
  p.id AS party_id,
  p.acronym AS party_acronym,
  p.name AS party_name,
  p.color AS party_color,
  -- District info
  dist.id AS district_id,
  dist.name AS district_name,
  dist.slug AS district_slug,
  -- Stats
  COALESCE(ds.proposal_count, 0) AS proposal_count,
  COALESCE(ds.intervention_count, 0) AS intervention_count,
  COALESCE(ds.question_count, 0) AS question_count,
  COALESCE(ds.party_votes_favor, 0) AS party_votes_favor,
  COALESCE(ds.party_votes_against, 0) AS party_votes_against,
  COALESCE(ds.party_votes_abstain, 0) AS party_votes_abstain,
  COALESCE(ds.party_total_votes, 0) AS party_total_votes,
  COALESCE(ds.work_score, 0) AS work_score,
  COALESCE(ds.grade, 'N/A') AS grade,
  ds.national_rank,
  ds.district_rank,
  -- Attendance
  ds.attendance_rate,
  ds.meetings_attended,
  ds.meetings_total,
  ds.calculated_at AS stats_updated_at,
  -- Biography
  bio.birth_date,
  bio.profession,
  bio.education,
  bio.bio_narrative,
  bio.source_url AS biography_source_url,
  bio.scraped_at AS biography_scraped_at,
  -- Source tracking
  d.last_synced_at,
  d.source_url AS deputy_source_url,
  src.source_type AS deputy_source_type,
  src.name AS deputy_source_name
FROM deputies d
LEFT JOIN parties p ON d.party_id = p.id
LEFT JOIN districts dist ON d.district_id = dist.id
LEFT JOIN deputy_stats ds ON d.id = ds.deputy_id
LEFT JOIN deputy_biographies bio ON d.id = bio.deputy_id
LEFT JOIN data_sources src ON d.source_id = src.id;

-- Grant access to the view
GRANT SELECT ON deputy_details TO anon, authenticated;

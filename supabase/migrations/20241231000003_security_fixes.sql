-- ===================
-- Security Fixes
-- ===================
-- Migration: 20241231000003_security_fixes
-- Description: Fix security advisor warnings
-- Fixes:
--   - SECURITY DEFINER views (should use SECURITY INVOKER)
--   - RLS disabled on tables created after initial RLS migration

-- ===================
-- FIX 1: Enable RLS on missing tables
-- ===================
-- Tables created in 20241226000001_deputy_extended_info.sql
ALTER TABLE deputy_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deputy_party_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deputy_status_history ENABLE ROW LEVEL SECURITY;

-- Tables created in 20241226000002_add_plenary_attendance.sql
ALTER TABLE plenary_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE plenary_attendance ENABLE ROW LEVEL SECURITY;

-- ===================
-- RLS Policies for new tables
-- ===================
CREATE POLICY "Public read deputy_roles"
  ON deputy_roles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read deputy_party_history"
  ON deputy_party_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read deputy_status_history"
  ON deputy_status_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read plenary_meetings"
  ON plenary_meetings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read plenary_attendance"
  ON plenary_attendance FOR SELECT
  TO anon, authenticated
  USING (true);

-- ===================
-- FIX 2: Recreate views with SECURITY INVOKER
-- ===================
-- By default PostgreSQL views use SECURITY INVOKER, but these views
-- were somehow created with SECURITY DEFINER. We need to recreate them
-- with explicit SECURITY INVOKER to fix the security warnings.

-- deputy_details view
DROP VIEW IF EXISTS deputy_details CASCADE;
CREATE VIEW deputy_details
WITH (security_invoker = true)
AS
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
LEFT JOIN data_sources src ON d.source_id = src.id
WHERE d.legislature = 17;

GRANT SELECT ON deputy_details TO anon, authenticated;

-- rankings view
DROP VIEW IF EXISTS rankings CASCADE;
CREATE VIEW rankings
WITH (security_invoker = true)
AS
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

GRANT SELECT ON rankings TO anon, authenticated;

-- party_stats view
DROP VIEW IF EXISTS party_stats CASCADE;
CREATE VIEW party_stats
WITH (security_invoker = true)
AS
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

GRANT SELECT ON party_stats TO anon, authenticated;

-- district_stats view
DROP VIEW IF EXISTS district_stats CASCADE;
CREATE VIEW district_stats
WITH (security_invoker = true)
AS
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

GRANT SELECT ON district_stats TO anon, authenticated;

-- deputy_attendance_summary view
DROP VIEW IF EXISTS deputy_attendance_summary CASCADE;
CREATE VIEW deputy_attendance_summary
WITH (security_invoker = true)
AS
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

GRANT SELECT ON deputy_attendance_summary TO anon, authenticated;

-- ===================
-- COMMENTS
-- ===================
COMMENT ON VIEW deputy_details IS 'Deputy details filtered by current legislature (XVII) with SECURITY INVOKER';
COMMENT ON VIEW rankings IS 'Deputy rankings filtered by current legislature (XVII) with SECURITY INVOKER';
COMMENT ON VIEW party_stats IS 'Party statistics for current legislature (XVII) with SECURITY INVOKER';
COMMENT ON VIEW district_stats IS 'District statistics for current legislature (XVII) with SECURITY INVOKER';
COMMENT ON VIEW deputy_attendance_summary IS 'Deputy attendance summary for current legislature (XVII) with SECURITY INVOKER';

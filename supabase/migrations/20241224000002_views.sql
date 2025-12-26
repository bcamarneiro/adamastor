-- ===================
-- GOV-PERF Views
-- ===================
-- Migration: 20241224000002_views
-- Description: API views for frontend consumption

-- Deputy with all related data for API
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
LEFT JOIN deputy_stats ds ON d.id = ds.deputy_id;

-- Rankings view
CREATE VIEW rankings AS
SELECT
  d.id,
  d.name,
  d.short_name,
  d.photo_url,
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
ORDER BY ds.work_score DESC;

-- Party aggregates view
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
LEFT JOIN deputies d ON d.party_id = p.id AND d.is_active = true
LEFT JOIN deputy_stats ds ON ds.deputy_id = d.id
GROUP BY p.id, p.acronym, p.name, p.color
ORDER BY avg_work_score DESC NULLS LAST;

-- District aggregates view
CREATE VIEW district_stats AS
SELECT
  dist.id,
  dist.name,
  dist.deputy_count AS seat_count,
  COUNT(d.id) AS active_deputies,
  ROUND(AVG(ds.work_score)::numeric, 2) AS avg_work_score,
  ROUND(AVG(ds.attendance_rate)::numeric, 2) AS avg_attendance_rate
FROM districts dist
LEFT JOIN deputies d ON d.district_id = dist.id AND d.is_active = true
LEFT JOIN deputy_stats ds ON ds.deputy_id = d.id
GROUP BY dist.id, dist.name, dist.deputy_count
ORDER BY avg_work_score DESC NULLS LAST;

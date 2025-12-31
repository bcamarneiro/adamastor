-- Fix party_stats view to include total_questions column
-- Issue #74: All parties show 0 questions because the column was missing from the view

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
  SUM(ds.intervention_count) AS total_interventions,
  SUM(ds.question_count) AS total_questions
FROM parties p
LEFT JOIN deputies d ON d.party_id = p.id AND d.is_active = true AND d.legislature = 17
LEFT JOIN deputy_stats ds ON ds.deputy_id = d.id
GROUP BY p.id, p.acronym, p.name, p.color
HAVING COUNT(d.id) > 0
ORDER BY avg_work_score DESC NULLS LAST;

GRANT SELECT ON party_stats TO anon, authenticated;

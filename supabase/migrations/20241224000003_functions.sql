-- ===================
-- GOV-PERF Functions
-- ===================
-- Migration: 20241224000003_functions
-- Description: PostgreSQL functions for work score calculation and utilities

-- Calculate Work Score
-- Formula: attendance (40%) + proposals (30%) + interventions (20%) + questions (10%)
-- Individual components capped at 200% to prevent outliers
CREATE OR REPLACE FUNCTION calculate_work_score(
  p_attendance DECIMAL,
  p_proposals DECIMAL,
  p_avg_proposals DECIMAL,
  p_interventions DECIMAL,
  p_avg_interventions DECIMAL,
  p_questions DECIMAL,
  p_avg_questions DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND((
    COALESCE(p_attendance, 0) * 0.40 +
    LEAST(COALESCE(p_proposals / NULLIF(p_avg_proposals, 0), 0) * 100, 200) * 0.30 +
    LEAST(COALESCE(p_interventions / NULLIF(p_avg_interventions, 0), 0) * 100, 200) * 0.20 +
    LEAST(COALESCE(p_questions / NULLIF(p_avg_questions, 0), 0) * 100, 200) * 0.10
  ), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Score to Grade conversion
-- A >= 85, B >= 70, C >= 55, D >= 40, F < 40
CREATE OR REPLACE FUNCTION score_to_grade(score DECIMAL) RETURNS CHAR(1) AS $$
BEGIN
  RETURN CASE
    WHEN score >= 85 THEN 'A'
    WHEN score >= 70 THEN 'B'
    WHEN score >= 55 THEN 'C'
    WHEN score >= 40 THEN 'D'
    ELSE 'F'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find district by postal code prefix
CREATE OR REPLACE FUNCTION find_district_by_postal(postal_code TEXT)
RETURNS UUID AS $$
DECLARE
  prefix TEXT;
  district_id UUID;
BEGIN
  prefix := LEFT(postal_code, 4);
  SELECT id INTO district_id
  FROM districts
  WHERE prefix = ANY(postal_prefixes)
  LIMIT 1;
  RETURN district_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get national averages (for API and calculations)
CREATE OR REPLACE FUNCTION get_national_averages()
RETURNS json AS $$
SELECT json_build_object(
  'avg_attendance_rate', ROUND(AVG(ds.attendance_rate)::numeric, 1),
  'avg_proposal_count', ROUND(AVG(ds.proposal_count)::numeric, 1),
  'avg_intervention_count', ROUND(AVG(ds.intervention_count)::numeric, 1),
  'avg_question_count', ROUND(AVG(ds.question_count)::numeric, 1),
  'avg_work_score', ROUND(AVG(ds.work_score)::numeric, 1),
  'total_deputies', COUNT(*),
  'total_active_deputies', COUNT(*) FILTER (WHERE d.is_active),
  'absence_rate', ROUND(100 - AVG(ds.attendance_rate)::numeric, 1)
)
FROM deputy_stats ds
JOIN deputies d ON ds.deputy_id = d.id;
$$ LANGUAGE sql STABLE;

-- Recalculate all stats (run after sync)
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

  -- Update all work scores
  UPDATE deputy_stats ds
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
    calculated_at = NOW();

  -- Update grades
  UPDATE deputy_stats
  SET grade = score_to_grade(work_score);

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
$$ LANGUAGE plpgsql;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_parties_updated_at
  BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deputies_updated_at
  BEFORE UPDATE ON deputies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_initiatives_updated_at
  BEFORE UPDATE ON initiatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

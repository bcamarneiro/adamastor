-- ===================
-- Add Ranking Constraint
-- ===================
-- Migration: 20260207112300_add_ranking_constraint
-- Description: Add database-level validation to prevent ranking values from exceeding active deputy count
-- Fixes: Issue #85
-- Context: PR #77 fixed recalculate_all_stats() to only rank active deputies,
--          but nothing prevents invalid data from being inserted directly.

-- ===================
-- VALIDATION FUNCTION
-- ===================
CREATE OR REPLACE FUNCTION validate_deputy_ranking()
RETURNS TRIGGER AS $$
DECLARE
  deputy_record RECORD;
  max_national_rank INTEGER;
  max_district_rank INTEGER;
BEGIN
  -- Skip validation if both ranks are NULL (allowed for inactive deputies)
  IF NEW.national_rank IS NULL AND NEW.district_rank IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get deputy information (district, legislature, active status)
  SELECT d.district_id, d.legislature, d.is_active
  INTO deputy_record
  FROM deputies d
  WHERE d.id = NEW.deputy_id;

  -- If deputy doesn't exist, let FK constraint handle it
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Inactive deputies should not have rankings
  IF deputy_record.is_active = false THEN
    IF NEW.national_rank IS NOT NULL OR NEW.district_rank IS NOT NULL THEN
      RAISE EXCEPTION 'Inactive deputies cannot have rankings (deputy_id: %)', NEW.deputy_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Validate national_rank
  IF NEW.national_rank IS NOT NULL THEN
    SELECT COUNT(*)
    INTO max_national_rank
    FROM deputies
    WHERE is_active = true
      AND legislature = deputy_record.legislature;

    IF NEW.national_rank > max_national_rank THEN
      RAISE EXCEPTION 'national_rank (%) exceeds active deputy count (%) for legislature %',
        NEW.national_rank, max_national_rank, deputy_record.legislature;
    END IF;

    IF NEW.national_rank < 1 THEN
      RAISE EXCEPTION 'national_rank must be >= 1, got %', NEW.national_rank;
    END IF;
  END IF;

  -- Validate district_rank
  IF NEW.district_rank IS NOT NULL THEN
    SELECT COUNT(*)
    INTO max_district_rank
    FROM deputies
    WHERE is_active = true
      AND legislature = deputy_record.legislature
      AND district_id = deputy_record.district_id;

    IF NEW.district_rank > max_district_rank THEN
      RAISE EXCEPTION 'district_rank (%) exceeds active deputy count (%) for district_id %',
        NEW.district_rank, max_district_rank, deputy_record.district_id;
    END IF;

    IF NEW.district_rank < 1 THEN
      RAISE EXCEPTION 'district_rank must be >= 1, got %', NEW.district_rank;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public
SECURITY DEFINER;

-- ===================
-- TRIGGER
-- ===================
DROP TRIGGER IF EXISTS validate_ranking_before_upsert ON deputy_stats;

CREATE TRIGGER validate_ranking_before_upsert
  BEFORE INSERT OR UPDATE OF national_rank, district_rank
  ON deputy_stats
  FOR EACH ROW
  EXECUTE FUNCTION validate_deputy_ranking();

-- ===================
-- PERMISSIONS
-- ===================
GRANT EXECUTE ON FUNCTION validate_deputy_ranking() TO service_role;

-- ===================
-- COMMENTS
-- ===================
COMMENT ON FUNCTION validate_deputy_ranking() IS 
'Validates that deputy rankings do not exceed the number of active deputies in their legislature/district. 
Prevents data integrity issues when stats are inserted/updated outside of recalculate_all_stats().
Inactive deputies must have NULL rankings.';

COMMENT ON TRIGGER validate_ranking_before_upsert ON deputy_stats IS
'Enforces ranking constraints before insert/update to prevent invalid ranking values (Issue #85)';

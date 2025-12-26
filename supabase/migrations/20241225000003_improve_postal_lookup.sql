-- ===================
-- Improve postal code lookup
-- ===================
-- Migration: 20241225000003_improve_postal_lookup
-- Description: Make postal code lookup more flexible by matching ranges

-- Drop and recreate the function with improved logic
CREATE OR REPLACE FUNCTION find_district_by_postal(postal_code TEXT)
RETURNS UUID AS $$
DECLARE
  prefix TEXT;
  district_id UUID;
BEGIN
  prefix := LEFT(postal_code, 4);

  -- First try exact match
  SELECT id INTO district_id
  FROM districts
  WHERE prefix = ANY(postal_prefixes)
  LIMIT 1;

  IF district_id IS NOT NULL THEN
    RETURN district_id;
  END IF;

  -- If no exact match, find the district where the postal code falls within a range
  -- This works by finding prefixes that are close (same first 2-3 digits)
  SELECT id INTO district_id
  FROM districts
  WHERE EXISTS (
    SELECT 1 FROM unnest(postal_prefixes) AS p
    WHERE LEFT(p, 2) = LEFT(prefix, 2)
      AND p::integer <= prefix::integer
  )
  ORDER BY (
    SELECT MAX(p::integer)
    FROM unnest(postal_prefixes) AS p
    WHERE LEFT(p, 2) = LEFT(prefix, 2)
      AND p::integer <= prefix::integer
  ) DESC
  LIMIT 1;

  RETURN district_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================
-- Legislature Auto-Detection Config
-- ===================
-- Migration: 20260102131038_add_legislature_config
-- Description: Add table to store auto-detected legislature from API data
-- Related Issue: #6

-- ===================
-- CREATE LEGISLATURE_CONFIG TABLE
-- ===================

CREATE TABLE IF NOT EXISTS legislature_config (
  id SERIAL PRIMARY KEY,
  legislature_number INTEGER NOT NULL,
  legislature_roman TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_from TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one active legislature record
CREATE UNIQUE INDEX IF NOT EXISTS idx_legislature_config_active 
  ON legislature_config (is_active) 
  WHERE is_active = true;

-- Index for querying by legislature number
CREATE INDEX IF NOT EXISTS idx_legislature_config_number 
  ON legislature_config (legislature_number);

-- ===================
-- HELPER FUNCTIONS
-- ===================

-- Get current active legislature number
CREATE OR REPLACE FUNCTION get_current_legislature()
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result INTEGER;
BEGIN
  SELECT legislature_number INTO result
  FROM legislature_config
  WHERE is_active = true
  LIMIT 1;
  
  -- Fallback to 17 (XVII) if no config exists
  RETURN COALESCE(result, 17);
END;
$$;

-- Set current legislature (deactivates previous, activates new)
CREATE OR REPLACE FUNCTION set_current_legislature(
  p_legislature_number INTEGER,
  p_legislature_roman TEXT,
  p_detected_from TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Deactivate all existing records
  UPDATE legislature_config
  SET is_active = false
  WHERE is_active = true;
  
  -- Insert new active record
  INSERT INTO legislature_config (
    legislature_number,
    legislature_roman,
    detected_from,
    is_active
  ) VALUES (
    p_legislature_number,
    p_legislature_roman,
    p_detected_from,
    true
  );
END;
$$;

-- ===================
-- COMMENTS
-- ===================

COMMENT ON TABLE legislature_config IS 'Stores auto-detected legislature from Parliament API data';
COMMENT ON COLUMN legislature_config.legislature_number IS 'Numeric legislature (e.g., 17 for XVII)';
COMMENT ON COLUMN legislature_config.legislature_roman IS 'Roman numeral representation (e.g., XVII)';
COMMENT ON COLUMN legislature_config.detected_from IS 'Source of detection (e.g., DetalheLegislatura.sigla)';
COMMENT ON COLUMN legislature_config.is_active IS 'Only one record should be active at a time';
COMMENT ON FUNCTION get_current_legislature() IS 'Returns the current active legislature number, defaults to 17 if none set';
COMMENT ON FUNCTION set_current_legislature(INTEGER, TEXT, TEXT) IS 'Sets the current legislature, deactivating previous records';


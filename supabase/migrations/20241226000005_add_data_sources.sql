-- Migration: Add data sources table and tracking columns
-- Purpose: Enable full traceability of all data to its original source

-- Create data_sources reference table
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'scraper')),
  base_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

-- Read-only policy for public access
CREATE POLICY "Public read access for data sources"
  ON data_sources
  FOR SELECT
  TO public
  USING (true);

-- Seed with known data sources
INSERT INTO data_sources (code, name, source_type, base_url, description) VALUES
  ('parliament_api_base', 'Parliament API - Base Info', 'api',
   'https://app.parlamento.pt/webutils/docs/doc.txt?path=...',
   'Deputies, parties, districts, roles, status history'),
  ('parliament_api_initiatives', 'Parliament API - Initiatives', 'api',
   'https://app.parlamento.pt/webutils/docs/doc.txt?path=...',
   'Legislative proposals, votes, and voting records'),
  ('parliament_api_activities', 'Parliament API - Activities', 'api',
   'https://app.parlamento.pt/webutils/docs/doc.txt?path=...',
   'Parliamentary debates and interventions'),
  ('parliament_scraper_attendance', 'Parliament Scraper - Attendance', 'scraper',
   'https://www.parlamento.pt/DeputadoGP/Paginas/reunioesplenarias.aspx',
   'Plenary meeting attendance records'),
  ('parliament_scraper_biography', 'Parliament Scraper - Biography', 'scraper',
   'https://www.parlamento.pt/DeputadoGP/Paginas/Biografia.aspx',
   'Deputy biographies, education, profession'),
  ('parliament_api_photos', 'Parliament API - Photos', 'api',
   'https://app.parlamento.pt/webutils/getimage.aspx',
   'Deputy profile photos');

-- Add source tracking columns to deputies table
ALTER TABLE deputies
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id),
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add source tracking to deputy_stats
ALTER TABLE deputy_stats
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id);

-- Add source tracking to initiatives (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'initiatives') THEN
    ALTER TABLE initiatives
      ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id),
      ADD COLUMN IF NOT EXISTS source_url TEXT;
  END IF;
END $$;

-- Add source tracking to party_votes
ALTER TABLE party_votes
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id);

-- Add source tracking to plenary_attendance
ALTER TABLE plenary_attendance
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id);

-- Add source tracking to plenary_meetings
ALTER TABLE plenary_meetings
  ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES data_sources(id);

-- Create index for fast lookups by source
CREATE INDEX IF NOT EXISTS idx_deputies_source_id ON deputies(source_id);
CREATE INDEX IF NOT EXISTS idx_deputy_stats_source_id ON deputy_stats(source_id);
CREATE INDEX IF NOT EXISTS idx_party_votes_source_id ON party_votes(source_id);
CREATE INDEX IF NOT EXISTS idx_plenary_attendance_source_id ON plenary_attendance(source_id);
CREATE INDEX IF NOT EXISTS idx_plenary_meetings_source_id ON plenary_meetings(source_id);

-- Create helper function to get source_id by code
CREATE OR REPLACE FUNCTION get_data_source_id(source_code TEXT)
RETURNS UUID AS $$
  SELECT id FROM data_sources WHERE code = source_code;
$$ LANGUAGE sql STABLE;

-- Grant access
GRANT SELECT ON data_sources TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_data_source_id(TEXT) TO anon, authenticated;

COMMENT ON TABLE data_sources IS 'Reference table for all data sources used in the system';
COMMENT ON FUNCTION get_data_source_id(TEXT) IS 'Helper function to get source UUID from code';

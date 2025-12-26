-- Migration: Add deputy biographies table
-- Purpose: Store biographical information scraped from Parliament website
-- Source: https://www.parlamento.pt/DeputadoGP/Paginas/Biografia.aspx?BID={biography_id}

-- Create deputy_biographies table
CREATE TABLE deputy_biographies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputy_id UUID UNIQUE NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
  birth_date DATE,
  profession TEXT,
  education TEXT,
  bio_narrative TEXT,
  source_url TEXT NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for lookups
CREATE INDEX idx_deputy_biographies_deputy_id ON deputy_biographies(deputy_id);

-- Enable RLS
ALTER TABLE deputy_biographies ENABLE ROW LEVEL SECURITY;

-- Read-only policy for public access
CREATE POLICY "Public read access for deputy biographies"
  ON deputy_biographies
  FOR SELECT
  TO public
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER set_deputy_biographies_updated_at
  BEFORE UPDATE ON deputy_biographies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update deputy_details view to include biography info
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
  bio.scraped_at AS biography_scraped_at
FROM deputies d
LEFT JOIN parties p ON d.party_id = p.id
LEFT JOIN districts dist ON d.district_id = dist.id
LEFT JOIN deputy_stats ds ON d.id = ds.deputy_id
LEFT JOIN deputy_biographies bio ON d.id = bio.deputy_id;

-- Grant access to the view
GRANT SELECT ON deputy_details TO anon, authenticated;

COMMENT ON TABLE deputy_biographies IS 'Biographical information for deputies, scraped from Parliament website';
COMMENT ON COLUMN deputy_biographies.source_url IS 'URL of the biography page for data traceability';
COMMENT ON COLUMN deputy_biographies.scraped_at IS 'When this biography was last scraped';

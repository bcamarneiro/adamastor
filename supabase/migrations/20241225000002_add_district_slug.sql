-- ===================
-- Add slug column to districts
-- ===================
-- Migration: 20241225000002_add_district_slug
-- Description: Add URL-friendly slug column to districts table

-- Add slug column
ALTER TABLE districts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs from names (manually set for special characters)
UPDATE districts SET slug = CASE name
  WHEN 'Açores' THEN 'acores'
  WHEN 'Bragança' THEN 'braganca'
  WHEN 'Évora' THEN 'evora'
  WHEN 'Santarém' THEN 'santarem'
  WHEN 'Setúbal' THEN 'setubal'
  WHEN 'Castelo Branco' THEN 'castelo-branco'
  WHEN 'Viana do Castelo' THEN 'viana-do-castelo'
  WHEN 'Vila Real' THEN 'vila-real'
  WHEN 'Fora da Europa' THEN 'fora-da-europa'
  ELSE LOWER(name)
END;

-- Make slug unique and not null
ALTER TABLE districts ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS districts_slug_key ON districts(slug);

-- Update deputy_details view to include district_slug
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
  p.id AS party_id,
  p.acronym AS party_acronym,
  p.name AS party_name,
  p.color AS party_color,
  dist.id AS district_id,
  dist.name AS district_name,
  dist.slug AS district_slug,
  ds.work_score,
  ds.grade,
  ds.national_rank,
  ds.district_rank,
  ds.proposal_count,
  ds.intervention_count,
  ds.question_count,
  ds.party_votes_favor,
  ds.party_votes_against,
  ds.party_votes_abstain,
  ds.party_total_votes,
  ds.calculated_at AS stats_updated_at
FROM deputies d
LEFT JOIN parties p ON d.party_id = p.id
LEFT JOIN districts dist ON d.district_id = dist.id
LEFT JOIN deputy_stats ds ON d.id = ds.deputy_id;

-- Grant access to the view
GRANT SELECT ON deputy_details TO anon, authenticated;

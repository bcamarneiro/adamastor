-- Performance indexes for common queries
-- These indexes optimize the most frequent access patterns

-- Deputy ranking queries (leaderboards)
CREATE INDEX IF NOT EXISTS idx_deputy_stats_work_score
  ON deputy_stats(work_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_deputy_stats_national_rank
  ON deputy_stats(national_rank ASC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_deputy_stats_district_rank
  ON deputy_stats(district_id, district_rank ASC NULLS LAST);

-- Deputy lookups
CREATE INDEX IF NOT EXISTS idx_deputies_external_id
  ON deputies(external_id);

CREATE INDEX IF NOT EXISTS idx_deputies_party_id
  ON deputies(party_id);

CREATE INDEX IF NOT EXISTS idx_deputies_district_id
  ON deputies(district_id);

CREATE INDEX IF NOT EXISTS idx_deputies_is_active
  ON deputies(is_active) WHERE is_active = true;

-- Initiative queries
CREATE INDEX IF NOT EXISTS idx_initiatives_submitted_at
  ON initiatives(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_initiatives_external_id
  ON initiatives(external_id);

CREATE INDEX IF NOT EXISTS idx_initiatives_type
  ON initiatives(type);

-- Vote lookups
CREATE INDEX IF NOT EXISTS idx_party_votes_initiative_id
  ON party_votes(initiative_id);

CREATE INDEX IF NOT EXISTS idx_party_votes_party_id
  ON party_votes(party_id);

-- Attendance queries
CREATE INDEX IF NOT EXISTS idx_plenary_attendance_deputy_id
  ON plenary_attendance(deputy_id);

CREATE INDEX IF NOT EXISTS idx_plenary_attendance_meeting_date
  ON plenary_attendance(meeting_date DESC);

-- District postal code lookups
CREATE INDEX IF NOT EXISTS idx_district_postal_ranges_prefix
  ON district_postal_ranges(postal_prefix);

-- Composite indexes for common joins
CREATE INDEX IF NOT EXISTS idx_deputies_active_party
  ON deputies(party_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_deputy_stats_deputy_id
  ON deputy_stats(deputy_id);

-- Add comment explaining indexes
COMMENT ON INDEX idx_deputy_stats_work_score IS 'Optimizes national leaderboard queries';
COMMENT ON INDEX idx_deputy_stats_district_rank IS 'Optimizes district-specific leaderboards';
COMMENT ON INDEX idx_deputies_is_active IS 'Partial index for active deputy queries';

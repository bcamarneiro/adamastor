-- ===================
-- GOV-PERF Row Level Security
-- ===================
-- Migration: 20241224000004_rls
-- Description: RLS policies for API access control

-- Enable RLS on all tables
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deputies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deputy_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- ===================
-- PUBLIC READ ACCESS
-- ===================
-- Anon users can read all public data

CREATE POLICY "Public read parties"
  ON parties FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read districts"
  ON districts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read deputies"
  ON deputies FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read sessions"
  ON sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read initiatives"
  ON initiatives FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read initiative_authors"
  ON initiative_authors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read votes"
  ON votes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read interventions"
  ON interventions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read deputy_stats"
  ON deputy_stats FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read sync_runs"
  ON sync_runs FOR SELECT
  TO anon, authenticated
  USING (true);

-- ===================
-- RESTRICTED ACCESS
-- ===================
-- Audit events: no public access (only service role can read)

-- No policy for audit_events = no anon/authenticated access
-- Service role bypasses RLS

-- ===================
-- SERVICE ROLE WRITES
-- ===================
-- All writes happen via service role which bypasses RLS
-- This is the default behavior - no explicit policies needed

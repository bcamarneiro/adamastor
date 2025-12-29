-- =============================================================================
-- Sync State Table
-- =============================================================================
-- Tracks the hash of each dataset to detect changes between syncs.
-- Used to skip transform steps when data hasn't changed.

CREATE TABLE sync_state (
  dataset TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  file_size BIGINT,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  last_changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_sync_state_last_synced ON sync_state(last_synced_at DESC);

COMMENT ON TABLE sync_state IS 'Tracks dataset hashes to enable incremental syncs';
COMMENT ON COLUMN sync_state.dataset IS 'Dataset name (e.g., informacao_base, iniciativas)';
COMMENT ON COLUMN sync_state.hash IS 'SHA256 hash of the dataset file';
COMMENT ON COLUMN sync_state.file_size IS 'File size in bytes for quick change detection';
COMMENT ON COLUMN sync_state.last_synced_at IS 'When this dataset was last checked';
COMMENT ON COLUMN sync_state.last_changed_at IS 'When this dataset last had different content';

-- =============================================================================
-- RLS Policies
-- =============================================================================
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read sync_state"
  ON sync_state FOR SELECT
  TO public
  USING (true);

-- Allow service role full access (for watcher)
CREATE POLICY "Service role full access sync_state"
  ON sync_state FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

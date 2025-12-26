-- ===================
-- Plenary Attendance Tracking
-- ===================
-- Migration: 20241226000002_add_plenary_attendance
-- Description: Track individual deputy attendance at plenary meetings

-- ===================
-- ADD BIOGRAPHY ID TO DEPUTIES
-- ===================
-- The Parliament website uses a separate "BID" (biography ID) for attendance pages
-- This is different from DepId and DepCadId

ALTER TABLE deputies
ADD COLUMN IF NOT EXISTS biography_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_deputies_biography_id ON deputies(biography_id);

-- ===================
-- PLENARY MEETINGS TABLE
-- ===================

CREATE TABLE plenary_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id INTEGER UNIQUE NOT NULL,  -- BID from Parliament website
  meeting_date DATE NOT NULL,
  legislature INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plenary_meetings_date ON plenary_meetings(meeting_date);
CREATE INDEX idx_plenary_meetings_legislature ON plenary_meetings(legislature);

-- ===================
-- PLENARY ATTENDANCE TABLE
-- ===================

CREATE TABLE plenary_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deputy_id UUID NOT NULL REFERENCES deputies(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES plenary_meetings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,  -- 'present', 'absent_quorum', 'absent_justified', 'absent_unjustified'
  status_raw TEXT,  -- Original text from Parliament (e.g., "Presença (P)")
  reason TEXT,  -- Justification for absence if provided
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deputy_id, meeting_id)
);

CREATE INDEX idx_plenary_attendance_deputy ON plenary_attendance(deputy_id);
CREATE INDEX idx_plenary_attendance_meeting ON plenary_attendance(meeting_id);
CREATE INDEX idx_plenary_attendance_status ON plenary_attendance(status);

-- ===================
-- UPDATE DEPUTY_STATS
-- ===================
-- Add fields for plenary attendance tracking
-- Note: total_sessions and sessions_attended already exist but are unused

-- Add meetings_attended, meetings_total, and attendance_rate for clarity
ALTER TABLE deputy_stats
ADD COLUMN IF NOT EXISTS meetings_attended INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meetings_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5,2) DEFAULT 0;

-- ===================
-- HELPER VIEW
-- ===================

CREATE OR REPLACE VIEW deputy_attendance_summary AS
SELECT
  d.id as deputy_id,
  d.name,
  d.short_name,
  p.acronym as party,
  COUNT(pa.id) as total_meetings,
  COUNT(CASE WHEN pa.status = 'present' THEN 1 END) as meetings_present,
  COUNT(CASE WHEN pa.status != 'present' THEN 1 END) as meetings_absent,
  ROUND(
    CASE
      WHEN COUNT(pa.id) > 0
      THEN (COUNT(CASE WHEN pa.status = 'present' THEN 1 END)::DECIMAL / COUNT(pa.id)) * 100
      ELSE 0
    END,
    1
  ) as attendance_rate
FROM deputies d
LEFT JOIN plenary_attendance pa ON pa.deputy_id = d.id
LEFT JOIN parties p ON d.party_id = p.id
WHERE d.is_active = true
GROUP BY d.id, d.name, d.short_name, p.acronym;

-- ===================
-- UPDATE RECALCULATE_ALL_STATS FUNCTION
-- ===================

CREATE OR REPLACE FUNCTION recalculate_all_stats()
RETURNS void AS $$
BEGIN
  -- Update raw counts from views
  UPDATE deputy_stats ds
  SET
    proposal_count = COALESCE(v.proposal_count, 0),
    intervention_count = COALESCE(ds.intervention_count, 0),  -- Keep existing value
    question_count = COALESCE(ds.question_count, 0),  -- Keep existing value
    -- Update attendance from plenary attendance
    meetings_attended = COALESCE(att.meetings_present, 0),
    meetings_total = COALESCE(att.total_meetings, 0),
    attendance_rate = COALESCE(att.attendance_rate, 0),
    -- Recalculate work score
    work_score = ROUND(
      (
        COALESCE(v.proposal_count, 0) * 10.0 +  -- 10 points per proposal
        COALESCE(ds.intervention_count, 0) * 2.0 +  -- 2 points per intervention
        COALESCE(ds.question_count, 0) * 5.0 +  -- 5 points per question
        COALESCE(att.attendance_rate, 0) * 0.5  -- 0.5 points per attendance %
      ) / 10.0,  -- Normalize
      2
    ),
    calculated_at = NOW()
  FROM deputy_proposal_counts v
  LEFT JOIN deputy_attendance_summary att ON att.deputy_id = ds.deputy_id
  WHERE v.deputy_id = ds.deputy_id;

  -- Update grades based on work score
  UPDATE deputy_stats
  SET grade = CASE
    WHEN work_score >= 80 THEN 'A'
    WHEN work_score >= 60 THEN 'B'
    WHEN work_score >= 40 THEN 'C'
    WHEN work_score >= 20 THEN 'D'
    ELSE 'F'
  END;

  -- Update national rankings
  WITH ranked AS (
    SELECT deputy_id, ROW_NUMBER() OVER (ORDER BY work_score DESC) as rank
    FROM deputy_stats
  )
  UPDATE deputy_stats ds
  SET national_rank = r.rank
  FROM ranked r
  WHERE ds.deputy_id = r.deputy_id;

  -- Update district rankings
  WITH district_ranked AS (
    SELECT
      ds.deputy_id,
      ROW_NUMBER() OVER (
        PARTITION BY d.district_id
        ORDER BY ds.work_score DESC
      ) as rank
    FROM deputy_stats ds
    JOIN deputies d ON ds.deputy_id = d.id
  )
  UPDATE deputy_stats ds
  SET district_rank = dr.rank
  FROM district_ranked dr
  WHERE ds.deputy_id = dr.deputy_id;
END;
$$ LANGUAGE plpgsql;

-- ===================
-- GOV-PERF E2E Test Fixtures
-- ===================
-- DETERMINISTIC test data for Playwright E2E tests.
-- This data is FIXED and predictable for reliable assertions.
--
-- IMPORTANT: If this file fails to INSERT, it means the schema has changed.
-- Update this file to match the new schema columns.
--
-- Run with: psql $DATABASE_URL -f supabase/seed-e2e.sql
-- Or in CI: The db-migrations job validates this against current schema.

-- ===================
-- CLEANUP (for re-runs)
-- ===================
-- Delete E2E test data (identifiable by E2E- prefix)
DELETE FROM deputy_stats WHERE deputy_id IN (SELECT id FROM deputies WHERE external_id LIKE 'E2E-%');
DELETE FROM interventions WHERE deputy_id IN (SELECT id FROM deputies WHERE external_id LIKE 'E2E-%');
DELETE FROM initiative_authors WHERE deputy_id IN (SELECT id FROM deputies WHERE external_id LIKE 'E2E-%');
DELETE FROM deputy_roles WHERE deputy_id IN (SELECT id FROM deputies WHERE external_id LIKE 'E2E-%');
DELETE FROM deputy_party_history WHERE deputy_id IN (SELECT id FROM deputies WHERE external_id LIKE 'E2E-%');
DELETE FROM deputy_status_history WHERE deputy_id IN (SELECT id FROM deputies WHERE external_id LIKE 'E2E-%');
DELETE FROM plenary_attendance WHERE deputy_id IN (SELECT id FROM deputies WHERE external_id LIKE 'E2E-%');
DELETE FROM deputies WHERE external_id LIKE 'E2E-%';
DELETE FROM initiatives WHERE external_id LIKE 'E2E-%';
DELETE FROM sessions WHERE external_id LIKE 'E2E-%';
DELETE FROM plenary_meetings WHERE external_id::TEXT LIKE 'E2E%';

-- ===================
-- E2E TEST DEPUTIES
-- ===================
-- These have known values for predictable test assertions

-- Deputy 1: High performer (Grade A) - Active in Lisboa
INSERT INTO deputies (
  external_id, name, short_name, party_id, district_id,
  is_active, legislature, biography_id, mandate_start
)
SELECT
  'E2E-ALPHA-001',
  'Ana Alpha',
  'A. Alpha',
  (SELECT id FROM parties WHERE acronym = 'PS'),
  (SELECT id FROM districts WHERE slug = 'lisboa'),
  true,
  16,
  999001,
  '2024-01-01'::DATE;

-- Deputy 2: Medium performer (Grade C) - Active in Porto
INSERT INTO deputies (
  external_id, name, short_name, party_id, district_id,
  is_active, legislature, biography_id, mandate_start
)
SELECT
  'E2E-BETA-002',
  'Bruno Beta',
  'B. Beta',
  (SELECT id FROM parties WHERE acronym = 'PSD'),
  (SELECT id FROM districts WHERE slug = 'porto'),
  true,
  16,
  999002,
  '2024-01-01'::DATE;

-- Deputy 3: Low performer (Grade F) - Active in Braga
INSERT INTO deputies (
  external_id, name, short_name, party_id, district_id,
  is_active, legislature, biography_id, mandate_start
)
SELECT
  'E2E-GAMMA-003',
  'Carlos Gamma',
  'C. Gamma',
  (SELECT id FROM parties WHERE acronym = 'CH'),
  (SELECT id FROM districts WHERE slug = 'braga'),
  true,
  16,
  999003,
  '2024-01-01'::DATE;

-- Deputy 4: Inactive deputy (for edge case testing)
INSERT INTO deputies (
  external_id, name, short_name, party_id, district_id,
  is_active, legislature, biography_id, mandate_start, mandate_end
)
SELECT
  'E2E-DELTA-004',
  'Diana Delta',
  'D. Delta',
  (SELECT id FROM parties WHERE acronym = 'BE'),
  (SELECT id FROM districts WHERE slug = 'faro'),
  false,
  16,
  999004,
  '2024-01-01'::DATE,
  '2024-06-15'::DATE;

-- ===================
-- DEPUTY STATS (Predictable scores for leaderboard tests)
-- ===================

-- Ana Alpha: High performer - Grade A, Rank 1
INSERT INTO deputy_stats (
  deputy_id,
  proposal_count, intervention_count, question_count,
  party_votes_favor, party_votes_against, party_votes_abstain, party_total_votes,
  meetings_attended, meetings_total, attendance_rate,
  work_score, grade, national_rank, district_rank
)
SELECT
  d.id,
  25,   -- proposal_count (high)
  100,  -- intervention_count (high)
  15,   -- question_count (high)
  85,   -- party_votes_favor
  10,   -- party_votes_against
  5,    -- party_votes_abstain
  100,  -- party_total_votes
  45,   -- meetings_attended
  50,   -- meetings_total
  90.0, -- attendance_rate
  150.0, -- work_score (high)
  'A',  -- grade
  1,    -- national_rank
  1     -- district_rank (Lisboa)
FROM deputies d WHERE d.external_id = 'E2E-ALPHA-001';

-- Bruno Beta: Medium performer - Grade C, Rank 2
INSERT INTO deputy_stats (
  deputy_id,
  proposal_count, intervention_count, question_count,
  party_votes_favor, party_votes_against, party_votes_abstain, party_total_votes,
  meetings_attended, meetings_total, attendance_rate,
  work_score, grade, national_rank, district_rank
)
SELECT
  d.id,
  8,    -- proposal_count (medium)
  40,   -- intervention_count (medium)
  5,    -- question_count (medium)
  70,   -- party_votes_favor
  20,   -- party_votes_against
  10,   -- party_votes_abstain
  100,  -- party_total_votes
  35,   -- meetings_attended
  50,   -- meetings_total
  70.0, -- attendance_rate
  65.0, -- work_score (medium)
  'C',  -- grade
  2,    -- national_rank
  1     -- district_rank (Porto)
FROM deputies d WHERE d.external_id = 'E2E-BETA-002';

-- Carlos Gamma: Low performer - Grade F, Rank 3
INSERT INTO deputy_stats (
  deputy_id,
  proposal_count, intervention_count, question_count,
  party_votes_favor, party_votes_against, party_votes_abstain, party_total_votes,
  meetings_attended, meetings_total, attendance_rate,
  work_score, grade, national_rank, district_rank
)
SELECT
  d.id,
  1,    -- proposal_count (low)
  5,    -- intervention_count (low)
  0,    -- question_count (none)
  60,   -- party_votes_favor
  30,   -- party_votes_against
  10,   -- party_votes_abstain
  100,  -- party_total_votes
  15,   -- meetings_attended
  50,   -- meetings_total
  30.0, -- attendance_rate
  15.0, -- work_score (low)
  'F',  -- grade
  3,    -- national_rank
  1     -- district_rank (Braga)
FROM deputies d WHERE d.external_id = 'E2E-GAMMA-003';

-- Diana Delta: Inactive deputy stats
INSERT INTO deputy_stats (
  deputy_id,
  proposal_count, intervention_count, question_count,
  party_votes_favor, party_votes_against, party_votes_abstain, party_total_votes,
  meetings_attended, meetings_total, attendance_rate,
  work_score, grade, national_rank, district_rank
)
SELECT
  d.id,
  3, 15, 2,
  40, 15, 5, 60,
  20, 30, 66.7,
  45.0, 'D', 4, 1
FROM deputies d WHERE d.external_id = 'E2E-DELTA-004';

-- ===================
-- INITIATIVES (For proposal/voting tests)
-- ===================

INSERT INTO initiatives (external_id, title, number, type, type_desc, status, submitted_at, legislature)
VALUES
  ('E2E-INIT-001', 'E2E Test: Lei de Teste Alpha', 'PL 999/XVI', 'PL', 'Projeto de Lei', 'approved', '2024-03-15', 16),
  ('E2E-INIT-002', 'E2E Test: Lei de Teste Beta', 'PL 998/XVI', 'PL', 'Projeto de Lei', 'pending', '2024-04-01', 16),
  ('E2E-INIT-003', 'E2E Test: Resolucao Gamma', 'PR 500/XVI', 'PR', 'Projeto de Resolucao', 'rejected', '2024-02-20', 16);

-- Link initiatives to authors
INSERT INTO initiative_authors (initiative_id, deputy_id)
SELECT i.id, d.id FROM initiatives i, deputies d
WHERE i.external_id = 'E2E-INIT-001' AND d.external_id = 'E2E-ALPHA-001';

INSERT INTO initiative_authors (initiative_id, deputy_id)
SELECT i.id, d.id FROM initiatives i, deputies d
WHERE i.external_id = 'E2E-INIT-002' AND d.external_id = 'E2E-BETA-002';

-- ===================
-- SESSIONS (For activity tests)
-- ===================

INSERT INTO sessions (external_id, date, type, legislature)
VALUES
  ('E2E-SESSION-001', '2024-03-01', 'plenary', 16),
  ('E2E-SESSION-002', '2024-03-15', 'plenary', 16),
  ('E2E-SESSION-003', '2024-04-01', 'committee', 16);

-- ===================
-- INTERVENTIONS (For activity tracking tests)
-- ===================

INSERT INTO interventions (external_id, deputy_id, session_id, date, type)
SELECT 'E2E-INT-001', d.id, s.id, '2024-03-01', 'plenary'
FROM deputies d, sessions s
WHERE d.external_id = 'E2E-ALPHA-001' AND s.external_id = 'E2E-SESSION-001';

INSERT INTO interventions (external_id, deputy_id, session_id, date, type)
SELECT 'E2E-INT-002', d.id, s.id, '2024-03-15', 'plenary'
FROM deputies d, sessions s
WHERE d.external_id = 'E2E-ALPHA-001' AND s.external_id = 'E2E-SESSION-002';

INSERT INTO interventions (external_id, deputy_id, session_id, date, type)
SELECT 'E2E-INT-003', d.id, s.id, '2024-03-01', 'plenary'
FROM deputies d, sessions s
WHERE d.external_id = 'E2E-BETA-002' AND s.external_id = 'E2E-SESSION-001';

-- ===================
-- PARTY VOTES (For voting analysis tests)
-- ===================

INSERT INTO party_votes (
  external_id, initiative_id, session_number, voted_at, result, is_unanimous,
  parties_favor, parties_against, parties_abstain
)
SELECT
  'E2E-VOTE-001',
  (SELECT id FROM initiatives WHERE external_id = 'E2E-INIT-001'),
  1,
  '2024-03-15',
  'approved',
  false,
  ARRAY['PS', 'PSD', 'IL'],
  ARRAY['CH', 'BE'],
  ARRAY['PCP', 'L'];

INSERT INTO party_votes (
  external_id, initiative_id, session_number, voted_at, result, is_unanimous,
  parties_favor, parties_against, parties_abstain
)
SELECT
  'E2E-VOTE-002',
  (SELECT id FROM initiatives WHERE external_id = 'E2E-INIT-003'),
  2,
  '2024-02-20',
  'rejected',
  false,
  ARRAY['BE', 'PCP'],
  ARRAY['PS', 'PSD', 'CH', 'IL'],
  ARRAY['L', 'PAN'];

-- ===================
-- DEPUTY ROLES (For leadership tests)
-- ===================

INSERT INTO deputy_roles (deputy_id, role_name, role_id, start_date, end_date)
SELECT d.id, 'Vice-Presidente', 2, '2024-01-15', NULL
FROM deputies d WHERE d.external_id = 'E2E-ALPHA-001';

-- ===================
-- DEPUTY STATUS HISTORY (For status tracking)
-- ===================

INSERT INTO deputy_status_history (deputy_id, status, start_date, end_date)
SELECT d.id, 'Efetivo', '2024-01-01', NULL
FROM deputies d WHERE d.external_id = 'E2E-ALPHA-001';

INSERT INTO deputy_status_history (deputy_id, status, start_date, end_date)
SELECT d.id, 'Efetivo', '2024-01-01', NULL
FROM deputies d WHERE d.external_id = 'E2E-BETA-002';

INSERT INTO deputy_status_history (deputy_id, status, start_date, end_date)
SELECT d.id, 'Efetivo', '2024-01-01', NULL
FROM deputies d WHERE d.external_id = 'E2E-GAMMA-003';

INSERT INTO deputy_status_history (deputy_id, status, start_date, end_date)
SELECT d.id, 'Efetivo', '2024-01-01', '2024-06-15'
FROM deputies d WHERE d.external_id = 'E2E-DELTA-004';

INSERT INTO deputy_status_history (deputy_id, status, start_date, end_date)
SELECT d.id, 'Renunciou', '2024-06-15', NULL
FROM deputies d WHERE d.external_id = 'E2E-DELTA-004';

-- ===================
-- PLENARY MEETINGS (For attendance tests)
-- ===================
-- Using text-castable external_ids for cleanup compatibility

INSERT INTO plenary_meetings (external_id, meeting_date, legislature)
VALUES
  (900001, '2024-03-01', 16),
  (900002, '2024-03-15', 16),
  (900003, '2024-04-01', 16);

-- ===================
-- PLENARY ATTENDANCE (For attendance tracking tests)
-- ===================

-- Ana Alpha: Present at all meetings
INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'present', 'Presenca (P)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-ALPHA-001' AND m.external_id = 900001;

INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'present', 'Presenca (P)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-ALPHA-001' AND m.external_id = 900002;

INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'present', 'Presenca (P)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-ALPHA-001' AND m.external_id = 900003;

-- Bruno Beta: Present at 2/3 meetings
INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'present', 'Presenca (P)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-BETA-002' AND m.external_id = 900001;

INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'absent_justified', 'Falta Justificada (FJ)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-BETA-002' AND m.external_id = 900002;

INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'present', 'Presenca (P)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-BETA-002' AND m.external_id = 900003;

-- Carlos Gamma: Absent at most meetings
INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'absent_unjustified', 'Falta Injustificada (FI)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-GAMMA-003' AND m.external_id = 900001;

INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'absent_unjustified', 'Falta Injustificada (FI)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-GAMMA-003' AND m.external_id = 900002;

INSERT INTO plenary_attendance (deputy_id, meeting_id, status, status_raw)
SELECT d.id, m.id, 'present', 'Presenca (P)'
FROM deputies d, plenary_meetings m
WHERE d.external_id = 'E2E-GAMMA-003' AND m.external_id = 900003;

-- ===================
-- VALIDATION QUERY
-- ===================
-- This should return 4 rows if all inserts succeeded
DO $$
DECLARE
  e2e_deputy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO e2e_deputy_count FROM deputies WHERE external_id LIKE 'E2E-%';
  IF e2e_deputy_count != 4 THEN
    RAISE EXCEPTION 'E2E seed validation failed: Expected 4 deputies, found %', e2e_deputy_count;
  END IF;
  RAISE NOTICE 'E2E seed validation passed: % test deputies created', e2e_deputy_count;
END $$;

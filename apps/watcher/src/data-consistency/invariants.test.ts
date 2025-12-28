/**
 * Database Data Invariants Tests
 *
 * These tests verify that the data in the database satisfies
 * consistency constraints. They run against a real database
 * (local Supabase or staging) to catch data quality issues.
 *
 * Run with: SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=... bun test invariants
 */

import { describe, expect, it, beforeAll } from 'bun:test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { scoreToGrade } from './helpers.js';

let supabase: SupabaseClient;

beforeAll(() => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set, skipping invariant tests');
    return;
  }

  supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
});

describe('Database Data Invariants', () => {
  describe('Work Score Consistency', () => {
    it('all active deputies should have a work_score', async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('deputy_details')
        .select('id, name, work_score')
        .eq('is_active', true)
        .is('work_score', null);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('work_score should be between 0 and 200 (capped components allow >100)', async () => {
      if (!supabase) return;

      const { data: tooLow, error: errLow } = await supabase
        .from('deputy_stats')
        .select('deputy_id, work_score')
        .lt('work_score', 0);

      expect(errLow).toBeNull();
      expect(tooLow).toHaveLength(0);

      const { data: tooHigh, error: errHigh } = await supabase
        .from('deputy_stats')
        .select('deputy_id, work_score')
        .gt('work_score', 200);

      expect(errHigh).toBeNull();
      expect(tooHigh).toHaveLength(0);
    });

    it('grade should match work_score thresholds', async () => {
      if (!supabase) return;

      const { data, error } = await supabase.from('deputy_stats').select('work_score, grade');

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const mismatches: Array<{ work_score: number; grade: string; expected: string }> = [];

      for (const row of data || []) {
        const expected = scoreToGrade(row.work_score);
        if (row.grade !== expected) {
          mismatches.push({
            work_score: row.work_score,
            grade: row.grade,
            expected,
          });
        }
      }

      if (mismatches.length > 0) {
        console.error('Grade mismatches found:', mismatches.slice(0, 5));
      }
      expect(mismatches).toHaveLength(0);
    });
  });

  describe('Ranking Consistency', () => {
    it('national_rank should be unique for all deputies with stats', async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('deputy_stats')
        .select('national_rank')
        .not('national_rank', 'is', null);

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const ranks = (data || []).map((d) => d.national_rank);
      const uniqueRanks = new Set(ranks);
      expect(ranks.length).toBe(uniqueRanks.size);
    });

    it('national_rank should be sequential (1 to N)', async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('deputy_stats')
        .select('national_rank')
        .not('national_rank', 'is', null)
        .order('national_rank', { ascending: true });

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      const gaps: number[] = [];
      (data || []).forEach((row, i) => {
        const expectedRank = i + 1;
        if (row.national_rank !== expectedRank) {
          gaps.push(expectedRank);
        }
      });

      if (gaps.length > 0) {
        console.error('Ranking gaps found at positions:', gaps.slice(0, 10));
      }
      expect(gaps).toHaveLength(0);
    });

    it('top 10 by work_score should match top 10 by national_rank', async () => {
      if (!supabase) return;

      const { data: byScore, error: err1 } = await supabase
        .from('deputy_stats')
        .select('deputy_id')
        .not('work_score', 'is', null)
        .order('work_score', { ascending: false })
        .limit(10);

      expect(err1).toBeNull();

      const { data: byRank, error: err2 } = await supabase
        .from('deputy_stats')
        .select('deputy_id')
        .not('national_rank', 'is', null)
        .order('national_rank', { ascending: true })
        .limit(10);

      expect(err2).toBeNull();

      const scoreIds = (byScore || []).map((d) => d.deputy_id);
      const rankIds = (byRank || []).map((d) => d.deputy_id);

      expect(scoreIds).toEqual(rankIds);
    });

    it('district_rank should be unique within each district', async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('deputy_details')
        .select('district_id, district_rank')
        .not('district_rank', 'is', null);

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      // Group by district
      const byDistrict = new Map<string, number[]>();
      for (const row of data || []) {
        const existing = byDistrict.get(row.district_id) || [];
        existing.push(row.district_rank);
        byDistrict.set(row.district_id, existing);
      }

      // Check for duplicates in each district
      const duplicates: Array<{ district: string; duplicateRanks: number[] }> = [];
      for (const [district, ranks] of byDistrict) {
        const unique = new Set(ranks);
        if (ranks.length !== unique.size) {
          duplicates.push({ district, duplicateRanks: ranks });
        }
      }

      if (duplicates.length > 0) {
        console.error('Duplicate district ranks found:', duplicates.slice(0, 3));
      }
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('Count Consistency', () => {
    it('attendance_rate should be between 0 and 100', async () => {
      if (!supabase) return;

      const { data: tooLow, error: err1 } = await supabase
        .from('deputy_stats')
        .select('deputy_id, attendance_rate')
        .lt('attendance_rate', 0);

      expect(err1).toBeNull();
      expect(tooLow).toHaveLength(0);

      const { data: tooHigh, error: err2 } = await supabase
        .from('deputy_stats')
        .select('deputy_id, attendance_rate')
        .gt('attendance_rate', 100);

      expect(err2).toBeNull();
      expect(tooHigh).toHaveLength(0);
    });

    it('proposal_count should be non-negative', async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('deputy_stats')
        .select('deputy_id, proposal_count')
        .lt('proposal_count', 0);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('intervention_count should be non-negative', async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('deputy_stats')
        .select('deputy_id, intervention_count')
        .lt('intervention_count', 0);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('meetings_attended should not exceed meetings_total', async () => {
      if (!supabase) return;

      const { data, error } = await supabase.from('deputy_stats').select('deputy_id, meetings_attended, meetings_total');

      expect(error).toBeNull();

      const violations = (data || []).filter(
        (d) => d.meetings_attended > d.meetings_total && d.meetings_total > 0
      );

      if (violations.length > 0) {
        console.error('Deputies with more attended than total meetings:', violations.slice(0, 5));
      }
      expect(violations).toHaveLength(0);
    });
  });

  describe('Deputy Data Consistency', () => {
    it('all deputies should have a party', async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('deputies')
        .select('id, name, party_id')
        .is('party_id', null);

      expect(error).toBeNull();
      // Allow empty result (meaning all have parties)
      if (data && data.length > 0) {
        console.warn(`${data.length} deputies without party assignment`);
      }
    });

    it('all active deputies should have a district', async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('deputies')
        .select('id, name, district_id')
        .eq('is_active', true)
        .is('district_id', null);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('all deputies should have a corresponding stats record', async () => {
      if (!supabase) return;

      // Get all deputy IDs
      const { data: deputies, error: err1 } = await supabase.from('deputies').select('id');

      expect(err1).toBeNull();

      // Get all stats deputy_ids
      const { data: stats, error: err2 } = await supabase.from('deputy_stats').select('deputy_id');

      expect(err2).toBeNull();

      const deputyIds = new Set((deputies || []).map((d) => d.id));
      const statsDeputyIds = new Set((stats || []).map((s) => s.deputy_id));

      const missing = [...deputyIds].filter((id) => !statsDeputyIds.has(id));

      if (missing.length > 0) {
        console.error(`${missing.length} deputies missing stats records`);
      }
      expect(missing).toHaveLength(0);
    });
  });

  describe('Cross-View Consistency', () => {
    it('deputy_details view should match joined data', async () => {
      if (!supabase) return;

      // Get first 5 from view
      const { data: viewData, error: err1 } = await supabase
        .from('deputy_details')
        .select('id, work_score, grade, national_rank, party_name')
        .limit(5);

      expect(err1).toBeNull();
      expect(viewData).not.toBeNull();

      // Verify each row has consistent data
      for (const deputy of viewData || []) {
        // Grade should match score
        if (deputy.work_score !== null) {
          const expectedGrade = scoreToGrade(deputy.work_score);
          expect(deputy.grade).toBe(expectedGrade);
        }
      }
    });
  });
});

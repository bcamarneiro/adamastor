import { beforeAll, describe, expect, it } from 'bun:test';
/**
 * Cross-View Data Consistency Tests
 *
 * These tests verify that different views and queries that should return
 * consistent data actually do. They run against a real Supabase instance
 * (local or staging) to catch data inconsistencies.
 *
 * Test Categories:
 * 1. Leaderboard vs Detail - Same deputy shows same stats
 * 2. Filter Consistency - Filtered results are subsets of unfiltered
 * 3. Waste Calculator - Aggregations match individual records
 * 4. Ranking Order - Order by score matches order by rank
 *
 * Note: Tests will skip gracefully if no data is available in the database.
 * Run against a seeded database for full coverage.
 */
import { createClient } from '@supabase/supabase-js';
import type { DeputyDetail } from '../../lib/supabase';
import { YEARLY_SALARY } from '../waste/constants';

// Create a test client - uses local Supabase by default
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper: Get grade from score (must match database function)
function scoreToGrade(score: number | null): string {
  if (score === null) return 'F';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

describe('Cross-View Data Consistency', () => {
  // Cached data to avoid repeated fetches
  let allActiveDeputies: DeputyDetail[] = [];
  let topWorkers: DeputyDetail[] = [];
  let bottomWorkers: DeputyDetail[] = [];

  beforeAll(async () => {
    // Fetch all active deputies once
    const { data } = await supabase
      .from('deputy_details')
      .select('*')
      .eq('is_active', true)
      .order('work_score', { ascending: false });

    allActiveDeputies = data || [];

    if (allActiveDeputies.length === 0) {
      console.warn('⚠️ No deputy data found in database. Tests will be skipped.');
      console.warn('   Run against a seeded database (staging or production) for full coverage.');
      return;
    }

    // Top 10
    topWorkers = allActiveDeputies.slice(0, 10);

    // Bottom 10
    bottomWorkers = [...allActiveDeputies].sort((a, b) => a.work_score - b.work_score).slice(0, 10);
  });

  describe('Leaderboard vs Detail Page Consistency', () => {
    it('should have matching data for top 10 workers when fetched individually', async () => {
      if (topWorkers.length === 0) return; // Skip if no data

      for (const deputy of topWorkers.slice(0, 3)) {
        // Fetch individual detail (same as useDeputyDetail hook)
        const { data: detail } = await supabase
          .from('deputy_details')
          .select('*')
          .eq('id', deputy.id)
          .single();

        expect(detail).toBeTruthy();
        expect(detail?.work_score).toBe(deputy.work_score);
        expect(detail?.grade).toBe(deputy.grade);
        expect(detail?.national_rank).toBe(deputy.national_rank);
        expect(detail?.proposal_count).toBe(deputy.proposal_count);
        expect(detail?.attendance_rate).toBe(deputy.attendance_rate);
      }
    });

    it('should have matching data for bottom 10 workers when fetched individually', async () => {
      if (bottomWorkers.length === 0) return; // Skip if no data

      for (const deputy of bottomWorkers.slice(0, 3)) {
        const { data: detail } = await supabase
          .from('deputy_details')
          .select('*')
          .eq('id', deputy.id)
          .single();

        expect(detail).toBeTruthy();
        expect(detail?.work_score).toBe(deputy.work_score);
        expect(detail?.grade).toBe(deputy.grade);
        expect(detail?.national_rank).toBe(deputy.national_rank);
      }
    });

    it('grade displayed should match score-based grade calculation', () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      for (const deputy of allActiveDeputies) {
        const expectedGrade = scoreToGrade(deputy.work_score);
        expect(deputy.grade).toBe(expectedGrade);
      }
    });
  });

  describe('Full Rankings vs Top/Bottom Lists', () => {
    it('top 10 from full rankings should match useTopWorkers result', async () => {
      if (allActiveDeputies.length < 10) return; // Skip if insufficient data

      // Simulate useTopWorkers query
      const { data: top10 } = await supabase
        .from('deputy_details')
        .select('*')
        .eq('is_active', true)
        .order('work_score', { ascending: false })
        .limit(10);

      expect(top10).toHaveLength(10);

      // Should match first 10 from full rankings
      if (top10) {
        for (let i = 0; i < 10; i++) {
          expect(top10[i].id).toBe(allActiveDeputies[i].id);
          expect(top10[i].work_score).toBe(allActiveDeputies[i].work_score);
        }
      }
    });

    it('bottom 10 from full rankings should match useBottomWorkers result', async () => {
      if (allActiveDeputies.length < 10) return; // Skip if insufficient data

      // Simulate useBottomWorkers query
      const { data: bottom10 } = await supabase
        .from('deputy_details')
        .select('*')
        .eq('is_active', true)
        .order('work_score', { ascending: true })
        .limit(10);

      expect(bottom10).toHaveLength(10);

      // Should match bottom 10
      if (bottom10) {
        for (let i = 0; i < 10; i++) {
          expect(bottom10[i].id).toBe(bottomWorkers[i].id);
          expect(bottom10[i].work_score).toBe(bottomWorkers[i].work_score);
        }
      }
    });
  });

  describe('Filter Consistency', () => {
    it('filtering by party should return subset of full rankings', async () => {
      // Get a party with deputies
      const samplePartyId = allActiveDeputies.find((d) => d.party_id)?.party_id;
      if (!samplePartyId) {
        console.warn('No party found, skipping filter test');
        return;
      }

      // Filtered query (same as useFullRankings with party filter)
      const { data: partyDeputies } = await supabase
        .from('deputy_details')
        .select('*')
        .eq('is_active', true)
        .eq('party_id', samplePartyId)
        .order('work_score', { ascending: false });

      expect(partyDeputies).toBeTruthy();
      if (!partyDeputies) return;

      expect(partyDeputies.length).toBeGreaterThan(0);
      expect(partyDeputies.length).toBeLessThanOrEqual(allActiveDeputies.length);

      // All filtered results should be in the full list
      for (const deputy of partyDeputies) {
        const inFullList = allActiveDeputies.some((d) => d.id === deputy.id);
        expect(inFullList).toBe(true);
        expect(deputy.party_id).toBe(samplePartyId);
      }
    });

    it('filtering by district should return subset of full rankings', async () => {
      // Get a district with deputies
      const sampleDistrictId = allActiveDeputies.find((d) => d.district_id)?.district_id;
      if (!sampleDistrictId) {
        console.warn('No district found, skipping filter test');
        return;
      }

      // Filtered query
      const { data: districtDeputies } = await supabase
        .from('deputy_details')
        .select('*')
        .eq('is_active', true)
        .eq('district_id', sampleDistrictId)
        .order('work_score', { ascending: false });

      expect(districtDeputies).toBeTruthy();
      if (!districtDeputies) return;

      expect(districtDeputies.length).toBeGreaterThan(0);

      // All filtered results should be in the full list
      for (const deputy of districtDeputies) {
        const inFullList = allActiveDeputies.some((d) => d.id === deputy.id);
        expect(inFullList).toBe(true);
        expect(deputy.district_id).toBe(sampleDistrictId);
      }
    });

    it('combined party+district filter should be subset of either individual filter', async () => {
      // Find a deputy that has both party and district
      const sampleDeputy = allActiveDeputies.find((d) => d.party_id && d.district_id);
      if (!sampleDeputy || !sampleDeputy.party_id || !sampleDeputy.district_id) {
        console.warn('No deputy with both party and district found');
        return;
      }

      const { data: partyOnly } = await supabase
        .from('deputy_details')
        .select('id')
        .eq('is_active', true)
        .eq('party_id', sampleDeputy.party_id);

      const { data: combined } = await supabase
        .from('deputy_details')
        .select('id')
        .eq('is_active', true)
        .eq('party_id', sampleDeputy.party_id)
        .eq('district_id', sampleDeputy.district_id);

      if (!partyOnly || !combined) return;

      expect(combined.length).toBeLessThanOrEqual(partyOnly.length);

      // Combined results should be subset of party-only
      for (const dep of combined) {
        const inPartyList = partyOnly.some((d) => d.id === dep.id);
        expect(inPartyList).toBe(true);
      }
    });
  });

  describe('Waste Calculator Aggregations', () => {
    it('low performer count should match deputies with grade D or F', async () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      // Count from aggregation (like useWasteStats)
      const { data: lowPerformers } = await supabase
        .from('deputy_details')
        .select('id')
        .eq('is_active', true)
        .in('grade', ['D', 'F']);

      // Count manually from all deputies
      const manualCount = allActiveDeputies.filter(
        (d) => d.grade === 'D' || d.grade === 'F'
      ).length;

      expect(lowPerformers?.length).toBe(manualCount);
    });

    it('average work score should match manual calculation', async () => {
      if (allActiveDeputies.length === 0) return;

      const manualAverage =
        allActiveDeputies.reduce((sum, d) => sum + (d.work_score || 0), 0) /
        allActiveDeputies.length;

      // The calculation in useWasteStats
      const { data } = await supabase
        .from('deputy_details')
        .select('work_score')
        .eq('is_active', true);

      if (!data || data.length === 0) return;

      const queryAverage = data.reduce((sum, d) => sum + (d.work_score || 0), 0) / data.length;

      expect(queryAverage).toBeCloseTo(manualAverage, 2);
    });

    it('total salary waste calculation should be consistent', async () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      const { data: lowPerformers } = await supabase
        .from('deputy_details')
        .select('id')
        .eq('is_active', true)
        .in('grade', ['D', 'F']);

      const expectedWaste = (lowPerformers?.length || 0) * YEARLY_SALARY;

      // This should match useWasteStats.totalSalaryWaste
      expect(expectedWaste).toBeGreaterThanOrEqual(0);

      // Sanity check: waste should not exceed total budget
      const totalBudget = allActiveDeputies.length * YEARLY_SALARY;
      expect(expectedWaste).toBeLessThanOrEqual(totalBudget);
    });
  });

  describe('Ranking Order Consistency', () => {
    it('national_rank order should match work_score order', () => {
      if (allActiveDeputies.length < 2) return; // Skip if insufficient data

      // Already sorted by work_score descending
      for (let i = 0; i < allActiveDeputies.length - 1; i++) {
        const current = allActiveDeputies[i];
        const next = allActiveDeputies[i + 1];

        // Higher score should have lower (better) rank
        if (current.work_score > next.work_score) {
          expect(current.national_rank).toBeLessThan(next.national_rank);
        } else if (current.work_score === next.work_score) {
          // Ties can have same rank or adjacent ranks (implementation-dependent)
          expect(Math.abs(current.national_rank - next.national_rank)).toBeLessThanOrEqual(1);
        }
      }
    });

    it('rank 1 should have highest work_score', () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      const rank1 = allActiveDeputies.find((d) => d.national_rank === 1);
      if (!rank1) return; // Skip if rank 1 not found

      // No other deputy should have higher score
      for (const deputy of allActiveDeputies) {
        if (deputy.id !== rank1.id) {
          expect(deputy.work_score).toBeLessThanOrEqual(rank1.work_score);
        }
      }
    });

    it('last rank should have lowest work_score', () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      const maxRank = Math.max(...allActiveDeputies.map((d) => d.national_rank));
      const lastRank = allActiveDeputies.find((d) => d.national_rank === maxRank);
      if (!lastRank) return; // Skip if not found

      // No other deputy should have lower score
      for (const deputy of allActiveDeputies) {
        if (deputy.id !== lastRank.id) {
          expect(deputy.work_score).toBeGreaterThanOrEqual(lastRank.work_score);
        }
      }
    });
  });

  describe('District Rankings Consistency', () => {
    it('district_rank should be unique within each district', () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      // Group deputies by district
      const byDistrict = new Map<string, DeputyDetail[]>();
      for (const deputy of allActiveDeputies) {
        if (deputy.district_id) {
          const list = byDistrict.get(deputy.district_id) || [];
          list.push(deputy);
          byDistrict.set(deputy.district_id, list);
        }
      }

      // Check uniqueness within each district
      for (const [, deputies] of byDistrict) {
        const ranks = deputies.map((d) => d.district_rank).filter((r) => r != null);
        const uniqueRanks = new Set(ranks);

        // All ranks should be unique
        expect(ranks.length).toBe(uniqueRanks.size);
      }
    });

    it('district_rank should be sequential starting from 1', () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      // Group deputies by district
      const byDistrict = new Map<string, DeputyDetail[]>();
      for (const deputy of allActiveDeputies) {
        if (deputy.district_id) {
          const list = byDistrict.get(deputy.district_id) || [];
          list.push(deputy);
          byDistrict.set(deputy.district_id, list);
        }
      }

      for (const [, deputies] of byDistrict) {
        const ranks = deputies.map((d) => d.district_rank).filter((r) => r != null) as number[];
        ranks.sort((a, b) => a - b);

        // Should be 1, 2, 3, ..., N
        for (let i = 0; i < ranks.length; i++) {
          expect(ranks[i]).toBe(i + 1);
        }
      }
    });

    it('district_rank 1 should have highest work_score in district', () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      // Group by district
      const byDistrict = new Map<string, DeputyDetail[]>();
      for (const deputy of allActiveDeputies) {
        if (deputy.district_id) {
          const list = byDistrict.get(deputy.district_id) || [];
          list.push(deputy);
          byDistrict.set(deputy.district_id, list);
        }
      }

      for (const [, deputies] of byDistrict) {
        const rank1 = deputies.find((d) => d.district_rank === 1);
        if (rank1) {
          for (const deputy of deputies) {
            if (deputy.id !== rank1.id) {
              expect(deputy.work_score).toBeLessThanOrEqual(rank1.work_score);
            }
          }
        }
      }
    });
  });

  describe('Deputy Detail Page Data', () => {
    it('deputies fetched by district should have consistent data', async () => {
      // Simulate useDeputiesByDistrict
      const sampleDistrictId = allActiveDeputies.find((d) => d.district_id)?.district_id;
      if (!sampleDistrictId) return;

      const { data: districtDeputies } = await supabase
        .from('deputy_details')
        .select('*')
        .eq('district_id', sampleDistrictId)
        .eq('is_active', true)
        .order('work_score', { ascending: false });

      if (!districtDeputies) return;

      // Each should match when fetched individually
      for (const deputy of districtDeputies.slice(0, 3)) {
        const { data: individual } = await supabase
          .from('deputy_details')
          .select('*')
          .eq('id', deputy.id)
          .single();

        expect(individual?.work_score).toBe(deputy.work_score);
        expect(individual?.grade).toBe(deputy.grade);
        expect(individual?.district_rank).toBe(deputy.district_rank);
      }
    });

    it('deputy detail should include all required fields', () => {
      if (allActiveDeputies.length === 0) return; // Skip if no data

      for (const deputy of allActiveDeputies.slice(0, 10)) {
        // Required fields should be present
        expect(deputy.id).toBeTruthy();
        expect(deputy.name).toBeTruthy();
        expect(deputy.short_name).toBeTruthy();
        expect(typeof deputy.work_score).toBe('number');
        expect(deputy.grade).toMatch(/^[ABCDF]$/);
        expect(typeof deputy.national_rank).toBe('number');
        expect(deputy.is_active).toBe(true);
      }
    });
  });
});

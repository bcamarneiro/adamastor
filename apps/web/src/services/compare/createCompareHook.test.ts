import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createCompareHook } from './createCompareHook';
import type { MetricConfig, CompareOptions } from './types';

/**
 * Test entity type for comparison tests
 */
interface TestEntity {
  id: string;
  score: number;
  rank: number;
  attendance: number | null;
}

/**
 * Factory to create test entities with default values
 */
function createTestEntity(overrides: Partial<TestEntity> = {}): TestEntity {
  return {
    id: 'default',
    score: 50,
    rank: 10,
    attendance: 80,
    ...overrides,
  };
}

describe('createCompareHook', () => {
  describe('basic comparison with higher-is-better metrics', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
      { label: 'Attendance', getValue: (e) => e.attendance, higherIsBetter: true },
    ];

    it('should return a function (the hook)', () => {
      const hook = createCompareHook(metricsConfig);
      expect(typeof hook).toBe('function');
    });

    it('should declare A as winner when A has higher values', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 100, attendance: 90 });
      const entityB = createTestEntity({ id: 'b', score: 50, attendance: 70 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('A');
      expect(result.current?.winsA).toBe(2);
      expect(result.current?.winsB).toBe(0);
      expect(result.current?.ties).toBe(0);
    });

    it('should declare B as winner when B has higher values', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 30, attendance: 60 });
      const entityB = createTestEntity({ id: 'b', score: 80, attendance: 95 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('B');
      expect(result.current?.winsA).toBe(0);
      expect(result.current?.winsB).toBe(2);
    });

    it('should include correct metric details in result', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 100, attendance: 90 });
      const entityB = createTestEntity({ id: 'b', score: 50, attendance: 70 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics).toHaveLength(2);

      const scoreMetric = result.current?.metrics[0];
      expect(scoreMetric?.label).toBe('Score');
      expect(scoreMetric?.valueA).toBe(100);
      expect(scoreMetric?.valueB).toBe(50);
      expect(scoreMetric?.winnerA).toBe(true);
      expect(scoreMetric?.winnerB).toBe(false);
      expect(scoreMetric?.tie).toBe(false);
      expect(scoreMetric?.higherIsBetter).toBe(true);
    });

    it('should include entities in result', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a' });
      const entityB = createTestEntity({ id: 'b' });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.entityA).toBe(entityA);
      expect(result.current?.entityB).toBe(entityB);
    });
  });

  describe('comparison with lower-is-better metrics', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
    ];

    it('should declare A as winner when A has lower rank', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', rank: 1 });
      const entityB = createTestEntity({ id: 'b', rank: 50 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('A');
      expect(result.current?.winsA).toBe(1);
      expect(result.current?.winsB).toBe(0);
    });

    it('should declare B as winner when B has lower rank', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', rank: 100 });
      const entityB = createTestEntity({ id: 'b', rank: 5 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('B');
      expect(result.current?.winsB).toBe(1);
    });

    it('should correctly set higherIsBetter to false in metric', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', rank: 1 });
      const entityB = createTestEntity({ id: 'b', rank: 50 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics[0]?.higherIsBetter).toBe(false);
    });
  });

  describe('mixed higher/lower-is-better metrics', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
      { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
    ];

    it('should correctly compare mixed metrics with A winning', () => {
      const useCompare = createCompareHook(metricsConfig);
      // A wins both: higher score AND lower rank
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 1 });
      const entityB = createTestEntity({ id: 'b', score: 50, rank: 50 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('A');
      expect(result.current?.winsA).toBe(2);
      expect(result.current?.winsB).toBe(0);
    });

    it('should correctly split wins between A and B', () => {
      const useCompare = createCompareHook(metricsConfig);
      // A wins score, B wins rank
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 50 });
      const entityB = createTestEntity({ id: 'b', score: 50, rank: 1 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winsA).toBe(1);
      expect(result.current?.winsB).toBe(1);
      expect(result.current?.winner).toBe('tie');
    });
  });

  describe('tie scenarios', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
      { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
    ];

    it('should detect tie when all metrics are equal', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 75, rank: 10 });
      const entityB = createTestEntity({ id: 'b', score: 75, rank: 10 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('tie');
      expect(result.current?.winsA).toBe(0);
      expect(result.current?.winsB).toBe(0);
      expect(result.current?.ties).toBe(2);
    });

    it('should set tie=true in metric when values are equal', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 75, rank: 10 });
      const entityB = createTestEntity({ id: 'b', score: 75, rank: 10 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics[0]?.tie).toBe(true);
      expect(result.current?.metrics[0]?.winnerA).toBe(false);
      expect(result.current?.metrics[0]?.winnerB).toBe(false);
    });

    it('should result in tie when wins are equal', () => {
      const useCompare = createCompareHook(metricsConfig);
      // A wins score, B wins rank
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 50 });
      const entityB = createTestEntity({ id: 'b', score: 50, rank: 1 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('tie');
      expect(result.current?.winsA).toBe(1);
      expect(result.current?.winsB).toBe(1);
      expect(result.current?.ties).toBe(0);
    });
  });

  describe('null entity handling', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
    ];

    it('should return null when entityA is null', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityB = createTestEntity({ id: 'b' });

      const { result } = renderHook(() => useCompare(null, entityB));

      expect(result.current).toBeNull();
    });

    it('should return null when entityB is null', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a' });

      const { result } = renderHook(() => useCompare(entityA, null));

      expect(result.current).toBeNull();
    });

    it('should return null when both entities are null', () => {
      const useCompare = createCompareHook(metricsConfig);

      const { result } = renderHook(() => useCompare(null, null));

      expect(result.current).toBeNull();
    });
  });

  describe('null value handling in metrics', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Attendance', getValue: (e) => e.attendance, higherIsBetter: true },
    ];

    it('should treat null metric value as 0', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', attendance: null });
      const entityB = createTestEntity({ id: 'b', attendance: 80 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics[0]?.valueA).toBe(0);
      expect(result.current?.metrics[0]?.valueB).toBe(80);
      expect(result.current?.winner).toBe('B');
    });

    it('should handle both null metric values as tie', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', attendance: null });
      const entityB = createTestEntity({ id: 'b', attendance: null });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics[0]?.valueA).toBe(0);
      expect(result.current?.metrics[0]?.valueB).toBe(0);
      expect(result.current?.metrics[0]?.tie).toBe(true);
    });
  });

  describe('custom tiebreaker functionality', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
      { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
    ];

    it('should apply tiebreaker when metric wins are equal', () => {
      const options: CompareOptions<TestEntity> = {
        tiebreaker: (a, b) => {
          // Use attendance as tiebreaker
          if ((a.attendance ?? 0) > (b.attendance ?? 0)) return 'A';
          if ((b.attendance ?? 0) > (a.attendance ?? 0)) return 'B';
          return 'tie';
        },
      };

      const useCompare = createCompareHook(metricsConfig, options);
      // Equal metric wins: A wins score, B wins rank
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 50, attendance: 95 });
      const entityB = createTestEntity({ id: 'b', score: 50, rank: 1, attendance: 70 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('A'); // A wins due to tiebreaker (higher attendance)
    });

    it('should declare B as winner via tiebreaker', () => {
      const options: CompareOptions<TestEntity> = {
        tiebreaker: (a, b) => {
          if ((a.attendance ?? 0) > (b.attendance ?? 0)) return 'A';
          if ((b.attendance ?? 0) > (a.attendance ?? 0)) return 'B';
          return 'tie';
        },
      };

      const useCompare = createCompareHook(metricsConfig, options);
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 50, attendance: 60 });
      const entityB = createTestEntity({ id: 'b', score: 50, rank: 1, attendance: 90 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('B');
    });

    it('should still result in tie if tiebreaker returns tie', () => {
      const options: CompareOptions<TestEntity> = {
        tiebreaker: () => 'tie',
      };

      const useCompare = createCompareHook(metricsConfig, options);
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 50 });
      const entityB = createTestEntity({ id: 'b', score: 50, rank: 1 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('tie');
    });

    it('should not apply tiebreaker when there is a clear winner', () => {
      let tiebreakerCalled = false;
      const options: CompareOptions<TestEntity> = {
        tiebreaker: () => {
          tiebreakerCalled = true;
          return 'B';
        },
      };

      const useCompare = createCompareHook(metricsConfig, options);
      // A clearly wins both metrics
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 1 });
      const entityB = createTestEntity({ id: 'b', score: 50, rank: 50 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('A');
      expect(tiebreakerCalled).toBe(false);
    });
  });

  describe('scoreDifference calculation', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
    ];

    it('should include scoreDifference in result when configured', () => {
      const options: CompareOptions<TestEntity> = {
        scoreDifference: (a, b) => Math.abs(a.score - b.score),
      };

      const useCompare = createCompareHook(metricsConfig, options);
      const entityA = createTestEntity({ id: 'a', score: 100 });
      const entityB = createTestEntity({ id: 'b', score: 75 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.scoreDifference).toBe(25);
    });

    it('should calculate zero difference for equal scores', () => {
      const options: CompareOptions<TestEntity> = {
        scoreDifference: (a, b) => Math.abs(a.score - b.score),
      };

      const useCompare = createCompareHook(metricsConfig, options);
      const entityA = createTestEntity({ id: 'a', score: 75 });
      const entityB = createTestEntity({ id: 'b', score: 75 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.scoreDifference).toBe(0);
    });

    it('should not include scoreDifference when not configured', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 100 });
      const entityB = createTestEntity({ id: 'b', score: 75 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.scoreDifference).toBeUndefined();
    });

    it('should allow custom scoreDifference calculation', () => {
      const options: CompareOptions<TestEntity> = {
        // Custom: percentage difference
        scoreDifference: (a, b) => {
          const max = Math.max(a.score, b.score);
          if (max === 0) return 0;
          return ((Math.abs(a.score - b.score) / max) * 100);
        },
      };

      const useCompare = createCompareHook(metricsConfig, options);
      const entityA = createTestEntity({ id: 'a', score: 100 });
      const entityB = createTestEntity({ id: 'b', score: 50 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.scoreDifference).toBe(50); // 50% difference
    });
  });

  describe('combined tiebreaker and scoreDifference', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
      { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
    ];

    it('should support both options simultaneously', () => {
      const options: CompareOptions<TestEntity> = {
        tiebreaker: (a, b) => {
          if ((a.attendance ?? 0) > (b.attendance ?? 0)) return 'A';
          if ((b.attendance ?? 0) > (a.attendance ?? 0)) return 'B';
          return 'tie';
        },
        scoreDifference: (a, b) => Math.abs(a.score - b.score),
      };

      const useCompare = createCompareHook(metricsConfig, options);
      // Tie on metric wins (A wins score, B wins rank)
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 50, attendance: 95 });
      const entityB = createTestEntity({ id: 'b', score: 70, rank: 1, attendance: 80 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('A'); // Tiebreaker: A has higher attendance
      expect(result.current?.scoreDifference).toBe(30); // |100 - 70| = 30
    });
  });

  describe('memoization behavior', () => {
    const metricsConfig: MetricConfig<TestEntity>[] = [
      { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
    ];

    it('should return same result reference when entities do not change', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 100 });
      const entityB = createTestEntity({ id: 'b', score: 50 });

      const { result, rerender } = renderHook(() => useCompare(entityA, entityB));
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('should recalculate when entities change', () => {
      const useCompare = createCompareHook(metricsConfig);
      const entityA1 = createTestEntity({ id: 'a', score: 100 });
      const entityB1 = createTestEntity({ id: 'b', score: 50 });

      let entityA = entityA1;
      let entityB = entityB1;

      const { result, rerender } = renderHook(() => useCompare(entityA, entityB));
      expect(result.current?.winsA).toBe(1);

      // Change entities - now B wins
      entityA = createTestEntity({ id: 'a', score: 30 });
      entityB = createTestEntity({ id: 'b', score: 100 });
      rerender();

      expect(result.current?.winsB).toBe(1);
      expect(result.current?.winner).toBe('B');
    });
  });

  describe('edge cases', () => {
    it('should handle empty metrics config', () => {
      const useCompare = createCompareHook<TestEntity>([]);
      const entityA = createTestEntity({ id: 'a' });
      const entityB = createTestEntity({ id: 'b' });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics).toHaveLength(0);
      expect(result.current?.winsA).toBe(0);
      expect(result.current?.winsB).toBe(0);
      expect(result.current?.ties).toBe(0);
      expect(result.current?.winner).toBe('tie');
    });

    it('should handle single metric config', () => {
      const metricsConfig: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
      ];

      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 100 });
      const entityB = createTestEntity({ id: 'b', score: 50 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics).toHaveLength(1);
      expect(result.current?.winner).toBe('A');
    });

    it('should handle many metrics', () => {
      const metricsConfig: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
        { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
        { label: 'Attendance', getValue: (e) => e.attendance, higherIsBetter: true },
      ];

      const useCompare = createCompareHook(metricsConfig);
      // A wins: score + attendance (2), B wins: rank (1)
      const entityA = createTestEntity({ id: 'a', score: 100, rank: 50, attendance: 90 });
      const entityB = createTestEntity({ id: 'b', score: 50, rank: 1, attendance: 70 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics).toHaveLength(3);
      expect(result.current?.winsA).toBe(2);
      expect(result.current?.winsB).toBe(1);
      expect(result.current?.winner).toBe('A');
    });

    it('should handle zero values correctly', () => {
      const metricsConfig: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
      ];

      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: 0 });
      const entityB = createTestEntity({ id: 'b', score: 0 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.metrics[0]?.tie).toBe(true);
      expect(result.current?.winner).toBe('tie');
    });

    it('should handle negative values correctly', () => {
      const metricsConfig: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
      ];

      const useCompare = createCompareHook(metricsConfig);
      const entityA = createTestEntity({ id: 'a', score: -10 });
      const entityB = createTestEntity({ id: 'b', score: -20 });

      const { result } = renderHook(() => useCompare(entityA, entityB));

      expect(result.current?.winner).toBe('A'); // -10 > -20
      expect(result.current?.metrics[0]?.winnerA).toBe(true);
    });
  });
});

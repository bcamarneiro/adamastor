import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MetricConfig } from './types';
import { type UseComparisonOptions, useComparison } from './useComparison';

// Test entity type
interface TestEntity {
  id: string;
  score: number;
  rank: number;
  count: number;
}

// Helper to create test entities
const createEntity = (id: string, score: number, rank: number, count: number): TestEntity => ({
  id,
  score,
  rank,
  count,
});

// Standard metrics config for tests
const standardMetrics: MetricConfig<TestEntity>[] = [
  { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
  { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
  { label: 'Count', getValue: (e) => e.count, higherIsBetter: true },
];

describe('useComparison hook', () => {
  describe('null entity handling', () => {
    it('should return null when entityA is null', () => {
      const entityB = createEntity('B', 80, 2, 10);
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(null, entityB, options));

      expect(result.current).toBeNull();
    });

    it('should return null when entityB is null', () => {
      const entityA = createEntity('A', 90, 1, 15);
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(entityA, null, options));

      expect(result.current).toBeNull();
    });

    it('should return null when both entities are null', () => {
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(null, null, options));

      expect(result.current).toBeNull();
    });
  });

  describe('metric calculation', () => {
    it('should correctly calculate metrics with multiple metrics', () => {
      const entityA = createEntity('A', 90, 1, 15);
      const entityB = createEntity('B', 80, 5, 10);
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, options));

      expect(result.current).not.toBeNull();
      expect(result.current?.metrics).toHaveLength(3);

      // Score: A=90 > B=80, higherIsBetter=true -> A wins
      expect(result.current?.metrics[0]).toEqual({
        label: 'Score',
        valueA: 90,
        valueB: 80,
        winnerA: true,
        winnerB: false,
        tie: false,
        higherIsBetter: true,
      });

      // Rank: A=1 < B=5, higherIsBetter=false -> A wins (lower is better)
      expect(result.current?.metrics[1]).toEqual({
        label: 'Rank',
        valueA: 1,
        valueB: 5,
        winnerA: true,
        winnerB: false,
        tie: false,
        higherIsBetter: false,
      });

      // Count: A=15 > B=10, higherIsBetter=true -> A wins
      expect(result.current?.metrics[2]).toEqual({
        label: 'Count',
        valueA: 15,
        valueB: 10,
        winnerA: true,
        winnerB: false,
        tie: false,
        higherIsBetter: true,
      });
    });

    it('should handle null values returned by getValue (treated as 0)', () => {
      interface NullableEntity {
        value: number | null;
      }

      const entityA: NullableEntity = { value: null };
      const entityB: NullableEntity = { value: 10 };

      const metrics: MetricConfig<NullableEntity>[] = [
        { label: 'Value', getValue: (e) => e.value, higherIsBetter: true },
      ];

      const { result } = renderHook(() => useComparison(entityA, entityB, { metrics }));

      expect(result.current).not.toBeNull();
      expect(result.current?.metrics[0].valueA).toBe(0);
      expect(result.current?.metrics[0].valueB).toBe(10);
      expect(result.current?.metrics[0].winnerB).toBe(true);
    });

    it('should default higherIsBetter to true when not specified', () => {
      const entityA = createEntity('A', 100, 1, 20);
      const entityB = createEntity('B', 50, 2, 10);

      const metrics: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score }, // higherIsBetter not specified
      ];

      const { result } = renderHook(() => useComparison(entityA, entityB, { metrics }));

      expect(result.current).not.toBeNull();
      expect(result.current?.metrics[0].winnerA).toBe(true);
      expect(result.current?.metrics[0].higherIsBetter).toBe(true);
    });
  });

  describe('winner determination', () => {
    it('should determine A as winner when A wins more metrics', () => {
      const entityA = createEntity('A', 90, 1, 15); // A wins all 3
      const entityB = createEntity('B', 80, 5, 10);
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, options));

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('A');
      expect(result.current?.winsA).toBe(3);
      expect(result.current?.winsB).toBe(0);
    });

    it('should determine B as winner when B wins more metrics', () => {
      const entityA = createEntity('A', 50, 10, 5); // B wins all 3
      const entityB = createEntity('B', 80, 2, 15);
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, options));

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('B');
      expect(result.current?.winsA).toBe(0);
      expect(result.current?.winsB).toBe(3);
    });

    it('should determine A as winner when A wins 2 and B wins 1', () => {
      const entityA = createEntity('A', 90, 1, 5); // A wins score and rank, B wins count
      const entityB = createEntity('B', 80, 5, 10);
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, options));

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('A');
      expect(result.current?.winsA).toBe(2);
      expect(result.current?.winsB).toBe(1);
    });
  });

  describe('tie handling', () => {
    it('should return tie when wins are equal and no tiebreaker provided', () => {
      // Create a scenario where each wins one metric: A wins score, B wins rank
      const entityA = createEntity('A', 90, 5, 10); // A wins score, B wins rank, tie on count
      const entityB = createEntity('B', 80, 1, 10);

      const metrics: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
        { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
      ];

      const { result } = renderHook(() => useComparison(entityA, entityB, { metrics }));

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('tie');
      expect(result.current?.winsA).toBe(1);
      expect(result.current?.winsB).toBe(1);
    });

    it('should use tiebreaker function when wins are equal', () => {
      const entityA = createEntity('A', 90, 5, 10);
      const entityB = createEntity('B', 80, 1, 10);

      const metrics: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
        { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
      ];

      // Tiebreaker: winner is determined by higher score
      const tiebreaker = (a: TestEntity, b: TestEntity): 'A' | 'B' | 'tie' => {
        if (a.score > b.score) return 'A';
        if (b.score > a.score) return 'B';
        return 'tie';
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, { metrics, tiebreaker }));

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('A'); // A has higher score
    });

    it('should use tiebreaker to determine B as winner', () => {
      const entityA = createEntity('A', 70, 5, 10);
      const entityB = createEntity('B', 80, 1, 10);

      const metrics: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
        { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
      ];

      // Tiebreaker: winner is determined by higher score
      const tiebreaker = (a: TestEntity, b: TestEntity): 'A' | 'B' | 'tie' => {
        if (a.score > b.score) return 'A';
        if (b.score > a.score) return 'B';
        return 'tie';
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, { metrics, tiebreaker }));

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('B'); // B has higher score
    });

    it('should return tie when tiebreaker also results in tie', () => {
      const entityA = createEntity('A', 80, 5, 10);
      const entityB = createEntity('B', 80, 5, 10); // Same rank as A so metrics tie

      const metrics: MetricConfig<TestEntity>[] = [
        { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
        { label: 'Rank', getValue: (e) => e.rank, higherIsBetter: false },
      ];

      // Tiebreaker: score-based but scores are equal
      const tiebreaker = (a: TestEntity, b: TestEntity): 'A' | 'B' | 'tie' => {
        if (a.score > b.score) return 'A';
        if (b.score > a.score) return 'B';
        return 'tie';
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, { metrics, tiebreaker }));

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('tie');
    });

    it('should not call tiebreaker when wins are not equal', () => {
      let tiebreakerCalled = false;

      const entityA = createEntity('A', 90, 1, 15); // A wins all
      const entityB = createEntity('B', 80, 5, 10);

      const tiebreaker = (): 'A' | 'B' | 'tie' => {
        tiebreakerCalled = true;
        return 'B';
      };

      const { result } = renderHook(() =>
        useComparison(entityA, entityB, {
          metrics: standardMetrics,
          tiebreaker,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current?.winner).toBe('A');
      expect(tiebreakerCalled).toBe(false);
    });
  });

  describe('win/tie counts', () => {
    it('should accurately count winsA, winsB, and ties', () => {
      const entityA = createEntity('A', 90, 5, 10); // A wins score, B wins rank, tie on count
      const entityB = createEntity('B', 80, 1, 10);
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, options));

      expect(result.current).not.toBeNull();
      expect(result.current?.winsA).toBe(1); // Score
      expect(result.current?.winsB).toBe(1); // Rank
      expect(result.current?.ties).toBe(1); // Count
    });

    it('should count all ties when values are equal', () => {
      const entityA = createEntity('A', 80, 5, 10);
      const entityB = createEntity('B', 80, 5, 10);
      const options: UseComparisonOptions<TestEntity> = {
        metrics: standardMetrics,
      };

      const { result } = renderHook(() => useComparison(entityA, entityB, options));

      expect(result.current).not.toBeNull();
      expect(result.current?.winsA).toBe(0);
      expect(result.current?.winsB).toBe(0);
      expect(result.current?.ties).toBe(3);
      expect(result.current?.winner).toBe('tie');
    });

    it('should handle empty metrics array', () => {
      const entityA = createEntity('A', 90, 1, 15);
      const entityB = createEntity('B', 80, 5, 10);

      const { result } = renderHook(() => useComparison(entityA, entityB, { metrics: [] }));

      expect(result.current).not.toBeNull();
      expect(result.current?.winsA).toBe(0);
      expect(result.current?.winsB).toBe(0);
      expect(result.current?.ties).toBe(0);
      expect(result.current?.winner).toBe('tie');
      expect(result.current?.metrics).toHaveLength(0);
    });
  });

  describe('score difference calculation', () => {
    it('should calculate scoreDifference when getScore is provided', () => {
      const entityA = createEntity('A', 90, 1, 15);
      const entityB = createEntity('B', 80, 5, 10);

      const { result } = renderHook(() =>
        useComparison(entityA, entityB, {
          metrics: standardMetrics,
          getScore: (e) => e.score,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current?.scoreDifference).toBe(10); // |90 - 80|
    });

    it('should return absolute value for scoreDifference', () => {
      const entityA = createEntity('A', 80, 1, 15);
      const entityB = createEntity('B', 90, 5, 10);

      const { result } = renderHook(() =>
        useComparison(entityA, entityB, {
          metrics: standardMetrics,
          getScore: (e) => e.score,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current?.scoreDifference).toBe(10); // |80 - 90| = 10
    });

    it('should return undefined for scoreDifference when getScore is not provided', () => {
      const entityA = createEntity('A', 90, 1, 15);
      const entityB = createEntity('B', 80, 5, 10);

      const { result } = renderHook(() =>
        useComparison(entityA, entityB, { metrics: standardMetrics })
      );

      expect(result.current).not.toBeNull();
      expect(result.current?.scoreDifference).toBeUndefined();
    });

    it('should calculate scoreDifference as 0 when scores are equal', () => {
      const entityA = createEntity('A', 85, 1, 15);
      const entityB = createEntity('B', 85, 5, 10);

      const { result } = renderHook(() =>
        useComparison(entityA, entityB, {
          metrics: standardMetrics,
          getScore: (e) => e.score,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current?.scoreDifference).toBe(0);
    });
  });

  describe('result object structure', () => {
    it('should include entityA and entityB in result', () => {
      const entityA = createEntity('A', 90, 1, 15);
      const entityB = createEntity('B', 80, 5, 10);

      const { result } = renderHook(() =>
        useComparison(entityA, entityB, { metrics: standardMetrics })
      );

      expect(result.current).not.toBeNull();
      expect(result.current?.entityA).toBe(entityA);
      expect(result.current?.entityB).toBe(entityB);
    });

    it('should have correct structure for ComparisonResult', () => {
      const entityA = createEntity('A', 90, 1, 15);
      const entityB = createEntity('B', 80, 5, 10);

      const { result } = renderHook(() =>
        useComparison(entityA, entityB, {
          metrics: standardMetrics,
          getScore: (e) => e.score,
        })
      );

      expect(result.current).not.toBeNull();
      expect(result.current).toHaveProperty('entityA');
      expect(result.current).toHaveProperty('entityB');
      expect(result.current).toHaveProperty('metrics');
      expect(result.current).toHaveProperty('winsA');
      expect(result.current).toHaveProperty('winsB');
      expect(result.current).toHaveProperty('ties');
      expect(result.current).toHaveProperty('winner');
      expect(result.current).toHaveProperty('scoreDifference');
    });
  });
});

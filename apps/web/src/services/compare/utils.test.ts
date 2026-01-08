import { describe, expect, it } from 'vitest';
import { compare } from './utils';

describe('compare utility function', () => {
  describe('higher-is-better (default behavior)', () => {
    it('should declare A as winner when A has higher value', () => {
      const result = compare(10, 5);

      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
      expect(result.tie).toBe(false);
    });

    it('should declare B as winner when B has higher value', () => {
      const result = compare(5, 10);

      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(true);
      expect(result.tie).toBe(false);
    });

    it('should detect tie when values are equal', () => {
      const result = compare(5, 5);

      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(false);
      expect(result.tie).toBe(true);
    });

    it('should work with large numbers', () => {
      const result = compare(1000000, 999999);

      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
      expect(result.tie).toBe(false);
    });

    it('should work with decimal numbers', () => {
      const result = compare(10.5, 10.4);

      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
      expect(result.tie).toBe(false);
    });

    it('should explicitly passing higherIsBetter=true behave the same as default', () => {
      const defaultResult = compare(10, 5);
      const explicitResult = compare(10, 5, true);

      expect(defaultResult).toEqual(explicitResult);
    });
  });

  describe('lower-is-better mode', () => {
    it('should declare A as winner when A has lower value', () => {
      const result = compare(1, 5, false);

      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
      expect(result.tie).toBe(false);
    });

    it('should declare B as winner when B has lower value', () => {
      const result = compare(5, 1, false);

      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(true);
      expect(result.tie).toBe(false);
    });

    it('should detect tie when values are equal', () => {
      const result = compare(10, 10, false);

      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(false);
      expect(result.tie).toBe(true);
    });

    it('should work with rank-like values (lower rank is better)', () => {
      const result = compare(1, 50, false);

      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
    });

    it('should work with reverse rank comparison', () => {
      const result = compare(100, 5, false);

      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(true);
    });
  });

  describe('null value handling', () => {
    it('should treat null A as 0, making B the winner when B is positive', () => {
      const result = compare(null, 5);

      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(true);
      expect(result.tie).toBe(false);
    });

    it('should treat null B as 0, making A the winner when A is positive', () => {
      const result = compare(5, null);

      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
      expect(result.tie).toBe(false);
    });

    it('should treat both null values as tie (both become 0)', () => {
      const result = compare(null, null);

      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(false);
      expect(result.tie).toBe(true);
    });

    it('should treat null A as 0 in lower-is-better mode', () => {
      const result = compare(null, 5, false);

      // null becomes 0, and 0 < 5, so A wins in lower-is-better mode
      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
    });

    it('should treat null B as 0 in lower-is-better mode', () => {
      const result = compare(5, null, false);

      // null becomes 0, and 0 < 5, so B wins in lower-is-better mode
      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(true);
    });

    it('should tie when null vs 0 (null becomes 0)', () => {
      const result = compare(null, 0);

      expect(result.tie).toBe(true);
    });

    it('should tie when 0 vs null (null becomes 0)', () => {
      const result = compare(0, null);

      expect(result.tie).toBe(true);
    });
  });

  describe('tie detection', () => {
    it('should detect tie with zero values', () => {
      const result = compare(0, 0);

      expect(result.tie).toBe(true);
      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(false);
    });

    it('should detect tie with positive equal values', () => {
      const result = compare(75, 75);

      expect(result.tie).toBe(true);
    });

    it('should detect tie with negative equal values', () => {
      const result = compare(-10, -10);

      expect(result.tie).toBe(true);
    });

    it('should detect tie with decimal equal values', () => {
      const result = compare(Math.PI, Math.PI);

      expect(result.tie).toBe(true);
    });

    it('should detect tie regardless of higherIsBetter setting', () => {
      const higherIsBetterResult = compare(50, 50, true);
      const lowerIsBetterResult = compare(50, 50, false);

      expect(higherIsBetterResult.tie).toBe(true);
      expect(lowerIsBetterResult.tie).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle negative values with higher-is-better', () => {
      const result = compare(-5, -10);

      // -5 > -10, so A wins
      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
    });

    it('should handle negative values with lower-is-better', () => {
      const result = compare(-5, -10, false);

      // -10 < -5, so B wins
      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(true);
    });

    it('should handle comparison of positive vs negative', () => {
      const result = compare(5, -5);

      // 5 > -5, so A wins
      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
    });

    it('should handle comparison of negative vs positive in lower-is-better', () => {
      const result = compare(-5, 5, false);

      // -5 < 5, so A wins in lower-is-better mode
      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
    });

    it('should handle comparison with zero', () => {
      const positiveVsZero = compare(5, 0);
      expect(positiveVsZero.winnerA).toBe(true);

      const zeroVsPositive = compare(0, 5);
      expect(zeroVsPositive.winnerB).toBe(true);

      const negativeVsZero = compare(-5, 0);
      expect(negativeVsZero.winnerB).toBe(true);

      const zeroVsNegative = compare(0, -5);
      expect(zeroVsNegative.winnerA).toBe(true);
    });

    it('should handle very small decimal differences', () => {
      const result = compare(0.0001, 0.0002);

      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(true);
    });

    it('should handle null with negative values', () => {
      const result = compare(null, -5);

      // null becomes 0, 0 > -5, so A wins
      expect(result.winnerA).toBe(true);
      expect(result.winnerB).toBe(false);
    });

    it('should handle null with negative in lower-is-better mode', () => {
      const result = compare(null, -5, false);

      // null becomes 0, -5 < 0, so B wins in lower-is-better mode
      expect(result.winnerA).toBe(false);
      expect(result.winnerB).toBe(true);
    });
  });

  describe('return value structure', () => {
    it('should always return an object with winnerA, winnerB, and tie properties', () => {
      const result = compare(10, 5);

      expect(result).toHaveProperty('winnerA');
      expect(result).toHaveProperty('winnerB');
      expect(result).toHaveProperty('tie');
    });

    it('should have mutually exclusive outcomes (only one true)', () => {
      const aWins = compare(10, 5);
      expect(aWins.winnerA).toBe(true);
      expect(aWins.winnerB).toBe(false);
      expect(aWins.tie).toBe(false);

      const bWins = compare(5, 10);
      expect(bWins.winnerA).toBe(false);
      expect(bWins.winnerB).toBe(true);
      expect(bWins.tie).toBe(false);

      const tied = compare(5, 5);
      expect(tied.winnerA).toBe(false);
      expect(tied.winnerB).toBe(false);
      expect(tied.tie).toBe(true);
    });

    it('should return boolean values for all properties', () => {
      const result = compare(10, 5);

      expect(typeof result.winnerA).toBe('boolean');
      expect(typeof result.winnerB).toBe('boolean');
      expect(typeof result.tie).toBe('boolean');
    });
  });
});

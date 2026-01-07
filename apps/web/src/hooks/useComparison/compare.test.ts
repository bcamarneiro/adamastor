import { describe, expect, it } from 'vitest';
import { compare } from './compare';

describe('compare utility', () => {
  describe('higherIsBetter = true (default)', () => {
    it('should return winnerA when A has higher value', () => {
      const result = compare(10, 5);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should return winnerB when B has higher value', () => {
      const result = compare(5, 10);
      expect(result).toEqual({ winnerA: false, winnerB: true, tie: false });
    });

    it('should use higherIsBetter=true by default', () => {
      const result = compare(100, 50);
      expect(result.winnerA).toBe(true);
    });
  });

  describe('higherIsBetter = false', () => {
    it('should return winnerA when A has lower value', () => {
      const result = compare(5, 10, false);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should return winnerB when B has lower value', () => {
      const result = compare(10, 5, false);
      expect(result).toEqual({ winnerA: false, winnerB: true, tie: false });
    });

    it('should handle rankings where 1 is better than 10', () => {
      const result = compare(1, 10, false);
      expect(result.winnerA).toBe(true);
    });
  });

  describe('tie detection', () => {
    it('should detect tie when values are equal', () => {
      const result = compare(5, 5);
      expect(result).toEqual({ winnerA: false, winnerB: false, tie: true });
    });

    it('should detect tie when values are equal with higherIsBetter=false', () => {
      const result = compare(5, 5, false);
      expect(result).toEqual({ winnerA: false, winnerB: false, tie: true });
    });

    it('should detect tie with zero values', () => {
      const result = compare(0, 0);
      expect(result).toEqual({ winnerA: false, winnerB: false, tie: true });
    });
  });

  describe('null handling', () => {
    it('should treat null as 0 - B wins when A is null and B is positive', () => {
      const result = compare(null, 5);
      expect(result).toEqual({ winnerA: false, winnerB: true, tie: false });
    });

    it('should treat null as 0 - A wins when B is null and A is positive', () => {
      const result = compare(5, null);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should treat null as 0 - A wins when A is null and B is negative', () => {
      const result = compare(null, -5);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should treat null as 0 and tie with 0', () => {
      const result = compare(null, 0);
      expect(result).toEqual({ winnerA: false, winnerB: false, tie: true });
    });
  });

  describe('edge cases', () => {
    it('should handle both values being null (tie)', () => {
      const result = compare(null, null);
      expect(result).toEqual({ winnerA: false, winnerB: false, tie: true });
    });

    it('should handle negative numbers - higher wins', () => {
      const result = compare(-1, -10);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should handle negative numbers - lower wins', () => {
      const result = compare(-10, -1, false);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should handle decimal numbers', () => {
      const result = compare(5.5, 5.4);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should handle decimal ties', () => {
      const result = compare(3.14159, 3.14159);
      expect(result).toEqual({ winnerA: false, winnerB: false, tie: true });
    });

    it('should handle very small decimal differences', () => {
      const result = compare(0.001, 0.0001);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should handle large numbers', () => {
      const result = compare(1000000, 999999);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });

    it('should handle mixed positive and negative values', () => {
      const result = compare(-5, 5);
      expect(result).toEqual({ winnerA: false, winnerB: true, tie: false });
    });

    it('should handle zero and positive with higherIsBetter=false', () => {
      const result = compare(0, 5, false);
      expect(result).toEqual({ winnerA: true, winnerB: false, tie: false });
    });
  });
});

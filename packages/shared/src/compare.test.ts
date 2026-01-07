import { describe, expect, it } from 'vitest';
import { compare, CompareResult } from './compare';

describe('compare', () => {
  describe('both null values', () => {
    it('should return tie when both values are null', () => {
      const result = compare(null, null);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: false,
        tie: true,
      });
    });

    it('should return tie when both values are null with higherIsBetter=false', () => {
      const result = compare(null, null, false);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: false,
        tie: true,
      });
    });
  });

  describe('one null value', () => {
    it('should treat null A as 0 and B wins when higherIsBetter=true and B is positive', () => {
      const result = compare(null, 10, true);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: true,
        tie: false,
      });
    });

    it('should treat null B as 0 and A wins when higherIsBetter=true and A is positive', () => {
      const result = compare(10, null, true);
      expect(result).toEqual<CompareResult>({
        winnerA: true,
        winnerB: false,
        tie: false,
      });
    });

    it('should treat null A as 0 and A wins when higherIsBetter=false and B is positive', () => {
      const result = compare(null, 10, false);
      expect(result).toEqual<CompareResult>({
        winnerA: true,
        winnerB: false,
        tie: false,
      });
    });

    it('should treat null B as 0 and B wins when higherIsBetter=false and A is positive', () => {
      const result = compare(10, null, false);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: true,
        tie: false,
      });
    });

    it('should return tie when one is null and other is 0', () => {
      expect(compare(null, 0)).toEqual<CompareResult>({
        winnerA: false,
        winnerB: false,
        tie: true,
      });
      expect(compare(0, null)).toEqual<CompareResult>({
        winnerA: false,
        winnerB: false,
        tie: true,
      });
    });
  });

  describe('equal values', () => {
    it('should return tie when both values are equal', () => {
      const result = compare(50, 50);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: false,
        tie: true,
      });
    });

    it('should return tie when both values are equal with higherIsBetter=false', () => {
      const result = compare(50, 50, false);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: false,
        tie: true,
      });
    });

    it('should return tie when both values are 0', () => {
      const result = compare(0, 0);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: false,
        tie: true,
      });
    });

    it('should return tie when both values are negative and equal', () => {
      const result = compare(-5, -5);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: false,
        tie: true,
      });
    });
  });

  describe('higher is better (default)', () => {
    it('should return A wins when A is higher', () => {
      const result = compare(100, 50);
      expect(result).toEqual<CompareResult>({
        winnerA: true,
        winnerB: false,
        tie: false,
      });
    });

    it('should return B wins when B is higher', () => {
      const result = compare(50, 100);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: true,
        tie: false,
      });
    });

    it('should handle negative numbers correctly - A wins', () => {
      const result = compare(-5, -10);
      expect(result).toEqual<CompareResult>({
        winnerA: true,
        winnerB: false,
        tie: false,
      });
    });

    it('should handle negative numbers correctly - B wins', () => {
      const result = compare(-10, -5);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: true,
        tie: false,
      });
    });

    it('should handle decimal numbers - A wins', () => {
      const result = compare(10.5, 10.4);
      expect(result).toEqual<CompareResult>({
        winnerA: true,
        winnerB: false,
        tie: false,
      });
    });

    it('should handle decimal numbers - B wins', () => {
      const result = compare(10.4, 10.5);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: true,
        tie: false,
      });
    });
  });

  describe('lower is better (higherIsBetter=false)', () => {
    it('should return A wins when A is lower', () => {
      const result = compare(50, 100, false);
      expect(result).toEqual<CompareResult>({
        winnerA: true,
        winnerB: false,
        tie: false,
      });
    });

    it('should return B wins when B is lower', () => {
      const result = compare(100, 50, false);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: true,
        tie: false,
      });
    });

    it('should handle negative numbers correctly - A wins (A is more negative)', () => {
      const result = compare(-10, -5, false);
      expect(result).toEqual<CompareResult>({
        winnerA: true,
        winnerB: false,
        tie: false,
      });
    });

    it('should handle negative numbers correctly - B wins (B is more negative)', () => {
      const result = compare(-5, -10, false);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: true,
        tie: false,
      });
    });

    it('should handle decimal numbers - A wins', () => {
      const result = compare(10.4, 10.5, false);
      expect(result).toEqual<CompareResult>({
        winnerA: true,
        winnerB: false,
        tie: false,
      });
    });

    it('should handle decimal numbers - B wins', () => {
      const result = compare(10.5, 10.4, false);
      expect(result).toEqual<CompareResult>({
        winnerA: false,
        winnerB: true,
        tie: false,
      });
    });
  });
});

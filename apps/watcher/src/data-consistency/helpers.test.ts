import { describe, expect, it } from 'bun:test';
import { calculateWorkScore, scoreToGrade } from './helpers.js';

describe('scoreToGrade', () => {
  describe('grade boundaries', () => {
    it('should return A for score >= 85', () => {
      expect(scoreToGrade(85)).toBe('A');
      expect(scoreToGrade(100)).toBe('A');
      expect(scoreToGrade(99.99)).toBe('A');
    });

    it('should return B for score >= 70 and < 85', () => {
      expect(scoreToGrade(70)).toBe('B');
      expect(scoreToGrade(84.99)).toBe('B');
      expect(scoreToGrade(75)).toBe('B');
    });

    it('should return C for score >= 55 and < 70', () => {
      expect(scoreToGrade(55)).toBe('C');
      expect(scoreToGrade(69.99)).toBe('C');
      expect(scoreToGrade(60)).toBe('C');
    });

    it('should return D for score >= 40 and < 55', () => {
      expect(scoreToGrade(40)).toBe('D');
      expect(scoreToGrade(54.99)).toBe('D');
      expect(scoreToGrade(45)).toBe('D');
    });

    it('should return F for score < 40', () => {
      expect(scoreToGrade(39.99)).toBe('F');
      expect(scoreToGrade(0)).toBe('F');
      expect(scoreToGrade(20)).toBe('F');
    });
  });

  describe('edge cases', () => {
    it('should return F for null score', () => {
      expect(scoreToGrade(null)).toBe('F');
    });

    it('should handle boundary exactly at threshold', () => {
      expect(scoreToGrade(85)).toBe('A');
      expect(scoreToGrade(70)).toBe('B');
      expect(scoreToGrade(55)).toBe('C');
      expect(scoreToGrade(40)).toBe('D');
    });
  });
});

describe('calculateWorkScore', () => {
  describe('weight distribution', () => {
    it('should apply 40% weight to attendance', () => {
      // 100% attendance, no other activity
      const score = calculateWorkScore(100, 0, 10, 0, 10, 0, 10);
      expect(score).toBe(40); // 100 * 0.4 = 40
    });

    it('should apply 30% weight to proposals', () => {
      // Average proposals (ratio = 1), no other activity
      const score = calculateWorkScore(0, 10, 10, 0, 10, 0, 10);
      expect(score).toBe(30); // (10/10 * 100) * 0.3 = 30
    });

    it('should apply 20% weight to interventions', () => {
      // Average interventions (ratio = 1), no other activity
      const score = calculateWorkScore(0, 0, 10, 10, 10, 0, 10);
      expect(score).toBe(20); // (10/10 * 100) * 0.2 = 20
    });

    it('should apply 10% weight to questions', () => {
      // Average questions (ratio = 1), no other activity
      const score = calculateWorkScore(0, 0, 10, 0, 10, 10, 10);
      expect(score).toBe(10); // (10/10 * 100) * 0.1 = 10
    });
  });

  describe('component capping', () => {
    it('should cap proposals at 200%', () => {
      // 3x average proposals
      const score = calculateWorkScore(0, 30, 10, 0, 10, 0, 10);
      expect(score).toBe(60); // min(300, 200) * 0.3 = 60
    });

    it('should cap interventions at 200%', () => {
      // 3x average interventions
      const score = calculateWorkScore(0, 0, 10, 30, 10, 0, 10);
      expect(score).toBe(40); // min(300, 200) * 0.2 = 40
    });

    it('should cap questions at 200%', () => {
      // 3x average questions
      const score = calculateWorkScore(0, 0, 10, 0, 10, 30, 10);
      expect(score).toBe(20); // min(300, 200) * 0.1 = 20
    });
  });

  describe('zero averages', () => {
    it('should handle zero average proposals', () => {
      const score = calculateWorkScore(50, 10, 0, 0, 10, 0, 10);
      // Proposals contribute 0 when average is 0
      expect(score).toBe(20); // 50 * 0.4 = 20
    });

    it('should handle all zero averages', () => {
      const score = calculateWorkScore(80, 10, 0, 10, 0, 10, 0);
      expect(score).toBe(32); // 80 * 0.4 = 32, rest is 0
    });
  });

  describe('combined scenarios', () => {
    it('should calculate score for average deputy', () => {
      // All at average
      const score = calculateWorkScore(75, 10, 10, 10, 10, 10, 10);
      // 75 * 0.4 + 100 * 0.3 + 100 * 0.2 + 100 * 0.1 = 30 + 30 + 20 + 10 = 90
      expect(score).toBe(90);
    });

    it('should calculate score for inactive deputy', () => {
      const score = calculateWorkScore(0, 0, 10, 0, 10, 0, 10);
      expect(score).toBe(0);
    });

    it('should calculate score for hardworking deputy', () => {
      // High attendance and above average activity
      const score = calculateWorkScore(95, 20, 10, 25, 10, 15, 10);
      // 95 * 0.4 = 38
      // min(200, 200) * 0.3 = 60
      // min(250, 200) * 0.2 = 40
      // min(150, 200) * 0.1 = 15
      // Total = 38 + 60 + 40 + 15 = 153
      expect(score).toBe(153);
    });
  });
});

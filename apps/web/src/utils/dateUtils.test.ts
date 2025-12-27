import { describe, expect, it } from 'vitest';
import { daysBetween, formatDate } from './dateUtils';

describe('formatDate', () => {
  it('should format a valid ISO date string to pt-BR format', () => {
    const result = formatDate('2024-03-15');
    expect(result).toBe('15/03/2024');
  });

  it('should format a datetime string to pt-BR format', () => {
    const result = formatDate('2024-12-25T10:30:00');
    expect(result).toBe('25/12/2024');
  });

  it('should handle different date formats', () => {
    expect(formatDate('2024-01-01')).toBe('01/01/2024');
    expect(formatDate('2024-06-30')).toBe('30/06/2024');
  });

  it('should return "Invalid Date" for invalid date strings', () => {
    const result = formatDate('invalid-date');
    expect(result).toBe('Invalid Date');
  });
});

describe('daysBetween', () => {
  it('should calculate days between two dates', () => {
    expect(daysBetween('2024-01-01', '2024-01-10')).toBe(9);
  });

  it('should work regardless of date order', () => {
    expect(daysBetween('2024-01-10', '2024-01-01')).toBe(9);
  });

  it('should return 0 for same date', () => {
    expect(daysBetween('2024-03-15', '2024-03-15')).toBe(0);
  });

  it('should handle dates spanning months', () => {
    expect(daysBetween('2024-01-31', '2024-02-01')).toBe(1);
  });

  it('should handle dates spanning years', () => {
    expect(daysBetween('2023-12-31', '2024-01-01')).toBe(1);
  });

  it('should handle full year difference', () => {
    // 2023 is not a leap year, so Jan 1 2023 to Jan 1 2024 = 365 days
    expect(daysBetween('2023-01-01', '2024-01-01')).toBe(365);
  });
});

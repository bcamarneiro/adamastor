import { describe, expect, it } from 'vitest';
import {
  DEPUTY_MONTHLY_SALARY,
  YEARLY_SALARY,
  TOTAL_DEPUTIES,
  PARLIAMENT_BUDGET_SHARE,
} from './useWasteStats';

describe('Waste Stats Constants', () => {
  it('should have correct monthly salary', () => {
    expect(DEPUTY_MONTHLY_SALARY).toBe(4021);
  });

  it('should calculate yearly salary with 14 months (Portuguese standard)', () => {
    // Portugal has 14 salary payments (12 months + vacation + Christmas subsidies)
    const expectedYearly = 4021 * 14;
    expect(YEARLY_SALARY).toBe(expectedYearly);
    expect(YEARLY_SALARY).toBe(56294);
  });

  it('should have correct total deputies count', () => {
    // Portuguese Parliament has 230 deputies
    expect(TOTAL_DEPUTIES).toBe(230);
  });

  it('should have parliament budget share as 0.1%', () => {
    expect(PARLIAMENT_BUDGET_SHARE).toBe(0.001);
  });

  it('should calculate plausible total parliament salary budget', () => {
    const totalBudget = TOTAL_DEPUTIES * YEARLY_SALARY;
    // 230 deputies * 56,294€ = ~12.9 million euros
    expect(totalBudget).toBeGreaterThan(12_000_000);
    expect(totalBudget).toBeLessThan(15_000_000);
  });
});

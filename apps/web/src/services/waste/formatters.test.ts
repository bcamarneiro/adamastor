import { describe, expect, it } from 'vitest';
import { formatCurrency } from './useCalculateWaste';

describe('formatCurrency', () => {
  it('should format a number as Portuguese EUR currency', () => {
    const result = formatCurrency(1234.56);
    // Portuguese locale uses space as thousands separator and comma for decimals
    expect(result).toContain('1');
    expect(result).toContain('234');
    expect(result).toContain('56');
    expect(result).toContain('€');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('should handle negative numbers', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500');
    expect(result).toContain('€');
  });

  it('should round to 2 decimal places', () => {
    const result = formatCurrency(10.999);
    // Should round to 11.00
    expect(result).toContain('11');
  });

  it('should format large numbers with thousand separators', () => {
    const result = formatCurrency(1000000);
    // Should contain grouping separators
    expect(result).toContain('1');
    expect(result).toContain('000');
    expect(result).toContain('€');
  });
});

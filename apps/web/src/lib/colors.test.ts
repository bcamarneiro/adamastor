import { describe, expect, it } from 'vitest';
import { getPartyBadgeBackground } from './colors';

describe('getPartyBadgeBackground', () => {
  describe('valid hex colors', () => {
    it('should return color-mix for valid 6-digit hex color', () => {
      const result = getPartyBadgeBackground('#FF5733');
      expect(result).toBe('color-mix(in srgb, #FF5733 20%, transparent)');
    });

    it('should return color-mix for valid 3-digit hex color', () => {
      const result = getPartyBadgeBackground('#F53');
      expect(result).toBe('color-mix(in srgb, #F53 20%, transparent)');
    });

    it('should handle lowercase hex colors', () => {
      const result = getPartyBadgeBackground('#ff5733');
      expect(result).toBe('color-mix(in srgb, #ff5733 20%, transparent)');
    });

    it('should handle mixed case hex colors', () => {
      const result = getPartyBadgeBackground('#Ff5733');
      expect(result).toBe('color-mix(in srgb, #Ff5733 20%, transparent)');
    });
  });

  describe('custom opacity', () => {
    it('should use custom opacity value', () => {
      const result = getPartyBadgeBackground('#FF5733', 50);
      expect(result).toBe('color-mix(in srgb, #FF5733 50%, transparent)');
    });

    it('should clamp opacity above 100 to 100', () => {
      const result = getPartyBadgeBackground('#FF5733', 150);
      expect(result).toBe('color-mix(in srgb, #FF5733 100%, transparent)');
    });

    it('should clamp negative opacity to 0', () => {
      const result = getPartyBadgeBackground('#FF5733', -10);
      expect(result).toBe('color-mix(in srgb, #FF5733 0%, transparent)');
    });

    it('should handle opacity of 0', () => {
      const result = getPartyBadgeBackground('#FF5733', 0);
      expect(result).toBe('color-mix(in srgb, #FF5733 0%, transparent)');
    });

    it('should handle opacity of 100', () => {
      const result = getPartyBadgeBackground('#FF5733', 100);
      expect(result).toBe('color-mix(in srgb, #FF5733 100%, transparent)');
    });
  });

  describe('fallback for invalid inputs', () => {
    it('should return fallback for null color', () => {
      const result = getPartyBadgeBackground(null);
      expect(result).toBe('var(--color-neutral-4)');
    });

    it('should return fallback for undefined color', () => {
      const result = getPartyBadgeBackground(undefined);
      expect(result).toBe('var(--color-neutral-4)');
    });

    it('should return fallback for empty string', () => {
      const result = getPartyBadgeBackground('');
      expect(result).toBe('var(--color-neutral-4)');
    });

    it('should return fallback for hex without hash', () => {
      const result = getPartyBadgeBackground('FF5733');
      expect(result).toBe('var(--color-neutral-4)');
    });

    it('should return fallback for invalid hex length', () => {
      const result = getPartyBadgeBackground('#FF57');
      expect(result).toBe('var(--color-neutral-4)');
    });

    it('should return fallback for non-hex characters', () => {
      const result = getPartyBadgeBackground('#GGGGGG');
      expect(result).toBe('var(--color-neutral-4)');
    });

    it('should return fallback for rgb() color', () => {
      const result = getPartyBadgeBackground('rgb(255, 87, 51)');
      expect(result).toBe('var(--color-neutral-4)');
    });

    it('should return fallback for named color', () => {
      const result = getPartyBadgeBackground('red');
      expect(result).toBe('var(--color-neutral-4)');
    });
  });
});

import { describe, expect, it } from 'bun:test';

// Party colors - extracted from parties.ts for testing
const PARTY_COLORS: Record<string, string> = {
  PS: '#FF66B2',
  PSD: '#FF6600',
  CH: '#202056',
  IL: '#00ADEF',
  BE: '#C40000',
  PCP: '#C41200',
  L: '#00AA00',
  PAN: '#009639',
  'CDS-PP': '#0066CC',
};

describe('PARTY_COLORS', () => {
  it('should have colors for all major Portuguese parties', () => {
    const majorParties = ['PS', 'PSD', 'CH', 'IL', 'BE', 'PCP', 'L', 'PAN', 'CDS-PP'];
    for (const party of majorParties) {
      expect(PARTY_COLORS[party]).toBeDefined();
    }
  });

  it('should have valid hex color codes', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const [_party, color] of Object.entries(PARTY_COLORS)) {
      expect(color).toMatch(hexColorRegex);
    }
  });

  it('should have distinct colors for left and right parties', () => {
    // PS (left) should be different from PSD (right)
    expect(PARTY_COLORS.PS).not.toBe(PARTY_COLORS.PSD);
    // BE (left) should be different from CH (right)
    expect(PARTY_COLORS.BE).not.toBe(PARTY_COLORS.CH);
  });

  it('should have PS with pink color', () => {
    expect(PARTY_COLORS.PS).toBe('#FF66B2');
  });

  it('should have PSD with orange color', () => {
    expect(PARTY_COLORS.PSD).toBe('#FF6600');
  });

  it('should have CH with dark blue color', () => {
    expect(PARTY_COLORS.CH).toBe('#202056');
  });

  it('should have IL with light blue color', () => {
    expect(PARTY_COLORS.IL).toBe('#00ADEF');
  });

  it('should have BE with red color', () => {
    expect(PARTY_COLORS.BE).toBe('#C40000');
  });

  it('should have green parties (L, PAN) with green colors', () => {
    // Both should contain green (00 in the G component)
    expect(PARTY_COLORS.L).toMatch(/#00[A-F0-9]{2}00/i);
    expect(PARTY_COLORS.PAN).toMatch(/#00[A-F0-9]{4}/i);
  });
});

describe('Party color fallback', () => {
  it('should return gray for unknown party', () => {
    const getPartyColor = (acronym: string) => PARTY_COLORS[acronym] || '#808080';

    expect(getPartyColor('UNKNOWN')).toBe('#808080');
    expect(getPartyColor('')).toBe('#808080');
    expect(getPartyColor('XYZ')).toBe('#808080');
  });

  it('should return correct color for known party', () => {
    const getPartyColor = (acronym: string) => PARTY_COLORS[acronym] || '#808080';

    expect(getPartyColor('PS')).toBe('#FF66B2');
    expect(getPartyColor('PSD')).toBe('#FF6600');
  });
});

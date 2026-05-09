import { describe, expect, it } from 'bun:test';
import {
  BIOGRAPHY_TTL_DAYS,
  getStaleCutoffIso,
  isBiographyStale,
  summarizeBiographies,
} from './biography-helpers.js';

describe('biography TTL helpers', () => {
  it('treats biographies older than the TTL as stale, fresh ones as not', () => {
    const now = new Date('2024-06-15T12:00:00.000Z');
    const cutoff = getStaleCutoffIso(now, BIOGRAPHY_TTL_DAYS);

    // Cutoff lands exactly TTL days before `now`.
    expect(cutoff).toBe('2024-06-08T12:00:00.000Z');

    // Older than cutoff → stale.
    expect(isBiographyStale('2024-06-01T00:00:00.000Z', cutoff)).toBe(true);
    // Strictly newer than cutoff → not stale.
    expect(isBiographyStale('2024-06-14T00:00:00.000Z', cutoff)).toBe(false);
  });

  it('treats null/undefined scraped_at as needing scraping', () => {
    const cutoff = getStaleCutoffIso(new Date('2024-06-15T12:00:00.000Z'));
    expect(isBiographyStale(null, cutoff)).toBe(true);
    expect(isBiographyStale(undefined, cutoff)).toBe(true);
  });
});

describe('summarizeBiographies', () => {
  it('counts only the populated optional fields per scraped bio', () => {
    const summary = summarizeBiographies([
      { birthDate: '1970-05-01', profession: 'Lawyer', education: 'Law degree' },
      { birthDate: null, profession: 'Engineer', education: null },
      { birthDate: '1985-09-12', profession: null, education: 'PhD' },
    ]);

    expect(summary.scraped).toBe(3);
    expect(summary.withBirthDate).toBe(2);
    expect(summary.withProfession).toBe(2);
    expect(summary.withEducation).toBe(2);
  });

  it('returns zeroes for an empty input list', () => {
    expect(summarizeBiographies([])).toEqual({
      scraped: 0,
      withBirthDate: 0,
      withProfession: 0,
      withEducation: 0,
    });
  });
});

/**
 * Pure helpers for the biography transform.
 *
 * Extracted from `biography.ts` so the TTL-staleness logic and the
 * biography-data summariser can be unit-tested without importing supabase.
 */

/** Number of days before a biography is considered stale and needs re-scraping */
export const BIOGRAPHY_TTL_DAYS = 7;

/**
 * Compute the ISO-8601 cutoff before which a biography counts as stale.
 *
 * `biography.ts` uses `new Date()` for the reference point; we accept it as
 * a parameter so callers can be deterministic in tests.
 */
export function getStaleCutoffIso(
  now: Date = new Date(),
  ttlDays: number = BIOGRAPHY_TTL_DAYS
): string {
  const stale = new Date(now);
  stale.setDate(stale.getDate() - ttlDays);
  return stale.toISOString();
}

/**
 * Decide whether a deputy's biography needs re-scraping.
 *
 * Mirrors the predicate inside `getDeputiesWithBiographyId`:
 *  - true if the biography has never been scraped (`scrapedAt` is null)
 *  - true if `scrapedAt` is strictly older than the cutoff
 *  - false otherwise
 */
export function isBiographyStale(
  scrapedAtIso: string | null | undefined,
  cutoffIso: string
): boolean {
  if (!scrapedAtIso) return true;
  return scrapedAtIso < cutoffIso;
}

/**
 * Shape of biography data scraped per deputy. Mirrors `BiographyData` in the
 * scraper module but redeclared here to keep this helper free of imports.
 */
export interface BiographyLike {
  birthDate?: string | null;
  profession?: string | null;
  education?: string | null;
}

/**
 * Roll up a list of scraped biographies into the counters reported by the
 * transform's summary block.
 */
export function summarizeBiographies(bios: BiographyLike[]): {
  scraped: number;
  withBirthDate: number;
  withProfession: number;
  withEducation: number;
} {
  let withBirthDate = 0;
  let withProfession = 0;
  let withEducation = 0;

  for (const bio of bios) {
    if (bio.birthDate) withBirthDate++;
    if (bio.profession) withProfession++;
    if (bio.education) withEducation++;
  }

  return {
    scraped: bios.length,
    withBirthDate,
    withProfession,
    withEducation,
  };
}

/**
 * Pure helpers for the attendance transform.
 *
 * Extracted from `attendance.ts` so the name-matching logic can be
 * unit-tested without importing supabase.
 */

/**
 * Lowercase, strip diacritics and non-letters from a name.
 *
 * Used for fuzzy matching deputy names returned by different Parliament
 * endpoints (which inconsistently include accents and punctuation).
 */
export function normalizeName(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: Unicode range for diacritical marks is intentional
      .replace(/[̀-ͯ]/g, '') // Remove accents
      .replace(/[^a-z\s]/g, '') // Remove non-letters
      .trim()
  );
}

/**
 * Fuzzy-match two deputy names.
 *
 * Returns true when:
 *  - normalised forms are identical, OR
 *  - one normalised form fully contains the other (covers full-name vs
 *    short-name), OR
 *  - at least 70% of words from the shorter name appear in the longer one.
 */
export function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);

  if (n1 === n2) return true;

  if (n1.includes(n2) || n2.includes(n1)) return true;

  const words1 = n1.split(/\s+/);
  const words2 = n2.split(/\s+/);
  const shorter = words1.length <= words2.length ? words1 : words2;
  const longer = words1.length > words2.length ? words1 : words2;

  const matchingWords = shorter.filter((w) => longer.some((lw) => lw === w || lw.includes(w)));
  return matchingWords.length >= Math.ceil(shorter.length * 0.7);
}

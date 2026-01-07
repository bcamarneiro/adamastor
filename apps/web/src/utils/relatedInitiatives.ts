import type { Initiative } from '@/services/initiatives/useInitiatives';

/**
 * Default limit for the number of related initiatives returned
 */
export const DEFAULT_RELATED_INITIATIVES_LIMIT = 3;

/**
 * Checks if initiative1 has any title words that appear in initiative2's title.
 * This performs a case-insensitive substring match for each word.
 */
function hasSharedTitleWords(initiative1: Initiative, initiative2: Initiative): boolean {
  const targetTitleLower = initiative2.IniTitulo.toLowerCase();
  return initiative1.IniTitulo.split(' ').some((word) =>
    targetTitleLower.includes(word.toLowerCase())
  );
}

/**
 * Determines if two initiatives are related.
 * Initiatives are considered related if:
 * - They have the same type (IniTipo), OR
 * - They share at least one significant word in their titles
 */
export function areInitiativesRelated(
  initiative1: Initiative,
  initiative2: Initiative
): boolean {
  // Same type means related
  if (initiative1.IniTipo === initiative2.IniTipo) {
    return true;
  }

  // Check for shared title words
  return hasSharedTitleWords(initiative1, initiative2);
}

/**
 * Computes related initiatives for a given initiative from a list of all initiatives.
 *
 * Initiatives are considered related if they:
 * - Have the same type (IniTipo), OR
 * - Share at least one significant word in their titles
 *
 * The initiative itself is excluded from the results.
 *
 * @param initiative - The initiative to find related initiatives for
 * @param allInitiatives - The full list of initiatives to search through
 * @param limit - Maximum number of related initiatives to return (default: 3)
 * @returns Array of related initiatives, limited to the specified count
 *
 * @example
 * ```ts
 * const related = getRelatedInitiatives(currentInitiative, allInitiatives);
 * // Returns up to 3 related initiatives
 * ```
 */
export function getRelatedInitiatives(
  initiative: Initiative,
  allInitiatives: Initiative[],
  limit: number = DEFAULT_RELATED_INITIATIVES_LIMIT
): Initiative[] {
  return allInitiatives
    .filter(
      (ini) =>
        ini.IniId !== initiative.IniId && areInitiativesRelated(initiative, ini)
    )
    .slice(0, limit);
}

/**
 * Type for the initiative ID used as map key
 */
export type IniId = Initiative['IniId'];

/**
 * Map type for storing precomputed related initiatives
 */
export type RelatedInitiativesMap = Map<IniId, Initiative[]>;

/**
 * Precomputes related initiatives for ALL initiatives in a single O(n²) pass.
 *
 * This function builds a lookup map where each initiative's ID maps to its
 * array of related initiatives. This allows O(1) lookups during render
 * instead of computing O(n) filters per row.
 *
 * @param initiatives - The full list of initiatives to process
 * @param limit - Maximum number of related initiatives per entry (default: 3)
 * @returns A Map where keys are initiative IDs and values are arrays of related initiatives
 *
 * @example
 * ```ts
 * const relatedMap = buildRelatedInitiativesMap(allInitiatives);
 *
 * // Later, during render (O(1) lookup):
 * const related = relatedMap.get(initiative.IniId) ?? [];
 * ```
 *
 * @performance
 * - Time complexity: O(n²) where n is the number of initiatives
 * - Space complexity: O(n * limit) for storing the map
 * - Should be called once when initiatives load, not on every render
 */
export function buildRelatedInitiativesMap(
  initiatives: Initiative[],
  limit: number = DEFAULT_RELATED_INITIATIVES_LIMIT
): RelatedInitiativesMap {
  const map: RelatedInitiativesMap = new Map();

  for (const initiative of initiatives) {
    const relatedInitiatives = getRelatedInitiatives(
      initiative,
      initiatives,
      limit
    );
    map.set(initiative.IniId, relatedInitiatives);
  }

  return map;
}

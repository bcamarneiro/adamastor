/**
 * Deputy transformation module.
 *
 * Handles:
 * - Main deputy data transformation
 * - Stats initialization
 * - Extended info (roles, party history, status history)
 */

export { transformDeputies } from './transform.js';
export { ensureDeputyStats } from './stats.js';
export { syncDeputyExtendedInfo } from './extended.js';
export type { ParliamentDeputado, DeputyMaps } from './types.js';

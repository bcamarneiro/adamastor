/**
 * Deputy transformation module.
 *
 * Handles:
 * - Main deputy data transformation
 * - Stats initialization
 * - Extended info (roles, party history, status history)
 */

export { syncDeputyExtendedInfo } from './extended.js';
export { ensureDeputyStats } from './stats.js';
export { transformDeputies } from './transform.js';
export type { DeputyMaps, ParliamentDeputado } from './types.js';

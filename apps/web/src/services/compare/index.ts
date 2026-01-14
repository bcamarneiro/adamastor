/**
 * Generic comparison hook factory module.
 *
 * This module provides a factory function for creating typed comparison hooks,
 * eliminating duplication between useCompareDistricts, useCompareParties,
 * and useCompareDeputies.
 *
 * @example
 * import { createCompareHook, type MetricConfig } from '@/services/compare';
 *
 * const metricsConfig: MetricConfig<MyEntity>[] = [
 *   { label: 'Score', getValue: (e) => e.score, higherIsBetter: true },
 * ];
 *
 * export const useCompareMyEntity = createCompareHook<MyEntity>(metricsConfig);
 */

// Factory function
export { createCompareHook } from './createCompareHook';

// Types
export type {
  ComparisonMetric,
  ComparisonResult,
  MetricConfig,
  CompareOptions,
} from './types';

// Utility function and type
export { compare } from './utils';
export type { CompareResult } from './utils';

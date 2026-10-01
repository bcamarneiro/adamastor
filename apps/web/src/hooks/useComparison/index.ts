// Types

// Compare utility
export { type CompareResult, compare } from './compare';
export type {
  ComparisonMetric,
  ComparisonResult,
  MetricConfig,
} from './types';
// Hook
// Default export for convenient usage
export {
  type UseComparisonOptions,
  useComparison,
  useComparison as default,
} from './useComparison';

// Types
export type {
  ComparisonMetric,
  MetricConfig,
  ComparisonResult,
} from './types';

// Compare utility
export { compare, type CompareResult } from './compare';

// Hook
export {
  useComparison,
  type UseComparisonOptions,
} from './useComparison';

// Default export for convenient usage
export { useComparison as default } from './useComparison';

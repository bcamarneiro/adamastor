import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Feature flags for toggling features that need work or are in development.
 * These can be toggled off to hide incomplete features from production.
 */
export interface FeatureFlags {
  /** Issue #49 - Waste calculator needs better explanations */
  wasteCalculator: boolean;
  /** Issue #37 - Download image functionality */
  downloadImage: boolean;
  /** Issue #39 - Average display shows 0 incorrectly */
  averageDisplay: boolean;
  /** Issue #5 - Question count is always 0 */
  questionCount: boolean;
  /** BRU-882 - Monthly performance trajectory visualization */
  monthlyTrajectory: boolean;
}

interface FeatureFlagsStore {
  flags: FeatureFlags;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  setFlags: (flags: Partial<FeatureFlags>) => void;
}

// Default flags - set to false to hide broken features
const DEFAULT_FLAGS: FeatureFlags = {
  wasteCalculator: false, // Hide until explanations are improved
  downloadImage: false, // Hide until download is fixed
  averageDisplay: false, // Hide until average calculation is correct
  questionCount: false, // Hide until question count data is populated
  monthlyTrajectory: false, // Hide until monthly data pipeline is ready
};

export const useFeatureFlags = create<FeatureFlagsStore>()(
  persist(
    (set) => ({
      flags: DEFAULT_FLAGS,
      setFlag: (flag, value) =>
        set((state) => ({
          flags: { ...state.flags, [flag]: value },
        })),
      setFlags: (newFlags) =>
        set((state) => ({
          flags: { ...state.flags, ...newFlags },
        })),
    }),
    {
      name: 'adamastor-feature-flags',
    }
  )
);

/**
 * Legislature Service
 *
 * Manages legislature configuration stored in the database.
 * Provides functions to get and set the current legislature.
 *
 * Related Issue: #6
 */

import { CURRENT_LEGISLATURE, CURRENT_LEGISLATURE_ROMAN } from 'shared';
import { supabase } from '../supabase.js';
import type { LegislatureDetectionResult } from '../transform/legislature-detection.js';

/**
 * Get the current legislature number from database config.
 * Falls back to constant if not found in database.
 *
 * @returns Current legislature number
 */
export async function getCurrentLegislature(): Promise<number> {
  const { data, error } = await supabase
    .from('legislature_config')
    .select('legislature_number')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback to constant if database query fails or no record exists
    return CURRENT_LEGISLATURE;
  }

  return data.legislature_number;
}

/**
 * Update the current legislature in the database config table.
 * Deactivates previous records and sets the new one as active.
 *
 * @param detected - Detection result from detectLegislatureFromData
 * @returns Success status
 */
export async function updateLegislatureFromDetection(
  detected: LegislatureDetectionResult
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use the database function to set current legislature
    const { error } = await supabase.rpc('set_current_legislature', {
      p_legislature_number: detected.number,
      p_legislature_roman: detected.roman,
      p_detected_from: detected.source,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Validate detected legislature against the constant.
 * Returns validation result with warnings.
 *
 * @param detected - Detection result
 * @returns Validation result
 */
export function validateLegislature(detected: LegislatureDetectionResult): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!detected.matchesConstant) {
    warnings.push(
      `Legislature mismatch: Detected ${detected.number} (${detected.roman}) but constant is ${CURRENT_LEGISLATURE} (${CURRENT_LEGISLATURE_ROMAN})`
    );
  }

  // Add any warnings from detection
  warnings.push(...detected.warnings);

  return {
    isValid: detected.matchesConstant && detected.warnings.length === 0,
    warnings,
  };
}


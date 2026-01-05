/**
 * Legislature Auto-Detection
 *
 * Detects the current legislature from Parliament API data and validates
 * against the hardcoded constant.
 *
 * Related Issue: #6
 */

import { CURRENT_LEGISLATURE, CURRENT_LEGISLATURE_ROMAN } from 'shared';
import type { ParliamentInformacaoBase } from './types.js';

// Roman numeral mapping (subset needed for legislatures)
const romanNumerals: Record<string, number> = {
  XV: 15,
  XVI: 16,
  XVII: 17,
  XVIII: 18,
  XIX: 19,
  XX: 20,
};

/**
 * Parse legislature from Roman numeral string.
 * Returns null if parsing fails (unlike helpers.ts version which returns 17).
 */
function parseLegislatureOrNull(legDes: string): number | null {
  const trimmed = legDes.trim().toUpperCase();
  return romanNumerals[trimmed] ?? null;
}

export interface LegislatureDetectionResult {
  /** Detected legislature number (e.g., 17) */
  number: number;
  /** Detected legislature Roman numeral (e.g., "XVII") */
  roman: string;
  /** Source of detection (e.g., "DetalheLegislatura.sigla") */
  source: string;
  /** Whether detected value matches the constant */
  matchesConstant: boolean;
  /** Warning messages if validation fails */
  warnings: string[];
}

/**
 * Detects the current legislature from informacao_base data.
 *
 * Extracts the legislature from DetalheLegislatura.sigla and validates
 * against the CURRENT_LEGISLATURE constant.
 *
 * @param infoBase - Parsed informacao_base.json data
 * @returns Detection result with validation status
 */
export function detectLegislatureFromData(
  infoBase: ParliamentInformacaoBase
): LegislatureDetectionResult {
  const warnings: string[] = [];
  let detectedNumber: number | null = null;
  let detectedRoman: string | null = null;
  let source = 'unknown';

  // Try to detect from DetalheLegislatura.sigla
  if (infoBase.DetalheLegislatura?.sigla) {
    const sigla = infoBase.DetalheLegislatura.sigla.trim();
    const parsed = parseLegislatureOrNull(sigla);

    if (parsed !== null) {
      source = 'DetalheLegislatura.sigla';
      detectedRoman = sigla.toUpperCase();
      detectedNumber = parsed;
    } else {
      warnings.push(`Failed to parse legislature from "${sigla}"`);
    }
  } else {
    warnings.push('DetalheLegislatura.sigla not found in API data');
  }

  // Fallback: try to detect from first deputy's LegDes
  if (detectedNumber === null && infoBase.Deputados?.length > 0) {
    const firstDeputy = infoBase.Deputados[0];
    if (firstDeputy?.LegDes) {
      const legDes = firstDeputy.LegDes.trim();
      const parsed = parseLegislatureOrNull(legDes);

      if (parsed !== null) {
        source = 'Deputados[0].LegDes';
        detectedRoman = legDes.toUpperCase();
        detectedNumber = parsed;
      } else {
        warnings.push(`Failed to parse legislature from deputy LegDes "${legDes}"`);
      }
    }
  }

  // Final fallback to constant
  if (!detectedNumber) {
    detectedNumber = CURRENT_LEGISLATURE;
    detectedRoman = CURRENT_LEGISLATURE_ROMAN;
    source = 'fallback (CURRENT_LEGISLATURE constant)';
    warnings.push('Could not detect legislature from API data, using hardcoded constant');
  }

  // Validate against constant
  const matchesConstant = detectedNumber === CURRENT_LEGISLATURE;
  if (!matchesConstant) {
    warnings.push(
      `⚠️  Legislature mismatch detected! API shows ${detectedNumber} (${detectedRoman}), but constant is ${CURRENT_LEGISLATURE} (${CURRENT_LEGISLATURE_ROMAN}). Consider updating CURRENT_LEGISLATURE in packages/shared/src/types.ts`
    );
  }

  return {
    number: detectedNumber,
    roman: detectedRoman || CURRENT_LEGISLATURE_ROMAN,
    source,
    matchesConstant,
    warnings,
  };
}

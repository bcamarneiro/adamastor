// Regex to validate hex color format: #RGB or #RRGGBB
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Creates a background color with proper opacity for party badges.
 * Uses color-mix() for better dark mode support compared to hex alpha.
 *
 * @param hexColor - The party's hex color (e.g., "#FF5733")
 * @param opacity - Opacity percentage (0-100), defaults to 20
 * @returns CSS color-mix() value for theme-aware transparency
 */
export function getPartyBadgeBackground(hexColor: string | null | undefined, opacity = 20): string {
  // Fallback for missing color
  if (!hexColor) {
    return 'var(--color-neutral-4)';
  }

  // Validate hex color format
  if (!HEX_COLOR_REGEX.test(hexColor)) {
    return 'var(--color-neutral-4)';
  }

  // Clamp opacity to valid range
  const clampedOpacity = Math.max(0, Math.min(100, opacity));

  // Use color-mix for better dark mode support
  // This mixes the party color with transparent at the given opacity
  return `color-mix(in srgb, ${hexColor} ${clampedOpacity}%, transparent)`;
}

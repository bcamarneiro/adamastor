/**
 * Creates a background color with proper opacity for party badges.
 * Uses color-mix() for better dark mode support compared to hex alpha.
 *
 * @param hexColor - The party's hex color (e.g., "#FF5733")
 * @param opacity - Opacity percentage (0-100), defaults to 20
 * @returns CSS color-mix() value for theme-aware transparency
 */
export function getPartyBadgeBackground(hexColor: string | null | undefined, opacity = 20): string {
  if (!hexColor) {
    return 'var(--color-neutral-4)';
  }

  // Use color-mix for better dark mode support
  // This mixes the party color with transparent at the given opacity
  return `color-mix(in srgb, ${hexColor} ${opacity}%, transparent)`;
}

// Party colors - official or commonly used. Kept in a supabase-free module
// so tests can import without triggering the supabase env-var check.

export const PARTY_COLORS: Record<string, string> = {
  PS: '#FF66B2', // Pink (Socialist Party)
  PSD: '#FF6600', // Orange (Social Democratic Party)
  CH: '#202056', // Dark blue (Chega)
  IL: '#00ADEF', // Light blue (Liberal Initiative)
  BE: '#C40000', // Red (Left Bloc)
  PCP: '#C41200', // Dark red (Communist Party)
  L: '#00AA00', // Green (Livre)
  PAN: '#009639', // Dark green (People-Animals-Nature)
  'CDS-PP': '#0066CC', // Blue (CDS)
};

const FALLBACK_PARTY_COLOR = '#808080';

export function getPartyColor(acronym: string): string {
  return PARTY_COLORS[acronym] || FALLBACK_PARTY_COLOR;
}

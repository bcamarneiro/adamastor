/**
 * Pure helpers for the initiatives transform.
 *
 * Extracted from `initiatives.ts` so the HTML vote-detail parser and the
 * status-event picker can be unit-tested without importing supabase.
 */

export interface ParliamentEvento {
  EvtId: string;
  OevId: string;
  Fase: string;
  CodigoFase: string;
  DataFase: string;
  Votacao: unknown[] | null;
}

export interface ParliamentIniciativaLite {
  IniEventos?: ParliamentEvento[];
}

/**
 * Parse a Parliament `detalhe` HTML string into per-stance party lists.
 *
 * Input format (real shape, with raw HTML and inconsistent spacing):
 *   "A Favor: <I>PSD</I>, <I> CDS-PP</I><BR>Contra:<I>CH</I>, <I> BE</I><BR>Abstenção:<I>PS</I>"
 */
export function parsePartyVoteDetail(detalhe: string): {
  favor: string[];
  against: string[];
  abstain: string[];
} {
  const result = { favor: [] as string[], against: [] as string[], abstain: [] as string[] };

  const clean = detalhe
    .replace(/<BR>/gi, '\n')
    .replace(/<\/?I>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  const lines = clean.split('\n');

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    let parties: string[] = [];

    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const partyPart = line.substring(colonIndex + 1);
      parties = partyPart
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && p.length < 20); // Sanity check
    }

    if (lowerLine.startsWith('a favor')) {
      result.favor = parties;
    } else if (lowerLine.startsWith('contra')) {
      result.against = parties;
    } else if (lowerLine.startsWith('abstenção') || lowerLine.startsWith('abstencao')) {
      result.abstain = parties;
    }
  }

  return result;
}

/**
 * Pick the latest event's `Fase` (status label) for an initiative.
 *
 * Sorted lexicographically by `DataFase` (ISO dates compare correctly that way).
 */
export function getInitiativeStatus(ini: ParliamentIniciativaLite): string | undefined {
  if (!ini.IniEventos || ini.IniEventos.length === 0) return undefined;

  const sorted = [...ini.IniEventos].sort((a, b) =>
    (a.DataFase || '').localeCompare(b.DataFase || '')
  );
  return sorted[sorted.length - 1]?.Fase;
}

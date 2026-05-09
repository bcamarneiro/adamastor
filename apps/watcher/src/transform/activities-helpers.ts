/**
 * Pure helpers for the activities transform.
 *
 * Kept separate from `activities.ts` so they can be unit-tested without
 * importing `supabase.ts` (which throws at import time when env vars are
 * missing).
 */

export interface ParliamentDebate {
  DebateId: string;
  Assunto: string;
  AutoresDeputados: string | null;
  AutoresGP: string | null;
  DataDebate: string;
  Intervencoes: string[];
  TipoDebateDesig: string;
}

export interface ParliamentAtividades {
  Debates: ParliamentDebate[];
}

/**
 * Parse "Deputy Name (PARTY)" author strings emitted by the Parliament API.
 * Returns null if the input is null/empty or does not match the expected shape.
 */
export function extractDeputyFromAuthor(
  authorString: string | null
): { name: string; party: string } | null {
  if (!authorString) return null;

  // Format: "Deputy Name (PARTY)" — party may contain a hyphen (e.g. "CDS-PP")
  const match = authorString.match(/^(.+?)\s*\((\w+(?:-\w+)?)\)$/);
  if (match) {
    const name = match[1];
    const party = match[2];
    if (name && party) {
      return { name: name.trim(), party };
    }
  }
  return null;
}

/**
 * Count intervention totals per party from a list of debates.
 *
 * Attribution rules (mirrors production behaviour):
 *  - If a debate has `AutoresGP` (party authors), all its interventions are
 *    split among each listed party.
 *  - Otherwise, if a debate has a `AutoresDeputados` string we recognise,
 *    interventions are attributed to that deputy's party.
 *  - Debates with no recognisable authorship contribute nothing.
 */
export function countInterventionsByParty(atividades: ParliamentAtividades): Map<string, number> {
  const counts = new Map<string, number>();
  const debates = atividades.Debates || [];

  for (const debate of debates) {
    const interventionCount = debate.Intervencoes?.length || 0;

    if (debate.AutoresGP) {
      const parties = debate.AutoresGP.split(',').map((p) => p.trim());
      for (const party of parties) {
        counts.set(party, (counts.get(party) || 0) + interventionCount);
      }
    } else if (debate.AutoresDeputados) {
      const author = extractDeputyFromAuthor(debate.AutoresDeputados);
      if (author) {
        counts.set(author.party, (counts.get(author.party) || 0) + interventionCount);
      }
    }
  }

  return counts;
}

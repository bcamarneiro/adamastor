/**
 * Pure helpers for the stats transform.
 *
 * Extracted from `stats.ts` so the per-party vote aggregation can be
 * unit-tested without importing supabase.
 */

export interface PartyVoteRow {
  parties_favor: string[] | null;
  parties_against: string[] | null;
  parties_abstain: string[] | null;
}

export interface PartyVoteCounts {
  favor: number;
  against: number;
  abstain: number;
  total: number;
}

/**
 * Aggregate per-party vote tallies from a flat list of `party_votes` rows.
 *
 * For each row, every party listed in `parties_favor`/`parties_against`/
 * `parties_abstain` gets +1 in the matching bucket and +1 in `total`. Rows
 * with null/undefined arrays are tolerated (treated as empty).
 */
export function aggregatePartyVoteCounts(votes: PartyVoteRow[]): Map<string, PartyVoteCounts> {
  const partyCounts = new Map<string, PartyVoteCounts>();

  const bump = (party: string, key: 'favor' | 'against' | 'abstain') => {
    const current = partyCounts.get(party) || { favor: 0, against: 0, abstain: 0, total: 0 };
    current[key]++;
    current.total++;
    partyCounts.set(party, current);
  };

  for (const vote of votes) {
    for (const party of vote.parties_favor || []) bump(party, 'favor');
    for (const party of vote.parties_against || []) bump(party, 'against');
    for (const party of vote.parties_abstain || []) bump(party, 'abstain');
  }

  return partyCounts;
}

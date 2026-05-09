import { describe, expect, it } from 'bun:test';
import { aggregatePartyVoteCounts } from './stats-helpers.js';

describe('aggregatePartyVoteCounts', () => {
  it('tallies favor/against/abstain per party across multiple votes', () => {
    const counts = aggregatePartyVoteCounts([
      // Vote 1: PS favor; PSD/CH against; IL abstain.
      {
        parties_favor: ['PS'],
        parties_against: ['PSD', 'CH'],
        parties_abstain: ['IL'],
      },
      // Vote 2: PS favor again; PSD favor; nobody against.
      {
        parties_favor: ['PS', 'PSD'],
        parties_against: [],
        parties_abstain: ['IL'],
      },
    ]);

    expect(counts.get('PS')).toEqual({ favor: 2, against: 0, abstain: 0, total: 2 });
    expect(counts.get('PSD')).toEqual({ favor: 1, against: 1, abstain: 0, total: 2 });
    expect(counts.get('CH')).toEqual({ favor: 0, against: 1, abstain: 0, total: 1 });
    expect(counts.get('IL')).toEqual({ favor: 0, against: 0, abstain: 2, total: 2 });
  });

  it('tolerates rows with null arrays and an empty input list', () => {
    expect(aggregatePartyVoteCounts([]).size).toBe(0);

    const counts = aggregatePartyVoteCounts([
      { parties_favor: null, parties_against: null, parties_abstain: null },
      { parties_favor: ['BE'], parties_against: null, parties_abstain: null },
    ]);

    expect(counts.size).toBe(1);
    expect(counts.get('BE')).toEqual({ favor: 1, against: 0, abstain: 0, total: 1 });
  });
});

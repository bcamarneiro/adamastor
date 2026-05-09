import { describe, expect, it } from 'bun:test';
import { getInitiativeStatus, parsePartyVoteDetail } from './initiatives-helpers.js';

describe('parsePartyVoteDetail', () => {
  it('parses real-shape detalhe with mixed casing, extra spaces and italic tags', () => {
    const detalhe =
      'A Favor: <I>PSD</I>, <I> CDS-PP</I><BR>Contra:<I>CH</I>, <I> BE</I><BR>Abstenção:<I>PS</I>';

    const result = parsePartyVoteDetail(detalhe);

    expect(result.favor).toEqual(['PSD', 'CDS-PP']);
    expect(result.against).toEqual(['CH', 'BE']);
    expect(result.abstain).toEqual(['PS']);
  });

  it('handles unaccented "Abstencao" header and an empty section', () => {
    // No "Contra" line at all → against stays empty.
    const detalhe = 'A Favor: <I>PS</I><BR>Abstencao:<I>IL</I>';

    const result = parsePartyVoteDetail(detalhe);

    expect(result.favor).toEqual(['PS']);
    expect(result.against).toEqual([]);
    expect(result.abstain).toEqual(['IL']);
  });
});

describe('getInitiativeStatus', () => {
  it('returns the Fase of the latest event by DataFase (ISO date)', () => {
    const status = getInitiativeStatus({
      IniEventos: [
        {
          EvtId: 'e1',
          OevId: 'o1',
          Fase: 'Apresentação',
          CodigoFase: '10',
          DataFase: '2024-01-01',
          Votacao: null,
        },
        {
          EvtId: 'e3',
          OevId: 'o3',
          Fase: 'Aprovação',
          CodigoFase: '40',
          DataFase: '2024-03-15',
          Votacao: null,
        },
        {
          EvtId: 'e2',
          OevId: 'o2',
          Fase: 'Discussão',
          CodigoFase: '20',
          DataFase: '2024-02-10',
          Votacao: null,
        },
      ],
    });
    expect(status).toBe('Aprovação');
  });

  it('returns undefined when there are no events', () => {
    expect(getInitiativeStatus({})).toBeUndefined();
    expect(getInitiativeStatus({ IniEventos: [] })).toBeUndefined();
  });
});

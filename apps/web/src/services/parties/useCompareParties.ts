import { useMemo } from 'react';
import type { PartyStats } from '../../lib/supabase';

export interface PartyComparisonMetric {
  label: string;
  valueA: number;
  valueB: number;
  winnerA: boolean;
  winnerB: boolean;
  tie: boolean;
  higherIsBetter: boolean;
}

export interface PartyComparisonResult {
  partyA: PartyStats;
  partyB: PartyStats;
  metrics: PartyComparisonMetric[];
  winsA: number;
  winsB: number;
  ties: number;
  winner: 'A' | 'B' | 'tie';
}

function compare(
  a: number | null,
  b: number | null,
  higherIsBetter = true
): { winnerA: boolean; winnerB: boolean; tie: boolean } {
  const valA = a ?? 0;
  const valB = b ?? 0;

  if (valA === valB) {
    return { winnerA: false, winnerB: false, tie: true };
  }

  const aWins = higherIsBetter ? valA > valB : valA < valB;
  return {
    winnerA: aWins,
    winnerB: !aWins,
    tie: false,
  };
}

export function useCompareParties(
  partyA: PartyStats | null,
  partyB: PartyStats | null
): PartyComparisonResult | null {
  return useMemo(() => {
    if (!partyA || !partyB) return null;

    const metricsConfig: {
      label: string;
      getA: () => number | null;
      getB: () => number | null;
      higherIsBetter: boolean;
    }[] = [
      {
        label: 'Pontuacao Media',
        getA: () => partyA.avg_work_score,
        getB: () => partyB.avg_work_score,
        higherIsBetter: true,
      },
      {
        label: 'Total de Propostas',
        getA: () => partyA.total_proposals,
        getB: () => partyB.total_proposals,
        higherIsBetter: true,
      },
      {
        label: 'Total de Intervencoes',
        getA: () => partyA.total_interventions,
        getB: () => partyB.total_interventions,
        higherIsBetter: true,
      },
      {
        label: 'Total de Perguntas',
        getA: () => partyA.total_questions,
        getB: () => partyB.total_questions,
        higherIsBetter: true,
      },
      {
        label: 'Propostas por Deputado',
        getA: () =>
          partyA.deputy_count > 0 ? (partyA.total_proposals ?? 0) / partyA.deputy_count : 0,
        getB: () =>
          partyB.deputy_count > 0 ? (partyB.total_proposals ?? 0) / partyB.deputy_count : 0,
        higherIsBetter: true,
      },
    ];

    const metrics: PartyComparisonMetric[] = metricsConfig.map((m) => {
      const valueA = m.getA() ?? 0;
      const valueB = m.getB() ?? 0;
      const { winnerA, winnerB, tie } = compare(valueA, valueB, m.higherIsBetter);
      return {
        label: m.label,
        valueA,
        valueB,
        winnerA,
        winnerB,
        tie,
        higherIsBetter: m.higherIsBetter,
      };
    });

    const winsA = metrics.filter((m) => m.winnerA).length;
    const winsB = metrics.filter((m) => m.winnerB).length;
    const ties = metrics.filter((m) => m.tie).length;

    let winner: 'A' | 'B' | 'tie';
    if (winsA > winsB) {
      winner = 'A';
    } else if (winsB > winsA) {
      winner = 'B';
    } else {
      winner = 'tie';
    }

    return {
      partyA,
      partyB,
      metrics,
      winsA,
      winsB,
      ties,
      winner,
    };
  }, [partyA, partyB]);
}

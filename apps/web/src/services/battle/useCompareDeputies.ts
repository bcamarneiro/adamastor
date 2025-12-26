import { useMemo } from 'react';
import type { DeputyDetail } from '../../lib/supabase';

interface ComparisonMetric {
  label: string;
  valueA: number;
  valueB: number;
  winnerA: boolean;
  winnerB: boolean;
  tie: boolean;
}

interface ComparisonResult {
  deputyA: DeputyDetail;
  deputyB: DeputyDetail;
  metrics: ComparisonMetric[];
  winsA: number;
  winsB: number;
  ties: number;
  winner: 'A' | 'B' | 'tie';
  scoreDifference: number;
}

export function useCompareDeputies(
  deputyA: DeputyDetail | null,
  deputyB: DeputyDetail | null
): ComparisonResult | null {
  return useMemo(() => {
    if (!deputyA || !deputyB) return null;

    const metrics: ComparisonMetric[] = [
      {
        label: 'Pontuacao Global',
        valueA: deputyA.work_score,
        valueB: deputyB.work_score,
        winnerA: deputyA.work_score > deputyB.work_score,
        winnerB: deputyB.work_score > deputyA.work_score,
        tie: deputyA.work_score === deputyB.work_score,
      },
      {
        label: 'Propostas',
        valueA: deputyA.proposal_count,
        valueB: deputyB.proposal_count,
        winnerA: deputyA.proposal_count > deputyB.proposal_count,
        winnerB: deputyB.proposal_count > deputyA.proposal_count,
        tie: deputyA.proposal_count === deputyB.proposal_count,
      },
      {
        label: 'Intervencoes',
        valueA: deputyA.intervention_count,
        valueB: deputyB.intervention_count,
        winnerA: deputyA.intervention_count > deputyB.intervention_count,
        winnerB: deputyB.intervention_count > deputyA.intervention_count,
        tie: deputyA.intervention_count === deputyB.intervention_count,
      },
      {
        label: 'Perguntas',
        valueA: deputyA.question_count,
        valueB: deputyB.question_count,
        winnerA: deputyA.question_count > deputyB.question_count,
        winnerB: deputyB.question_count > deputyA.question_count,
        tie: deputyA.question_count === deputyB.question_count,
      },
      {
        label: 'Ranking Nacional',
        valueA: deputyA.national_rank,
        valueB: deputyB.national_rank,
        winnerA: deputyA.national_rank < deputyB.national_rank, // Lower rank is better
        winnerB: deputyB.national_rank < deputyA.national_rank,
        tie: deputyA.national_rank === deputyB.national_rank,
      },
    ];

    const winsA = metrics.filter((m) => m.winnerA).length;
    const winsB = metrics.filter((m) => m.winnerB).length;
    const ties = metrics.filter((m) => m.tie).length;

    let winner: 'A' | 'B' | 'tie';
    if (winsA > winsB) {
      winner = 'A';
    } else if (winsB > winsA) {
      winner = 'B';
    } else {
      // Use work_score as tiebreaker
      if (deputyA.work_score > deputyB.work_score) {
        winner = 'A';
      } else if (deputyB.work_score > deputyA.work_score) {
        winner = 'B';
      } else {
        winner = 'tie';
      }
    }

    return {
      deputyA,
      deputyB,
      metrics,
      winsA,
      winsB,
      ties,
      winner,
      scoreDifference: Math.abs(deputyA.work_score - deputyB.work_score),
    };
  }, [deputyA, deputyB]);
}

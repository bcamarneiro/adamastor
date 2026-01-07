import { useMemo } from 'react';
import { compare } from 'shared';
import type { DistrictStats } from '../../lib/supabase';

export interface DistrictComparisonMetric {
  label: string;
  valueA: number;
  valueB: number;
  winnerA: boolean;
  winnerB: boolean;
  tie: boolean;
  higherIsBetter: boolean;
}

export interface DistrictComparisonResult {
  districtA: DistrictStats;
  districtB: DistrictStats;
  metrics: DistrictComparisonMetric[];
  winsA: number;
  winsB: number;
  ties: number;
  winner: 'A' | 'B' | 'tie';
}

export function useCompareDistricts(
  districtA: DistrictStats | null,
  districtB: DistrictStats | null
): DistrictComparisonResult | null {
  return useMemo(() => {
    if (!districtA || !districtB) return null;

    const metricsConfig: {
      label: string;
      getA: () => number | null;
      getB: () => number | null;
      higherIsBetter: boolean;
    }[] = [
      {
        label: 'Pontuacao Media',
        getA: () => districtA.avg_work_score,
        getB: () => districtB.avg_work_score,
        higherIsBetter: true,
      },
      {
        label: 'Assiduidade Media',
        getA: () => districtA.avg_attendance_rate,
        getB: () => districtB.avg_attendance_rate,
        higherIsBetter: true,
      },
      {
        label: 'Deputados Ativos',
        getA: () => districtA.active_deputies,
        getB: () => districtB.active_deputies,
        higherIsBetter: true,
      },
    ];

    const metrics: DistrictComparisonMetric[] = metricsConfig.map((m) => {
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
      districtA,
      districtB,
      metrics,
      winsA,
      winsB,
      ties,
      winner,
    };
  }, [districtA, districtB]);
}

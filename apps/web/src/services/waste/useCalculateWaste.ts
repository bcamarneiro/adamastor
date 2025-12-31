import { useMemo } from 'react';
import { PARLIAMENT_BUDGET_SHARE } from './constants';

interface WasteCalculation {
  irsAmount: number;
  parliamentContribution: number;
  wasteAmount: number;
}

export function useCalculateWaste(
  irsAmount: number | null,
  lowWorkersPercentage: number
): WasteCalculation | null {
  return useMemo(() => {
    if (!irsAmount || irsAmount <= 0) return null;

    // How much of your IRS goes to parliament
    const parliamentContribution = irsAmount * PARLIAMENT_BUDGET_SHARE;

    // How much of that goes to low-performing deputies
    const wasteAmount = parliamentContribution * (lowWorkersPercentage / 100);

    return {
      irsAmount,
      parliamentContribution,
      wasteAmount,
    };
  }, [irsAmount, lowWorkersPercentage]);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

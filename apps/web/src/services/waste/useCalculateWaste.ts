import { useMemo } from 'react';
import { PARLIAMENT_BUDGET_SHARE } from './useWasteStats';

interface WasteCalculation {
  irsAmount: number;
  parliamentContribution: number;
  wasteAmount: number;
  conversions: WasteConversion[];
}

interface WasteConversion {
  id: string;
  icon: string;
  label: string;
  quantity: number;
  unit: string;
}

// Relatable item costs in euros
const CONVERSIONS = {
  bigMac: { price: 5.5, icon: '🍔', label: 'Big Macs', unit: '' },
  coffee: { price: 1.2, icon: '☕', label: 'cafes', unit: '' },
  fuel: { price: 1.8, icon: '⛽', label: 'litros de combustivel', unit: 'L' },
  netflix: { price: 12.99, icon: '📺', label: 'meses de Netflix', unit: 'meses' },
  spotify: { price: 10.99, icon: '🎵', label: 'meses de Spotify', unit: 'meses' },
  superBock: { price: 1.5, icon: '🍺', label: 'imperiais', unit: '' },
  pastelNata: { price: 1.3, icon: '🥧', label: 'pasteis de nata', unit: '' },
  mealDeal: { price: 6.5, icon: '🍽️', label: 'almocos', unit: '' },
};

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

    // Calculate conversions
    const conversions: WasteConversion[] = Object.entries(CONVERSIONS)
      .map(([id, item]) => ({
        id,
        icon: item.icon,
        label: item.label,
        quantity: Math.floor(wasteAmount / item.price),
        unit: item.unit,
      }))
      .filter((c) => c.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6); // Top 6 most impactful

    return {
      irsAmount,
      parliamentContribution,
      wasteAmount,
      conversions,
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

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-PT').format(value);
}

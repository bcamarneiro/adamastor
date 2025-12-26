import { formatNumber } from '../../services/waste/useCalculateWaste';

interface ConversionCardProps {
  icon: string;
  quantity: number;
  label: string;
}

export function ConversionCard({ icon, quantity, label }: ConversionCardProps) {
  return (
    <div className="bg-neutral-1 rounded-xl p-4 shadow-sm border border-neutral-5 text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-neutral-12">{formatNumber(quantity)}</div>
      <div className="text-sm text-neutral-11 mt-1">{label}</div>
    </div>
  );
}

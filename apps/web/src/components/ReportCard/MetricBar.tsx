import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface MetricBarProps {
  label: string;
  value: number;
  average: number;
  maxValue?: number;
  isPercentage?: boolean;
}

export function MetricBar({ label, value, average, isPercentage = false }: MetricBarProps) {
  const formatValue = (v: number) => (isPercentage ? `${v.toFixed(1)}%` : Math.round(v).toString());

  const diff = average > 0 ? ((value - average) / average) * 100 : 0;
  const isAboveAverage = value > average;
  const isEqual = value === average;

  return (
    <div className="p-4 bg-neutral-2 rounded-lg border border-neutral-4">
      <div className="text-sm text-neutral-11 mb-1">{label}</div>
      <div className="text-3xl font-bold text-neutral-12">{formatValue(value)}</div>
      <div className="flex items-center gap-2 mt-1">
        {isEqual ? (
          <Minus className="w-4 h-4 text-neutral-9" />
        ) : isAboveAverage ? (
          <TrendingUp className="w-4 h-4 text-success-9" />
        ) : (
          <TrendingDown className="w-4 h-4 text-danger-9" />
        )}
        <span
          className={`text-sm font-medium ${
            isEqual ? 'text-neutral-9' : isAboveAverage ? 'text-success-9' : 'text-danger-9'
          }`}
        >
          {isEqual
            ? 'Na media'
            : `${Math.abs(diff).toFixed(0)}% ${isAboveAverage ? 'acima' : 'abaixo'}`}
        </span>
        <span className="text-sm text-neutral-9">da media ({formatValue(average)})</span>
      </div>
    </div>
  );
}

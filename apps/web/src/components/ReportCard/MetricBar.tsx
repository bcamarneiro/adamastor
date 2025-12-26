interface MetricBarProps {
  label: string;
  value: number;
  average: number;
  maxValue?: number;
  isPercentage?: boolean;
}

export function MetricBar({
  label,
  value,
  average,
  maxValue,
  isPercentage = false,
}: MetricBarProps) {
  // For percentages, max is always 100
  const effectiveMax = isPercentage ? 100 : maxValue || Math.max(value, average) * 1.5 || 1;
  const valuePercent = Math.min((value / effectiveMax) * 100, 100);
  const averagePercent = Math.min((average / effectiveMax) * 100, 100);

  const isAboveAverage = value >= average;
  const barColor = isAboveAverage ? 'bg-accent-9' : 'bg-neutral-8';

  const formatValue = (v: number) => (isPercentage ? `${v.toFixed(1)}%` : v.toString());

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-neutral-11">{label}</span>
        <span className={`font-semibold ${isAboveAverage ? 'text-accent-11' : 'text-neutral-11'}`}>
          {formatValue(value)}
        </span>
      </div>
      <div className="relative h-4 bg-neutral-4 rounded-full overflow-hidden">
        {/* Value bar */}
        <div
          className={`absolute top-0 left-0 h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${valuePercent}%` }}
        />
        {/* Average marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-neutral-12"
          style={{ left: `${averagePercent}%` }}
          title={`Media: ${formatValue(average)}`}
        />
      </div>
      <div className="flex justify-between text-xs text-neutral-9">
        <span>{isPercentage ? '0%' : '0'}</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-0.5 bg-neutral-12 inline-block" />
          Media: {formatValue(average)}
        </span>
      </div>
    </div>
  );
}

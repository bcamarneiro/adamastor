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
  // Scale: 0 to max, where max = provided maxValue, or 2x average (so average is at 50%), minimum 1
  const effectiveMax = isPercentage ? 100 : maxValue || Math.max(average * 2, 1);
  const valuePercent = Math.min((value / effectiveMax) * 100, 100);
  const averagePercent = Math.min((average / effectiveMax) * 100, 100);

  const isAboveAverage = value >= average;

  const formatValue = (v: number) => (isPercentage ? `${v.toFixed(1)}%` : Math.round(v).toString());

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-neutral-11">{label}</span>
        </div>
      )}
      <div className="relative">
        {/* Value label - top right */}
        <div className="flex justify-end mb-1">
          <span
            className={`text-sm font-semibold ${isAboveAverage ? 'text-accent-11' : 'text-neutral-11'}`}
          >
            {formatValue(value)}
          </span>
        </div>
        {/* Bar container */}
        <div className="relative h-4 bg-neutral-4 rounded-full overflow-hidden">
          {/* Value bar */}
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
              isAboveAverage ? 'bg-accent-9' : 'bg-accent-7'
            }`}
            style={{ width: `${valuePercent}%` }}
          />
          {/* Average marker line */}
          {average > 0 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-neutral-12 z-10"
              style={{ left: `${averagePercent}%` }}
              title={`Media nacional: ${formatValue(average)}`}
            />
          )}
        </div>
        {/* Scale labels */}
        <div className="flex justify-between text-xs text-neutral-9 mt-1">
          <span>0</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-neutral-12 inline-block" />
            {formatValue(average)}
          </span>
          <span>{formatValue(effectiveMax)}</span>
        </div>
      </div>
    </div>
  );
}

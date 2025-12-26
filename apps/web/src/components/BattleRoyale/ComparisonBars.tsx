interface ComparisonMetric {
  label: string;
  valueA: number;
  valueB: number;
  winnerA: boolean;
  winnerB: boolean;
  tie: boolean;
}

interface ComparisonBarsProps {
  metrics: ComparisonMetric[];
  nameA: string;
  nameB: string;
}

export function ComparisonBars({ metrics, nameA, nameB }: ComparisonBarsProps) {
  return (
    <div className="space-y-4">
      {metrics.map((metric) => {
        const maxValue = Math.max(metric.valueA, metric.valueB, 1);
        const percentA = (metric.valueA / maxValue) * 100;
        const percentB = (metric.valueB / maxValue) * 100;

        return (
          <div key={metric.label} className="space-y-2">
            <div className="text-sm font-medium text-neutral-12 text-center">{metric.label}</div>

            <div className="flex items-center gap-2">
              {/* Left side (Deputy A) */}
              <div className="flex-1 flex items-center gap-2">
                <div
                  className={`text-sm font-bold ${
                    metric.winnerA ? 'text-success-9' : 'text-neutral-9'
                  }`}
                >
                  {metric.label === 'Ranking Nacional' ? `#${metric.valueA}` : metric.valueA}
                </div>
                <div className="flex-1 h-6 bg-neutral-4 rounded-full overflow-hidden flex justify-end">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.winnerA ? 'bg-success-9' : metric.tie ? 'bg-warning-9' : 'bg-neutral-7'
                    }`}
                    style={{ width: `${percentA}%` }}
                  />
                </div>
              </div>

              {/* VS divider */}
              <div className="w-8 text-center text-xs font-bold text-neutral-9">VS</div>

              {/* Right side (Deputy B) */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-6 bg-neutral-4 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.winnerB ? 'bg-success-9' : metric.tie ? 'bg-warning-9' : 'bg-neutral-7'
                    }`}
                    style={{ width: `${percentB}%` }}
                  />
                </div>
                <div
                  className={`text-sm font-bold ${
                    metric.winnerB ? 'text-success-9' : 'text-neutral-9'
                  }`}
                >
                  {metric.label === 'Ranking Nacional' ? `#${metric.valueB}` : metric.valueB}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex justify-between text-xs text-neutral-9 pt-2">
        <span>{nameA}</span>
        <span>{nameB}</span>
      </div>
    </div>
  );
}

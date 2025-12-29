import type { DistrictComparisonMetric } from '@/services/districts/useCompareDistricts';
import { Trophy } from 'lucide-react';

interface DistrictComparisonBarsProps {
  metrics: DistrictComparisonMetric[];
  nameA: string;
  nameB: string;
}

export function DistrictComparisonBars({ metrics, nameA, nameB }: DistrictComparisonBarsProps) {
  return (
    <div className="space-y-4">
      {metrics.map((metric) => {
        const max = Math.max(metric.valueA, metric.valueB, 1);
        const widthA = (metric.valueA / max) * 100;
        const widthB = (metric.valueB / max) * 100;

        return (
          <div key={metric.label} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-11">{metric.label}</span>
              {metric.tie && (
                <span className="text-xs px-2 py-0.5 bg-neutral-3 rounded-full text-neutral-10">
                  Empate
                </span>
              )}
            </div>

            {/* District A Bar */}
            <div className="flex items-center gap-2">
              <div className="w-20 text-right">
                <span className="text-sm font-medium text-neutral-12 truncate">{nameA}</span>
              </div>
              <div className="flex-1 h-6 bg-neutral-2 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-accent-9"
                  style={{ width: `${widthA}%` }}
                />
                {metric.winnerA && (
                  <Trophy className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warning-9" />
                )}
              </div>
              <div className="w-16 text-right">
                <span className="text-sm font-semibold text-neutral-12">
                  {metric.valueA.toFixed(metric.label.includes('Media') ? 1 : 0)}
                  {metric.label.includes('Assiduidade') ? '%' : ''}
                </span>
              </div>
            </div>

            {/* District B Bar */}
            <div className="flex items-center gap-2">
              <div className="w-20 text-right">
                <span className="text-sm font-medium text-neutral-12 truncate">{nameB}</span>
              </div>
              <div className="flex-1 h-6 bg-neutral-2 rounded-full overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-success-9"
                  style={{ width: `${widthB}%` }}
                />
                {metric.winnerB && (
                  <Trophy className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warning-9" />
                )}
              </div>
              <div className="w-16 text-right">
                <span className="text-sm font-semibold text-neutral-12">
                  {metric.valueB.toFixed(metric.label.includes('Media') ? 1 : 0)}
                  {metric.label.includes('Assiduidade') ? '%' : ''}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

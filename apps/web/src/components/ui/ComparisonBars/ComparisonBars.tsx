import type { ComparisonMetric } from '@/types/comparison';
import { Trophy } from 'lucide-react';

/**
 * Determines if a color value is a CSS color (hex, rgb, etc.) or a Tailwind class.
 * CSS colors typically start with #, rgb, hsl, or are named colors.
 */
function isCssColor(color: string): boolean {
  return (
    color.startsWith('#') ||
    color.startsWith('rgb') ||
    color.startsWith('hsl') ||
    /^[a-z]+$/i.test(color) // Named colors like 'red', 'blue'
  );
}

/**
 * Default value formatter - formats numbers with 1 decimal place for "Media" labels.
 */
function defaultFormatValue(value: number, label: string): string {
  const decimals = label.includes('Media') ? 1 : 0;
  return value.toFixed(decimals);
}

export interface ComparisonBarsProps {
  /** Array of metrics to compare */
  metrics: ComparisonMetric[];
  /** Display name for entity A */
  nameA: string;
  /** Display name for entity B */
  nameB: string;
  /** Color for entity A - can be a CSS color (hex, rgb) or Tailwind class (default: 'bg-accent-9') */
  colorA?: string | null;
  /** Color for entity B - can be a CSS color (hex, rgb) or Tailwind class (default: 'bg-success-9') */
  colorB?: string | null;
  /** Tailwind width class for the name column (default: 'w-20') */
  nameColumnWidth?: string;
  /** Custom value formatter function */
  formatValue?: (value: number, label: string) => string;
}

export function ComparisonBars({
  metrics,
  nameA,
  nameB,
  colorA,
  colorB,
  nameColumnWidth = 'w-20',
  formatValue = defaultFormatValue,
}: ComparisonBarsProps) {
  // Determine if colors are CSS colors (use inline style) or Tailwind classes
  const colorAIsCss = colorA && isCssColor(colorA);
  const colorBIsCss = colorB && isCssColor(colorB);

  // Default Tailwind classes when no color is provided
  const colorAClass = colorAIsCss ? '' : (colorA || 'bg-accent-9');
  const colorBClass = colorBIsCss ? '' : (colorB || 'bg-success-9');

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

            {/* Entity A Bar */}
            <div className="flex items-center gap-2">
              <div className={`${nameColumnWidth} text-right`}>
                <span className="text-sm font-medium text-neutral-12 truncate">{nameA}</span>
              </div>
              <div className="flex-1 h-6 bg-neutral-2 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorAClass}`}
                  style={{
                    width: `${widthA}%`,
                    ...(colorAIsCss ? { backgroundColor: colorA } : {}),
                  }}
                />
                {metric.winnerA && (
                  <Trophy className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warning-9" />
                )}
              </div>
              <div className="w-16 text-right">
                <span className="text-sm font-semibold text-neutral-12">
                  {formatValue(metric.valueA, metric.label)}
                </span>
              </div>
            </div>

            {/* Entity B Bar */}
            <div className="flex items-center gap-2">
              <div className={`${nameColumnWidth} text-right`}>
                <span className="text-sm font-medium text-neutral-12 truncate">{nameB}</span>
              </div>
              <div className="flex-1 h-6 bg-neutral-2 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colorBClass}`}
                  style={{
                    width: `${widthB}%`,
                    ...(colorBIsCss ? { backgroundColor: colorB } : {}),
                  }}
                />
                {metric.winnerB && (
                  <Trophy className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-warning-9" />
                )}
              </div>
              <div className="w-16 text-right">
                <span className="text-sm font-semibold text-neutral-12">
                  {formatValue(metric.valueB, metric.label)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

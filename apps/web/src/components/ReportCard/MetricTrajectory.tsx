import { TrendingDown, TrendingUp } from 'lucide-react';

export interface MonthlyDataPoint {
  month: string;
  value: number;
}

interface MetricTrajectoryProps {
  label: string;
  data: MonthlyDataPoint[];
  isPercentage?: boolean;
  color?: 'accent' | 'success' | 'warning' | 'danger';
}

const CHART_WIDTH = 240;
const CHART_HEIGHT = 80;
const PAD = 4;

function linePath(data: MonthlyDataPoint[], xScale: number, yScale: number, min: number): string {
  return data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${i * xScale + PAD},${min - (d.value - min) * yScale + PAD}`)
    .join(' ');
}

function formatValue(v: number, isPct: boolean): string {
  return isPct ? `${v.toFixed(0)}%` : String(Math.round(v));
}

export function MetricTrajectory({
  label,
  data,
  isPercentage = false,
  color = 'accent',
}: MetricTrajectoryProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xScale = (CHART_WIDTH - PAD * 2) / (data.length - 1);
  const yScale = (CHART_HEIGHT - PAD * 2) / range;

  const first = data[0].value;
  const last = data[data.length - 1].value;
  const trend = last > first ? 'up' : last < first ? 'down' : 'flat';

  const strokeMap = {
    accent: 'stroke-accent-9',
    success: 'stroke-success-9',
    warning: 'stroke-warning-9',
    danger: 'stroke-danger-9',
  };
  const fillMap = {
    accent: 'fill-accent-9',
    success: 'fill-success-9',
    warning: 'fill-warning-9',
    danger: 'fill-danger-9',
  };

  return (
    <div className="p-4 bg-neutral-2 rounded-lg border border-neutral-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-neutral-11">{label}</span>
        <span className="flex items-center gap-1 text-xs text-neutral-9">
          {trend === 'up' ? (
            <TrendingUp className="w-3.5 h-3.5 text-success-9" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-3.5 h-3.5 text-danger-9" />
          ) : null}
          {formatValue(last, isPercentage)}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`${label}: ${data.map((d) => `${d.month} ${d.value}`).join(', ')}`}
      >
        {/* Grid lines */}
        <line
          x1={PAD}
          y1={PAD}
          x2={CHART_WIDTH - PAD}
          y2={PAD}
          className="stroke-neutral-4"
          strokeWidth={1}
        />
        <line
          x1={PAD}
          y1={CHART_HEIGHT - PAD}
          x2={CHART_WIDTH - PAD}
          y2={CHART_HEIGHT - PAD}
          className="stroke-neutral-4"
          strokeWidth={1}
        />

        {/* Line */}
        {data.length > 1 && (
          <path
            d={linePath(data, xScale, yScale, min)}
            className={`${strokeMap[color]} fill-none`}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={d.month}
            cx={i * xScale + PAD}
            cy={min - (d.value - min) * yScale + PAD}
            r={3}
            className={`${fillMap[color]} stroke-neutral-1`}
            strokeWidth={1.5}
          >
            <title>{`${d.month}: ${formatValue(d.value, isPercentage)}`}</title>
          </circle>
        ))}

        {/* Month labels */}
        {data.map((d, i) => {
          if (i % 2 !== 0 && data.length > 4) return null;
          return (
            <text
              key={`label-${d.month}`}
              x={i * xScale + PAD}
              y={CHART_HEIGHT - 1}
              textAnchor="middle"
              className="fill-neutral-9 text-[8px]"
            >
              {d.month}
            </text>
          );
        })}
      </svg>

      {/* Mini legend: first and last values */}
      <div className="flex justify-between mt-1 text-[10px] text-neutral-9">
        <span>{data[0].month} {formatValue(data[0].value, isPercentage)}</span>
        <span>{data[data.length - 1].month} {formatValue(data[data.length - 1].value, isPercentage)}</span>
      </div>
    </div>
  );
}

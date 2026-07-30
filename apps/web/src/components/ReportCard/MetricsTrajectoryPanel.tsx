import { TrendingUp } from 'lucide-react';
import { type MonthlyDataPoint, MetricTrajectory } from './MetricTrajectory';

export interface TrajectoryMetric {
  label: string;
  data: MonthlyDataPoint[];
  isPercentage?: boolean;
  color?: 'accent' | 'success' | 'warning' | 'danger';
}

interface MetricsTrajectoryPanelProps {
  title?: string;
  metrics: TrajectoryMetric[];
}

export function MetricsTrajectoryPanel({
  title = 'Evolução Mensal',
  metrics,
}: MetricsTrajectoryPanelProps) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-neutral-11" />
        <h2 className="text-lg font-semibold text-neutral-11">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <MetricTrajectory
            key={metric.label}
            label={metric.label}
            data={metric.data}
            isPercentage={metric.isPercentage}
            color={metric.color}
          />
        ))}
      </div>
      {metrics.length === 0 && (
        <p className="text-sm text-neutral-7 italic">
          Dados mensais ainda não disponíveis.
        </p>
      )}
    </section>
  );
}

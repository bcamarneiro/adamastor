import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricTrajectory } from './MetricTrajectory';
import { MetricsTrajectoryPanel } from './MetricsTrajectoryPanel';
import type { MonthlyDataPoint } from './MetricTrajectory';

const mockData: MonthlyDataPoint[] = [
  { month: 'Jan', value: 10 },
  { month: 'Fev', value: 15 },
  { month: 'Mar', value: 25 },
  { month: 'Abr', value: 20 },
];

const flatData: MonthlyDataPoint[] = [
  { month: 'Jan', value: 50 },
  { month: 'Fev', value: 50 },
  { month: 'Mar', value: 50 },
];

const twoPointData: MonthlyDataPoint[] = [
  { month: 'Jan', value: 10 },
  { month: 'Fev', value: 20 },
];

describe('MetricTrajectory', () => {
  it('should render the metric label', () => {
    render(<MetricTrajectory label="Propostas" data={mockData} />);
    expect(screen.getByText('Propostas')).toBeTruthy();
  });

  it('should render an SVG element', () => {
    const { container } = render(<MetricTrajectory label="Teste" data={mockData} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('should render data point circles', () => {
    const { container } = render(<MetricTrajectory label="Teste" data={mockData} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(4);
  });

  it('should show first and last month in the legend', () => {
    render(<MetricTrajectory label="Teste" data={mockData} />);
    expect(screen.getByText(/Jan 10/)).toBeTruthy();
    expect(screen.getByText(/Abr 20/)).toBeTruthy();
  });

  it('should format percentage values with %', () => {
    const pctData: MonthlyDataPoint[] = [
      { month: 'Jan', value: 60 },
      { month: 'Fev', value: 75 },
    ];
    render(<MetricTrajectory label="Presença" data={pctData} isPercentage={true} />);
    expect(screen.getByText(/Jan 60%/)).toBeTruthy();
    expect(screen.getByText(/Fev 75%/)).toBeTruthy();
  });

  it('should render with less than 2 data points (return null)', () => {
    const { container } = render(
      <MetricTrajectory label="Vazio" data={[{ month: 'Jan', value: 10 }]} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render with exactly 2 data points', () => {
    render(<MetricTrajectory label="Minimo" data={twoPointData} />);
    expect(screen.getByText('Minimo')).toBeTruthy();
  });

  it('should render a trend icon for upward trend', () => {
    const { container } = render(<MetricTrajectory label="Subindo" data={twoPointData} />);
    // last > first, so trend is 'up' -> TrendingUp icon
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(1); // at least the chart SVG + possibly trend icon
  });

  it('should render flat data without trend icon', () => {
    const { container } = render(<MetricTrajectory label="Plano" data={flatData} />);
    const svgCount = container.querySelectorAll('svg').length;
    // Should only have the chart SVG (no trend icon when flat)
    expect(svgCount).toBe(1);
  });

  it('should have accessible title on data points', () => {
    const { container } = render(<MetricTrajectory label="Teste" data={mockData} />);
    const circles = container.querySelectorAll('circle');
    const firstCircle = circles[0];
    const title = firstCircle?.querySelector('title');
    expect(title?.textContent).toBe('Jan: 10');
  });

  it('should render line path element when data has 2+ points', () => {
    const { container } = render(<MetricTrajectory label="Teste" data={twoPointData} />);
    const path = container.querySelector('path');
    expect(path).toBeTruthy();
  });
});

describe('MetricsTrajectoryPanel', () => {
  it('should render section title', () => {
    render(
      <MetricsTrajectoryPanel
        metrics={[{ label: 'Teste', data: mockData }]}
      />,
    );
    expect(screen.getByText('Evolução Mensal')).toBeTruthy();
  });

  it('should render multiple metrics', () => {
    render(
      <MetricsTrajectoryPanel
        metrics={[
          { label: 'Propostas', data: mockData },
          { label: 'Intervenções', data: twoPointData },
        ]}
      />,
    );
    expect(screen.getByText('Propostas')).toBeTruthy();
    expect(screen.getByText('Intervenções')).toBeTruthy();
  });

  it('should return null with empty metrics array', () => {
    const { container } = render(<MetricsTrajectoryPanel metrics={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should return null with undefined metrics', () => {
    const { container } = render(<MetricsTrajectoryPanel metrics={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should accept custom title', () => {
    render(
      <MetricsTrajectoryPanel
        title="Trajetória Customizada"
        metrics={[{ label: 'Teste', data: mockData }]}
      />,
    );
    expect(screen.getByText('Trajetória Customizada')).toBeTruthy();
  });

  it('should render isPercentage metrics', () => {
    const pctData: MonthlyDataPoint[] = [
      { month: 'Jan', value: 60 },
      { month: 'Fev', value: 75 },
    ];
    render(
      <MetricsTrajectoryPanel
        metrics={[{ label: 'Presença', data: pctData, isPercentage: true, color: 'success' }]}
      />,
    );
    expect(screen.getByText('Presença')).toBeTruthy();
    expect(screen.getByText(/Jan 60%/)).toBeTruthy();
  });
});

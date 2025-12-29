import { describe, expect, it } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { GradeCircle } from './GradeCircle';

describe('GradeCircle', () => {
  it('should render the grade letter', () => {
    render(<GradeCircle grade="A" score={95} />);
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('should render the score with pts suffix', () => {
    render(<GradeCircle grade="B" score={75.5} />);
    // Score is formatted with toFixed(0)
    expect(screen.getByText('76 pts')).toBeTruthy();
  });

  it('should apply success colors for grade A', () => {
    const { container } = render(<GradeCircle grade="A" score={90} />);
    const circle = container.querySelector('.rounded-full');
    expect(circle?.className).toContain('bg-success-3');
    expect(circle?.className).toContain('border-success-8');
  });

  it('should apply success colors for grade B', () => {
    const { container } = render(<GradeCircle grade="B" score={75} />);
    const circle = container.querySelector('.rounded-full');
    expect(circle?.className).toContain('bg-success-2');
  });

  it('should apply warning colors for grade C', () => {
    const { container } = render(<GradeCircle grade="C" score={55} />);
    const circle = container.querySelector('.rounded-full');
    expect(circle?.className).toContain('bg-warning-3');
  });

  it('should apply warning colors for grade D', () => {
    const { container } = render(<GradeCircle grade="D" score={35} />);
    const circle = container.querySelector('.rounded-full');
    expect(circle?.className).toContain('bg-warning-4');
  });

  it('should apply danger colors for grade F', () => {
    const { container } = render(<GradeCircle grade="F" score={15} />);
    const circle = container.querySelector('.rounded-full');
    expect(circle?.className).toContain('bg-danger-3');
  });

  it('should fall back to grade F colors for unknown grade', () => {
    const { container } = render(<GradeCircle grade="X" score={0} />);
    const circle = container.querySelector('.rounded-full');
    expect(circle?.className).toContain('bg-danger-3');
  });

  describe('sizes', () => {
    it('should render with small size', () => {
      const { container } = render(<GradeCircle grade="A" score={90} size="sm" />);
      const circle = container.querySelector('.rounded-full');
      expect(circle?.className).toContain('w-12');
      expect(circle?.className).toContain('h-12');
    });

    it('should render with medium size (default)', () => {
      const { container } = render(<GradeCircle grade="A" score={90} />);
      const circle = container.querySelector('.rounded-full');
      expect(circle?.className).toContain('w-20');
      expect(circle?.className).toContain('h-20');
    });

    it('should render with large size', () => {
      const { container } = render(<GradeCircle grade="A" score={90} size="lg" />);
      const circle = container.querySelector('.rounded-full');
      expect(circle?.className).toContain('w-32');
      expect(circle?.className).toContain('h-32');
    });
  });

  it('should display integer score (rounds down)', () => {
    render(<GradeCircle grade="A" score={89.4} />);
    expect(screen.getByText('89 pts')).toBeTruthy();
  });

  it('should display integer score (rounds up)', () => {
    render(<GradeCircle grade="A" score={89.6} />);
    expect(screen.getByText('90 pts')).toBeTruthy();
  });
});

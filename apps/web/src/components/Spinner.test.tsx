import { describe, expect, it } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('should render with default medium size', () => {
    render(<Spinner />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner).toBeTruthy();
    expect(spinner.className).toContain('w-6');
    expect(spinner.className).toContain('h-6');
  });

  it('should render with small size', () => {
    render(<Spinner size="sm" />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner.className).toContain('w-4');
    expect(spinner.className).toContain('h-4');
  });

  it('should render with large size', () => {
    render(<Spinner size="lg" />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner.className).toContain('w-8');
    expect(spinner.className).toContain('h-8');
  });

  it('should have accessible loading text for screen readers', () => {
    render(<Spinner />);

    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toBeTruthy();
    expect(loadingText.className).toContain('sr-only');
  });

  it('should apply custom className', () => {
    render(<Spinner className="custom-class" />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner.className).toContain('custom-class');
  });

  it('should have animation class for spinning', () => {
    render(<Spinner />);

    const spinner = screen.getByLabelText('Loading');
    expect(spinner.className).toContain('animate-spin');
  });
});

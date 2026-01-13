import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoadingScreen from './LoadingScreen';

// Mock the useGlobalLoading hook
let mockIsLoading = true;
vi.mock('../../hooks/useGlobalLoading', () => ({
  useGlobalLoading: () => ({ isLoading: mockIsLoading }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      className,
      role,
      'aria-live': ariaLive,
      'aria-label': ariaLabel,
    }: {
      children: React.ReactNode;
      className?: string;
      role?: string;
      'aria-live'?: 'polite' | 'off' | 'assertive';
      'aria-label'?: string;
    }) => (
      <div className={className} role={role} aria-live={ariaLive} aria-label={ariaLabel}>
        {children}
      </div>
    ),
    span: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <span className={className}>{children}</span>,
  },
}));

describe('LoadingScreen', () => {
  beforeEach(() => {
    mockIsLoading = true;
  });

  it('should render when loading is true', () => {
    mockIsLoading = true;
    render(<LoadingScreen />);

    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer).toBeTruthy();
  });

  it('should not render when loading is false', () => {
    mockIsLoading = false;
    render(<LoadingScreen />);

    const loadingContainer = screen.queryByRole('status');
    expect(loadingContainer).toBeNull();
  });

  it('should have accessible role="status"', () => {
    render(<LoadingScreen />);

    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer).toBeTruthy();
  });

  it('should have aria-label for screen readers', () => {
    render(<LoadingScreen />);

    const loadingContainer = screen.getByLabelText('Loading content');
    expect(loadingContainer).toBeTruthy();
  });

  it('should have aria-live="polite" for assistive technologies', () => {
    render(<LoadingScreen />);

    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer.getAttribute('aria-live')).toBe('polite');
  });

  it('should have accessible loading text for screen readers', () => {
    render(<LoadingScreen />);

    const loadingText = screen.getByText('Loading...');
    expect(loadingText).toBeTruthy();
    expect(loadingText.className).toContain('sr-only');
  });

  it('should display Portuguese loading text', () => {
    render(<LoadingScreen />);

    const loadingText = screen.getByText('A carregar...');
    expect(loadingText).toBeTruthy();
  });

  it('should have proper styling for overlay', () => {
    render(<LoadingScreen />);

    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer.className).toContain('fixed');
    expect(loadingContainer.className).toContain('inset-0');
    expect(loadingContainer.className).toContain('z-50');
  });

  it('should apply flex centering classes', () => {
    render(<LoadingScreen />);

    const loadingContainer = screen.getByRole('status');
    expect(loadingContainer.className).toContain('flex');
    expect(loadingContainer.className).toContain('items-center');
    expect(loadingContainer.className).toContain('justify-center');
  });
});

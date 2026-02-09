import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
    nav: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <nav {...props}>{children}</nav>
    ),
    h1: ({ children, ...props }: React.PropsWithChildren<object>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.PropsWithChildren<object>) => <p {...props}>{children}</p>,
  },
}));

import { PageHeader } from './PageHeader';

const renderPageHeader = (props: React.ComponentProps<typeof PageHeader>) => {
  return render(
    <MemoryRouter>
      <PageHeader {...props} />
    </MemoryRouter>
  );
};

describe('PageHeader', () => {
  it('should render title', () => {
    renderPageHeader({ title: 'Test Title' });
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    renderPageHeader({ title: 'Title', description: 'Test description' });
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should render breadcrumbs when provided', () => {
    renderPageHeader({
      title: 'Title',
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Current' }],
    });
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should render actions when provided', () => {
    renderPageHeader({
      title: 'Title',
      actions: <button type="button">Action</button>,
    });
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should apply dark variant styles', () => {
    const { container } = renderPageHeader({ title: 'Title', variant: 'dark' });
    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-neutral-12');
  });

  it('should apply default variant styles', () => {
    const { container } = renderPageHeader({ title: 'Title', variant: 'default' });
    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-neutral-1');
  });
});

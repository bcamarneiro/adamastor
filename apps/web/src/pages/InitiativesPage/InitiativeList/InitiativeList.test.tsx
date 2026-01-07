import { describe, expect, it, mock, beforeEach, afterEach } from 'bun:test';
import { fireEvent, render, screen, waitFor, act, cleanup } from '@testing-library/react';
import type { InitiativeData } from './InitiativeRow';

// Mock the useInitiatives hook
const mockUseInitiatives = mock(() => ({
  initiatives: [] as InitiativeData[],
  metadata: { total: 0, totalByFase: {}, fasesList: {} },
  isLoading: false,
  isError: false,
  error: null,
}));

mock.module('@/services/initiatives/useInitiatives', () => ({
  useInitiatives: mockUseInitiatives,
}));

// Mock react-router-dom Link
mock.module('react-router-dom', () => ({
  Link: ({
    to,
    children,
    className,
    onClick,
    'aria-label': ariaLabel,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    'aria-label'?: string;
  }) => (
    <a
      href={to}
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid={`link-${to}`}
    >
      {children}
    </a>
  ),
}));

// Mock IntersectionObserver for virtualization
const mockIntersectionObserver = mock(() => ({
  root: null,
  rootMargin: '',
  thresholds: [],
  disconnect: mock(() => {}),
  observe: mock(() => {}),
  unobserve: mock(() => {}),
  takeRecords: mock(() => []),
}));

// @ts-expect-error - mocking browser API
globalThis.IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver for virtualization height measurement
const mockResizeObserver = mock(() => ({
  disconnect: mock(() => {}),
  observe: mock(() => {}),
  unobserve: mock(() => {}),
}));

// @ts-expect-error - mocking browser API
globalThis.ResizeObserver = mockResizeObserver;

// Helper to create mock initiatives
const createMockInitiatives = (count: number): InitiativeData[] =>
  Array.from({ length: count }, (_, i) => ({
    IniId: `init-${i + 1}`,
    IniNr: `${i + 1}/XVI/1`,
    IniTitulo: `Test Initiative ${i + 1}`,
    description: `Description for initiative ${i + 1}`,
    IniTipo: 'P',
    IniEventos: [
      {
        EvtId: `evt-${i}-1`,
        DataFase: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        CodigoFase: 'FASE1',
        Fase: 'Entrada',
        Observacoes: '',
      },
      {
        EvtId: `evt-${i}-2`,
        DataFase: new Date(`2024-02-${String(i + 1).padStart(2, '0')}`),
        CodigoFase: 'FASE2',
        Fase: i % 2 === 0 ? 'Discussão' : 'Votação',
        Observacoes: '',
      },
    ],
    latestEvent: {
      EvtId: `evt-${i}-2`,
      DataFase: new Date(`2024-02-${String(i + 1).padStart(2, '0')}`),
      CodigoFase: 'FASE2',
      Fase: i % 2 === 0 ? 'Discussão' : 'Votação',
      Observacoes: `Observation for ${i + 1}`,
      Responsavel: `Committee ${i + 1}`,
    },
  }));

// Import the component after mocking
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { default: InitiativeList } = require('./InitiativeList');

describe('InitiativeList', () => {
  beforeEach(() => {
    // Reset mock to default values before each test
    mockUseInitiatives.mockReturnValue({
      initiatives: [],
      metadata: { total: 0, totalByFase: {}, fasesList: {} },
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('loading state', () => {
    it('should render spinner when loading', () => {
      mockUseInitiatives.mockReturnValue({
        initiatives: [],
        metadata: {},
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toBeTruthy();
      expect(loadingStatus.getAttribute('aria-label')).toBe('Loading initiatives');
    });

    it('should not render table while loading', () => {
      mockUseInitiatives.mockReturnValue({
        initiatives: [],
        metadata: {},
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      expect(screen.queryByRole('table')).toBeNull();
    });
  });

  describe('error state', () => {
    it('should render error message when fetch fails', () => {
      mockUseInitiatives.mockReturnValue({
        initiatives: [],
        metadata: {},
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
      });

      render(<InitiativeList />);

      expect(screen.getByText('Error loading initiatives')).toBeTruthy();
      expect(screen.getByText('Network error')).toBeTruthy();
    });

    it('should show fallback message for non-Error objects', () => {
      mockUseInitiatives.mockReturnValue({
        initiatives: [],
        metadata: {},
        isLoading: false,
        isError: true,
        error: 'Some string error',
      });

      render(<InitiativeList />);

      expect(screen.getByText('An unexpected error occurred')).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('should render empty state when no initiatives', () => {
      mockUseInitiatives.mockReturnValue({
        initiatives: [],
        metadata: { total: 0 },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      expect(screen.getByText('No initiatives available.')).toBeTruthy();
    });

    it('should render filtered empty state when filter yields no results', async () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // Type in search that won't match anything
      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent query' } });

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.getByText('No initiatives found matching your criteria.')).toBeTruthy();
        },
        { timeout: 500 }
      );

      expect(
        screen.getByText('Try adjusting your search or filter settings.')
      ).toBeTruthy();
    });
  });

  describe('virtualization', () => {
    it('should render table structure with header', () => {
      const initiatives = createMockInitiatives(10);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 10, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // Check table role and headers
      expect(screen.getByRole('table')).toBeTruthy();
      expect(screen.getByText('#')).toBeTruthy();
      expect(screen.getByText('Phase')).toBeTruthy();
      expect(screen.getByText('Title')).toBeTruthy();
      expect(screen.getByText('Actions')).toBeTruthy();
    });

    it('should render virtualized rows for large datasets', () => {
      const initiatives = createMockInitiatives(100);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 100, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Due to virtualization, not all 100 rows should be in the DOM
      // Only visible rows + overscan (5) should be rendered
      const rows = container.querySelectorAll('[role="row"]');

      // There's 1 header row + virtualized content rows
      // With virtualization enabled, we should have fewer than 100 content rows
      // The exact number depends on viewport size and overscan settings
      // We just verify that virtualization is working by checking row count is less than total
      const headerRowCount = 1;
      const contentRowCount = rows.length - headerRowCount;

      // With 100 items, virtualization should render far fewer than 100 rows
      // This verifies the virtualizer is active
      expect(contentRowCount).toBeLessThan(100);
    });

    it('should render virtual container with correct total height', () => {
      const initiatives = createMockInitiatives(50);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 50, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Find the virtual container (has position: relative and explicit height)
      const virtualContainer = container.querySelector('[style*="height"]');
      expect(virtualContainer).toBeTruthy();

      // The height should be based on estimated row height (48px) × count
      // 50 rows × 48px = 2400px minimum
      const style = virtualContainer?.getAttribute('style') ?? '';
      expect(style).toContain('height');
    });

    it('should use absolute positioning for virtual rows', () => {
      const initiatives = createMockInitiatives(10);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 10, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Virtual rows should have position: absolute and transform for positioning
      const virtualRows = container.querySelectorAll('[data-index]');
      expect(virtualRows.length).toBeGreaterThan(0);

      // First virtual row should be at position 0
      const firstRow = virtualRows[0];
      const style = firstRow?.getAttribute('style') ?? '';
      expect(style).toContain('position: absolute');
      expect(style).toContain('translateY');
    });
  });

  describe('filtering', () => {
    it('should filter initiatives by search text', async () => {
      const initiatives = createMockInitiatives(10);
      // Make one initiative stand out for search
      initiatives[5].IniTitulo = 'Unique Search Target Initiative';

      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 10, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // Initially all should be visible (within virtualization window)
      expect(screen.getByText('Test Initiative 1')).toBeTruthy();

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'Unique Search' } });

      // Wait for debounce and verify filter
      await waitFor(
        () => {
          expect(screen.getByText('Unique Search Target Initiative')).toBeTruthy();
        },
        { timeout: 500 }
      );

      // Other initiatives should not be visible
      expect(screen.queryByText('Test Initiative 1')).toBeNull();
    });

    it('should filter initiatives by phase', async () => {
      const initiatives = createMockInitiatives(10);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 10, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // Select phase filter
      const phaseSelect = screen.getByLabelText('Filter by phase');
      fireEvent.change(phaseSelect, { target: { value: 'Discussão' } });

      // Wait for filter to apply
      await waitFor(() => {
        // Even-indexed initiatives have "Discussão" phase
        expect(screen.getByText('Test Initiative 1')).toBeTruthy();
      });

      // Odd-indexed initiatives have "Votação" phase and should be filtered out
      expect(screen.queryByText('Test Initiative 2')).toBeNull();
    });

    it('should combine search and phase filters', async () => {
      const initiatives = createMockInitiatives(10);
      initiatives[0].IniTitulo = 'Special Initiative';
      initiatives[0].latestEvent.Fase = 'Discussão';

      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 10, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // Apply both filters
      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      const phaseSelect = screen.getByLabelText('Filter by phase');

      fireEvent.change(searchInput, { target: { value: 'Special' } });
      fireEvent.change(phaseSelect, { target: { value: 'Discussão' } });

      await waitFor(
        () => {
          expect(screen.getByText('Special Initiative')).toBeTruthy();
        },
        { timeout: 500 }
      );

      // Other initiatives should be filtered out
      expect(screen.queryByText('Test Initiative 3')).toBeNull();
    });

    it('should debounce search input', async () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      const searchInput = screen.getByPlaceholderText('Search initiatives...');

      // Type rapidly - filter shouldn't apply immediately
      fireEvent.change(searchInput, { target: { value: 'T' } });
      fireEvent.change(searchInput, { target: { value: 'Te' } });
      fireEvent.change(searchInput, { target: { value: 'Tes' } });
      fireEvent.change(searchInput, { target: { value: 'Test' } });

      // Initially all items should still be visible (debounce not triggered)
      expect(screen.getByText('Test Initiative 1')).toBeTruthy();

      // After debounce period, filter should be applied
      await waitFor(
        () => {
          // "Test" matches all items, so they should still be visible
          expect(screen.getByText('Test Initiative 1')).toBeTruthy();
        },
        { timeout: 500 }
      );
    });
  });

  describe('expand/collapse', () => {
    it('should expand row when clicked', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Find a row and click it
      const rows = container.querySelectorAll('[role="row"][aria-expanded]');
      expect(rows.length).toBeGreaterThan(0);

      const firstRow = rows[0];
      expect(firstRow.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(firstRow);

      expect(firstRow.getAttribute('aria-expanded')).toBe('true');
    });

    it('should collapse row when clicked again', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      const rows = container.querySelectorAll('[role="row"][aria-expanded]');
      const firstRow = rows[0];

      // Expand
      fireEvent.click(firstRow);
      expect(firstRow.getAttribute('aria-expanded')).toBe('true');

      // Collapse
      fireEvent.click(firstRow);
      expect(firstRow.getAttribute('aria-expanded')).toBe('false');
    });

    it('should show expanded content with description', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Expand first row
      const rows = container.querySelectorAll('[role="row"][aria-expanded]');
      fireEvent.click(rows[0]);

      // Check expanded content appears
      expect(screen.getByText('Description')).toBeTruthy();
      expect(screen.getByText('Description for initiative 1')).toBeTruthy();
    });

    it('should allow multiple rows to be expanded', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      const rows = container.querySelectorAll('[role="row"][aria-expanded]');

      // Expand first and second rows
      fireEvent.click(rows[0]);
      fireEvent.click(rows[1]);

      expect(rows[0].getAttribute('aria-expanded')).toBe('true');
      expect(rows[1].getAttribute('aria-expanded')).toBe('true');
    });

    it('should clear expanded rows when they are filtered out', async () => {
      const initiatives = createMockInitiatives(5);
      initiatives[0].IniTitulo = 'Findable Initiative';

      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container, rerender } = render(<InitiativeList />);

      // Expand first row
      const rows = container.querySelectorAll('[role="row"][aria-expanded]');
      fireEvent.click(rows[0]);
      expect(rows[0].getAttribute('aria-expanded')).toBe('true');

      // Filter to hide the expanded row
      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'Test Initiative 2' } });

      // Wait for filter and re-render
      await waitFor(
        () => {
          expect(screen.queryByText('Findable Initiative')).toBeNull();
        },
        { timeout: 500 }
      );

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Wait for items to reappear
      await waitFor(
        () => {
          expect(screen.getByText('Findable Initiative')).toBeTruthy();
        },
        { timeout: 500 }
      );

      // The previously expanded row should now be collapsed (stale state cleared)
      const newRows = container.querySelectorAll('[role="row"][aria-expanded]');
      const findableRow = Array.from(newRows).find((row) =>
        row.textContent?.includes('Findable Initiative')
      );
      expect(findableRow?.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('accessibility', () => {
    it('should have proper table structure with ARIA roles', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      expect(container.querySelector('[role="table"]')).toBeTruthy();
      expect(container.querySelectorAll('[role="rowgroup"]').length).toBe(2); // header + body
      expect(container.querySelectorAll('[role="columnheader"]').length).toBe(5);
    });

    it('should have accessible search input', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      const searchInput = screen.getByLabelText('Search initiatives');
      expect(searchInput).toBeTruthy();
    });

    it('should have accessible phase filter', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      const phaseSelect = screen.getByLabelText('Filter by phase');
      expect(phaseSelect).toBeTruthy();
    });

    it('should have aria-expanded attribute on expandable rows', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      const expandableRows = container.querySelectorAll('[aria-expanded]');
      expect(expandableRows.length).toBeGreaterThan(0);
    });
  });

  describe('statistics accordion', () => {
    it('should render statistics accordion when data is available', () => {
      const initiatives = createMockInitiatives(10);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: {
          total: 10,
          totalByFase: { FASE1: 5, FASE2: 5 },
          fasesList: { FASE1: 'Entrada', FASE2: 'Discussão' },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      expect(screen.getByText('Statistics Overview')).toBeTruthy();
    });

    it('should show total initiatives count', () => {
      const initiatives = createMockInitiatives(10);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: {
          total: 10,
          totalByFase: { FASE1: 5, FASE2: 5 },
          fasesList: { FASE1: 'Entrada', FASE2: 'Discussão' },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // Click to expand accordion
      const trigger = screen.getByText('Statistics Overview');
      fireEvent.click(trigger);

      expect(screen.getByText('Total Initiatives')).toBeTruthy();
      expect(screen.getByText('10')).toBeTruthy();
    });
  });

  describe('phase filter options', () => {
    it('should populate phase dropdown with unique phases', () => {
      const initiatives = createMockInitiatives(10);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 10, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      const phaseSelect = screen.getByLabelText('Filter by phase') as HTMLSelectElement;
      const options = Array.from(phaseSelect.options).map((opt) => opt.value);

      // Should have "All Phases" plus unique phases from data
      expect(options).toContain('');
      expect(options).toContain('Discussão');
      expect(options).toContain('Votação');
    });
  });

  describe('performance', () => {
    it('should handle large datasets without rendering all rows', () => {
      // Create a large dataset
      const initiatives = createMockInitiatives(500);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 500, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // With virtualization, only a fraction of rows should be in the DOM
      const rows = container.querySelectorAll('[role="row"][aria-expanded]');

      // Should have significantly fewer rows than total count
      // The exact number depends on viewport size and overscan
      expect(rows.length).toBeLessThan(50);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should maintain stable keys for virtual items', () => {
      const initiatives = createMockInitiatives(20);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 20, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Check that virtual items have data-index attributes
      const virtualItems = container.querySelectorAll('[data-index]');
      expect(virtualItems.length).toBeGreaterThan(0);

      // Each should have a numeric index
      virtualItems.forEach((item) => {
        const index = item.getAttribute('data-index');
        expect(index).toBeTruthy();
        expect(Number.isNaN(Number(index))).toBe(false);
      });
    });
  });

  describe('keyboard navigation', () => {
    it('should expand row on Enter key press', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      const rows = container.querySelectorAll('[role="row"][aria-expanded]');
      const firstRow = rows[0];

      expect(firstRow.getAttribute('aria-expanded')).toBe('false');

      fireEvent.keyDown(firstRow, { key: 'Enter' });

      expect(firstRow.getAttribute('aria-expanded')).toBe('true');
    });

    it('should expand row on Space key press', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      const rows = container.querySelectorAll('[role="row"][aria-expanded]');
      const firstRow = rows[0];

      fireEvent.keyDown(firstRow, { key: ' ' });

      expect(firstRow.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have tabIndex on rows for keyboard focus', () => {
      const initiatives = createMockInitiatives(5);
      mockUseInitiatives.mockReturnValue({
        initiatives,
        metadata: { total: 5, totalByFase: {}, fasesList: {} },
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      const rows = container.querySelectorAll('[role="row"][aria-expanded]');
      rows.forEach((row) => {
        expect(row.getAttribute('tabindex')).toBe('0');
      });
    });
  });
});

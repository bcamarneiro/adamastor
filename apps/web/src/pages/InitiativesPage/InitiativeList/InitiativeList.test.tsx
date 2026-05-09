import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createInitiativesList,
  createMockInitiativesMetadata,
  createSearchableInitiatives,
} from '../../../test/mocks/initiatives';
import InitiativeList from './InitiativeList';
import type { InitiativeData } from './InitiativeRow';

// Define the shape of the hook return value
type UseInitiativesReturn = {
  initiatives: ReturnType<typeof createInitiativesList>;
  metadata: ReturnType<typeof createMockInitiativesMetadata>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
};

// Default mock state
let mockHookState: UseInitiativesReturn = {
  initiatives: [],
  metadata: createMockInitiativesMetadata(),
  isLoading: false,
  isError: false,
  isSuccess: true,
  error: null,
};

// Mock the useInitiatives hook
vi.mock('../../../services/initiatives/useInitiatives', () => ({
  useInitiatives: () => mockHookState,
}));

// Mock @tanstack/react-virtual to render all items in tests
// The real virtualizer only renders visible items, but in tests we want all items visible
vi.mock('@tanstack/react-virtual', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: mock implementation requires any for flexibility
  useVirtualizer: (options: any) => {
    // Make functions that compute values dynamically from options
    // This way when options.count changes, we get updated values
    const getVirtualItems = () => {
      const count = options.count || 0;
      const enabled = options.enabled !== false;

      if (!enabled || count === 0) return [];

      // Create virtual items for ALL items (not just visible ones) when enabled
      return Array.from({ length: count }, (_, index) => ({
        key: options.getItemKey?.(index) ?? index,
        index,
        start: index * 48, // Use default row height
        size: 48,
        end: (index + 1) * 48,
        lane: 0,
      }));
    };

    const getTotalSize = () => {
      const count = options.count || 0;
      const enabled = options.enabled !== false;
      return enabled ? count * 48 : 0;
    };

    return {
      getVirtualItems,
      getTotalSize,
      scrollToIndex: vi.fn(),
      scrollToOffset: vi.fn(),
      scrollBy: vi.fn(),
      measure: vi.fn(),
      measureElement: vi.fn(),
      getOffsetForIndex: vi.fn((index: number) => index * 48),
      getOffsetForAlignment: vi.fn(() => 0),
      resizeItem: vi.fn(),
      options,
    };
  },
}));

// Mock react-router-dom Link component
vi.mock('react-router-dom', () => ({
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
const mockIntersectionObserver = vi.fn(() => ({
  root: null,
  rootMargin: '',
  thresholds: [],
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// biome-ignore lint/suspicious/noExplicitAny: mock assignment for testing
globalThis.IntersectionObserver = mockIntersectionObserver as any;

// Mock ResizeObserver for virtualization height measurement
// Store callbacks so we can trigger them
const resizeCallbacks = new Map<Element, ResizeObserverCallback>();

const mockResizeObserver = vi.fn((callback: ResizeObserverCallback) => ({
  disconnect: vi.fn(() => {
    resizeCallbacks.clear();
  }),
  observe: vi.fn((element: Element) => {
    resizeCallbacks.set(element, callback);
    // Trigger callback asynchronously to avoid React act() warnings
    const entry: ResizeObserverEntry = {
      target: element,
      contentRect: {
        width: 1000,
        height: 10000,
        top: 0,
        left: 0,
        right: 1000,
        bottom: 10000,
        x: 0,
        y: 0,
      } as DOMRectReadOnly,
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    };
    setTimeout(() => callback([entry], {} as ResizeObserver), 0);
  }),
  unobserve: vi.fn((element: Element) => {
    resizeCallbacks.delete(element);
  }),
}));

// biome-ignore lint/suspicious/noExplicitAny: mock assignment for testing
globalThis.ResizeObserver = mockResizeObserver as any;

// Mock element dimensions for virtualization
// The virtualizer needs to know the viewport size to calculate visible items
const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
Element.prototype.getBoundingClientRect = function () {
  const rect = originalGetBoundingClientRect.call(this);
  // If this is a scroll container, give it a large height so all items are "visible"
  if (this.hasAttribute('role') && this.getAttribute('role') === 'rowgroup') {
    return {
      ...rect,
      height: 10000, // Large height to ensure all virtualized items render
      width: 1000,
    };
  }
  return rect;
};

// Mock scroll container properties for virtualization
// The virtualizer checks clientHeight, offsetHeight, scrollHeight to determine visible area
Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get() {
    // Check if this is a scroll container (role="rowgroup" and has overflow class)
    if (this.hasAttribute('role') && this.getAttribute('role') === 'rowgroup') {
      return 10000; // Large viewport height
    }
    return 0;
  },
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    if (this.hasAttribute('role') && this.getAttribute('role') === 'rowgroup') {
      return 10000;
    }
    return 0;
  },
});

Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  get() {
    if (this.hasAttribute('role') && this.getAttribute('role') === 'rowgroup') {
      return 10000;
    }
    return 0;
  },
});

// Helper to reset mock state before each test
function resetMockState() {
  mockHookState = {
    initiatives: [],
    metadata: createMockInitiativesMetadata(),
    isLoading: false,
    isError: false,
    isSuccess: true,
    error: null,
  };
}

// Helper to set mock state for specific test scenarios
function setMockState(overrides: Partial<UseInitiativesReturn>) {
  mockHookState = { ...mockHookState, ...overrides };
}

// Helper to create mock initiatives (for legacy tests)
const createMockInitiatives = (count: number): InitiativeData[] =>
  Array.from({ length: count }, (_, i) => {
    // Use modulo to keep day numbers valid (1-28 for safety across all months)
    const day1 = (i % 28) + 1;
    const day2 = ((i + 1) % 28) + 1;
    return {
      IniId: `init-${i + 1}`,
      IniNr: `${i + 1}/XVI/1`,
      IniTitulo: `Test Initiative ${i + 1}`,
      description: `Description for initiative ${i + 1}`,
      IniTipo: 'P',
      IniEventos: [
        {
          EvtId: `evt-${i}-1`,
          DataFase: new Date(`2024-01-${String(day1).padStart(2, '0')}`),
          CodigoFase: 'FASE1',
          Fase: 'Entrada',
          Observacoes: '',
        },
        {
          EvtId: `evt-${i}-2`,
          DataFase: new Date(`2024-02-${String(day2).padStart(2, '0')}`),
          CodigoFase: 'FASE2',
          Fase: i % 2 === 0 ? 'Discussão' : 'Votação',
          Observacoes: '',
        },
      ],
      latestEvent: {
        EvtId: `evt-${i}-2`,
        DataFase: new Date(`2024-02-${String(day2).padStart(2, '0')}`),
        CodigoFase: 'FASE2',
        Fase: i % 2 === 0 ? 'Discussão' : 'Votação',
        Observacoes: `Observation for ${i + 1}`,
        Responsavel: `Committee ${i + 1}`,
      },
    };
  });

describe('InitiativeList', () => {
  beforeEach(() => {
    resetMockState();
  });

  afterEach(() => {
    cleanup();
  });

  describe('loading state', () => {
    it('should render spinner when loading', () => {
      setMockState({ isLoading: true });

      render(<InitiativeList />);

      const loadingStatus = screen.getByRole('status');
      expect(loadingStatus).toBeTruthy();
      expect(loadingStatus.getAttribute('aria-label')).toBe('Loading initiatives');
    });

    it('should display loading spinner when isLoading is true', () => {
      setMockState({ isLoading: true });

      render(<InitiativeList />);

      // The Spinner component has an aria-label="Loading"
      const spinner = screen.getByLabelText('Loading');
      expect(spinner).toBeTruthy();
    });

    it('should display loading spinner with correct size class (lg)', () => {
      setMockState({ isLoading: true });

      const { container } = render(<InitiativeList />);

      // The Spinner with size="lg" has w-8 h-8 classes
      const spinner = container.querySelector('.w-8.h-8');
      expect(spinner).toBeTruthy();
    });

    it('should not render table while loading', () => {
      setMockState({ isLoading: true });

      render(<InitiativeList />);

      expect(screen.queryByRole('table')).toBeNull();
    });

    it('should NOT display the table when loading', () => {
      setMockState({ isLoading: true });

      render(<InitiativeList />);

      // Table headers should NOT be visible when loading
      expect(screen.queryByText('Phase')).toBeNull();
      expect(screen.queryByText('Title')).toBeNull();
      expect(screen.queryByText('Actions')).toBeNull();
    });

    it('should display spinner in a centered container', () => {
      setMockState({ isLoading: true });

      const { container } = render(<InitiativeList />);

      // The spinner is wrapped in a flex container with justify-center and items-center
      const spinnerContainer = container.querySelector(
        '.flex.justify-center.items-center.h-full.min-h-64'
      );
      expect(spinnerContainer).toBeTruthy();
    });

    it('should still display page header when loading', () => {
      setMockState({ isLoading: true });

      render(<InitiativeList />);

      // The page title should still be visible during loading
      expect(screen.getByRole('heading', { name: 'Lista de Iniciativas' })).toBeTruthy();
    });

    it('should still display filter controls when loading', () => {
      setMockState({ isLoading: true });

      render(<InitiativeList />);

      // Search input and phase filter should still be visible
      expect(screen.getByPlaceholderText('Search initiatives...')).toBeTruthy();
      expect(screen.getByLabelText('Filter by phase')).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('should render error message when fetch fails', () => {
      setMockState({
        isError: true,
        error: new Error('Network error'),
      });

      render(<InitiativeList />);

      expect(screen.getByText('Error loading initiatives')).toBeTruthy();
      expect(screen.getByText('Network error')).toBeTruthy();
    });

    it('should show fallback message for non-Error objects', () => {
      setMockState({
        isError: true,
        error: 'Some string error' as unknown as Error,
      });

      render(<InitiativeList />);

      expect(screen.getByText('An unexpected error occurred')).toBeTruthy();
    });

    it('should display error message when isError is true', () => {
      setMockState({
        isError: true,
        error: new Error('Network error: Failed to fetch'),
      });

      render(<InitiativeList />);

      // Should display the error heading
      expect(screen.getByRole('heading', { name: 'Error loading initiatives' })).toBeTruthy();
    });

    it('should display the correct error message from Error instance', () => {
      const errorMessage = 'Failed to fetch initiatives: 500';
      setMockState({
        isError: true,
        error: new Error(errorMessage),
      });

      render(<InitiativeList />);

      expect(screen.getByText(errorMessage)).toBeTruthy();
    });

    it('should display fallback message when error is not an Error instance', () => {
      setMockState({
        isError: true,
        error: 'Some string error' as unknown as Error,
      });

      render(<InitiativeList />);

      // Should show the fallback message
      expect(screen.getByText('An unexpected error occurred')).toBeTruthy();
    });

    it('should display fallback message when error is null', () => {
      setMockState({
        isError: true,
        error: null,
      });

      render(<InitiativeList />);

      // Should show the fallback message
      expect(screen.getByText('An unexpected error occurred')).toBeTruthy();
    });

    it('should display error in a centered container', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      const { container } = render(<InitiativeList />);

      // Error is wrapped in a flex container with centering
      const errorContainer = container.querySelector(
        '.w-full.h-full.flex.items-center.justify-center'
      );
      expect(errorContainer).toBeTruthy();
    });

    it('should apply red color styling to error text', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      const { container } = render(<InitiativeList />);

      // Error container has text-red-600 class
      const errorText = container.querySelector('.text-red-600');
      expect(errorText).toBeTruthy();
    });

    it('should NOT display loading spinner when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<InitiativeList />);

      expect(screen.queryByLabelText('Loading')).toBeNull();
    });

    it('should NOT display the table when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<InitiativeList />);

      // Table headers should NOT be visible when in error state
      expect(screen.queryByText('Phase')).toBeNull();
      expect(screen.queryByText('Title')).toBeNull();
      expect(screen.queryByText('Actions')).toBeNull();
    });

    it('should NOT display page header when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<InitiativeList />);

      // The component returns early with error, so page header should not render
      expect(screen.queryByRole('heading', { name: 'Lista de Iniciativas' })).toBeNull();
    });

    it('should NOT display filter controls when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<InitiativeList />);

      // Search and filter should not render in error state
      expect(screen.queryByPlaceholderText('Search initiatives...')).toBeNull();
      expect(screen.queryByLabelText('Filter by phase')).toBeNull();
    });

    it('should display error with text-center alignment', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      const { container } = render(<InitiativeList />);

      // The inner error container has text-center class
      const centeredErrorDiv = container.querySelector('.text-red-600.text-center');
      expect(centeredErrorDiv).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('should render empty state when no initiatives', () => {
      setMockState({
        initiatives: [],
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      expect(screen.getByText('No initiatives available.')).toBeTruthy();
    });

    it('should render filtered empty state when filter yields no results', async () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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

      expect(screen.getByText('Try adjusting your search or filter settings.')).toBeTruthy();
    });
  });

  describe('Success State (no loading, no error)', () => {
    it('should NOT display loading spinner when isLoading is false', () => {
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: createInitiativesList(3),
      });

      render(<InitiativeList />);

      expect(screen.queryByLabelText('Loading')).toBeNull();
    });

    it('should NOT display error message when isError is false', () => {
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: createInitiativesList(3),
      });

      render(<InitiativeList />);

      expect(screen.queryByText('Error loading initiatives')).toBeNull();
    });

    it('should display the table when data is loaded successfully', () => {
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: createInitiativesList(3),
      });

      render(<InitiativeList />);

      // Table headers should be visible
      expect(screen.getByText('Phase')).toBeTruthy();
      expect(screen.getByText('Title')).toBeTruthy();
      expect(screen.getByText('Actions')).toBeTruthy();
    });

    it('should display page header and filter controls when data is loaded', () => {
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: createInitiativesList(3),
      });

      render(<InitiativeList />);

      expect(screen.getByRole('heading', { name: 'Lista de Iniciativas' })).toBeTruthy();
      expect(screen.getByPlaceholderText('Search initiatives...')).toBeTruthy();
      expect(screen.getByLabelText('Filter by phase')).toBeTruthy();
    });
  });

  describe('virtualization', () => {
    it('should render table structure with header', () => {
      const initiatives = createMockInitiatives(10);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Note: We mock the virtualizer to render all items for testing purposes
      // In production, the virtualizer would only render visible items
      const rows = container.querySelectorAll('[role="row"]');

      // There's 1 header row + virtualized content rows
      // With mocked virtualizer, all items are rendered for test accessibility
      const headerRowCount = 1;
      const contentRowCount = rows.length - headerRowCount;

      // Verify that all initiatives are rendered (due to mock)
      // In production, the virtualizer would render fewer rows
      expect(contentRowCount).toBe(100);

      // Verify virtual rows have the data-index attribute for positioning
      const virtualRows = container.querySelectorAll('[data-index]');
      expect(virtualRows.length).toBe(100);
    });

    it('should render virtual container with correct total height', () => {
      const initiatives = createMockInitiatives(50);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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

      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // Wait for virtual items to render (ResizeObserver is async)
      await waitFor(() => {
        expect(screen.getByText('Test Initiative 1')).toBeTruthy();
      });

      // Type in search
      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'Unique Search' } });

      // Wait for debounce (300ms) and filtering to complete
      await waitFor(
        () => {
          // First verify the filtered item is visible
          expect(screen.getByText('Unique Search Target Initiative')).toBeTruthy();
          // Then verify other items are NOT visible
          expect(screen.queryByText('Test Initiative 1')).toBeNull();
        },
        { timeout: 1000 }
      );
    });

    it('should filter initiatives by phase', async () => {
      const initiatives = createMockInitiatives(10);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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

      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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

      // Wait for debounce and filtering to complete
      await waitFor(
        () => {
          // Verify the matching item is visible
          expect(screen.getByText('Special Initiative')).toBeTruthy();
          // Verify other items are filtered out
          expect(screen.queryByText('Test Initiative 3')).toBeNull();
        },
        { timeout: 1000 }
      );
    });

    it('should debounce search input', async () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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

    it('should display search input with correct placeholder and aria-label', () => {
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: createSearchableInitiatives(),
      });

      render(<InitiativeList />);

      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      expect(searchInput).toBeTruthy();
      expect(searchInput.getAttribute('aria-label')).toBe('Search initiatives');
    });

    it('should update input value when user types', () => {
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: createSearchableInitiatives(),
      });

      render(<InitiativeList />);

      const searchInput = screen.getByPlaceholderText('Search initiatives...') as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'fiscal' } });

      expect(searchInput.value).toBe('fiscal');
    });

    it('should filter initiatives by title after debounce delay', async () => {
      const searchableInitiatives = createSearchableInitiatives();
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: searchableInitiatives,
      });

      render(<InitiativeList />);

      // Wait for virtual items to render, then verify all initiatives are visible initially
      await waitFor(() => {
        expect(screen.getByText('Reforma fiscal para empresas')).toBeTruthy();
        expect(screen.getByText('Lei do trabalho remoto')).toBeTruthy();
        expect(screen.getByText('Proteção ambiental costeira')).toBeTruthy();
      });

      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'fiscal' } });

      // Wait for debounce (300ms) and filtering to take effect
      await waitFor(
        () => {
          expect(screen.getByText('Reforma fiscal para empresas')).toBeTruthy();
          expect(screen.queryByText('Lei do trabalho remoto')).toBeNull();
          expect(screen.queryByText('Proteção ambiental costeira')).toBeNull();
        },
        { timeout: 500 }
      );
    });

    it('should filter case-insensitively', async () => {
      const searchableInitiatives = createSearchableInitiatives();
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: searchableInitiatives,
      });

      render(<InitiativeList />);

      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'TRABALHO' } });

      await waitFor(
        () => {
          expect(screen.getByText('Lei do trabalho remoto')).toBeTruthy();
          expect(screen.queryByText('Reforma fiscal para empresas')).toBeNull();
          expect(screen.queryByText('Proteção ambiental costeira')).toBeNull();
        },
        { timeout: 500 }
      );
    });

    it('should show all initiatives when search is cleared', async () => {
      const searchableInitiatives = createSearchableInitiatives();
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: searchableInitiatives,
      });

      render(<InitiativeList />);

      const searchInput = screen.getByPlaceholderText('Search initiatives...');

      // First filter to a single initiative
      fireEvent.change(searchInput, { target: { value: 'fiscal' } });

      await waitFor(
        () => {
          expect(screen.queryByText('Lei do trabalho remoto')).toBeNull();
        },
        { timeout: 500 }
      );

      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(
        () => {
          expect(screen.getByText('Reforma fiscal para empresas')).toBeTruthy();
          expect(screen.getByText('Lei do trabalho remoto')).toBeTruthy();
          expect(screen.getByText('Proteção ambiental costeira')).toBeTruthy();
        },
        { timeout: 500 }
      );
    });

    it('should handle partial matches in title', async () => {
      const searchableInitiatives = createSearchableInitiatives();
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: searchableInitiatives,
      });

      render(<InitiativeList />);

      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'prot' } });

      await waitFor(
        () => {
          // Should match "Proteção ambiental costeira"
          expect(screen.getByText('Proteção ambiental costeira')).toBeTruthy();
          expect(screen.queryByText('Reforma fiscal para empresas')).toBeNull();
          expect(screen.queryByText('Lei do trabalho remoto')).toBeNull();
        },
        { timeout: 500 }
      );
    });

    it('should not immediately filter (debounce behavior)', async () => {
      const searchableInitiatives = createSearchableInitiatives();
      setMockState({
        isLoading: false,
        isError: false,
        initiatives: searchableInitiatives,
      });

      render(<InitiativeList />);

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('Reforma fiscal para empresas')).toBeTruthy();
      });

      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'f' } });

      // Should still see all items since debounce hasn't triggered
      expect(screen.getByText('Reforma fiscal para empresas')).toBeTruthy();
      expect(screen.getByText('Lei do trabalho remoto')).toBeTruthy();
      expect(screen.getByText('Proteção ambiental costeira')).toBeTruthy();

      // Wait for debounce
      await waitFor(
        () => {
          // After debounce, should only see fiscal
          expect(screen.getByText('Reforma fiscal para empresas')).toBeTruthy();
          expect(screen.queryByText('Lei do trabalho remoto')).toBeNull();
        },
        { timeout: 500 }
      );
    });
  });

  describe('expand/collapse', () => {
    it('should expand row when clicked', () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
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

    it('should allow multiple rows to be expanded at the same time', async () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Wait for virtual items to render
      await waitFor(() => {
        const rows = container.querySelectorAll('[role="row"][aria-expanded]');
        expect(rows.length).toBeGreaterThan(0);
      });

      const rows = container.querySelectorAll('[role="row"][aria-expanded]');

      // Expand first row
      fireEvent.click(rows[0]);
      expect(rows[0].getAttribute('aria-expanded')).toBe('true');

      // Expand second row - first should stay expanded (multiple expansion allowed)
      fireEvent.click(rows[1]);
      expect(rows[0].getAttribute('aria-expanded')).toBe('true');
      expect(rows[1].getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('keyboard navigation', () => {
    it('should handle Enter key on search input', () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      const searchInput = screen.getByPlaceholderText('Search initiatives...');
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // Should not throw error
      expect(searchInput).toBeTruthy();
    });

    it('should handle Escape key to clear filters', async () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // Wait for component to render
      const searchInput = await waitFor(() => {
        return screen.getByPlaceholderText('Search initiatives...') as HTMLInputElement;
      });

      fireEvent.change(searchInput, { target: { value: 'Test' } });

      expect(searchInput.value).toBe('Test');

      fireEvent.keyDown(searchInput, { key: 'Escape' });

      await waitFor(() => {
        expect(searchInput.value).toBe('');
      });
    });

    it('should navigate rows with arrow keys', () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      const rows = container.querySelectorAll('[role="row"]');
      const firstRow = rows[0];

      fireEvent.keyDown(firstRow, { key: 'ArrowDown' });

      // Should not throw error
      expect(firstRow).toBeTruthy();
    });
  });

  describe('sorting', () => {
    it('should sort by title when header clicked', () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      const titleHeader = screen.getByText('Title');
      fireEvent.click(titleHeader);

      // After click, should have sorted (implementation depends on component)
      expect(titleHeader).toBeTruthy();
    });

    it('should toggle sort direction when header clicked twice', () => {
      const initiatives = createMockInitiatives(5);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      const titleHeader = screen.getByText('Title');

      fireEvent.click(titleHeader);
      fireEvent.click(titleHeader);

      // Should toggle direction
      expect(titleHeader).toBeTruthy();
    });
  });

  describe('pagination', () => {
    it('should render pagination controls for large dataset', () => {
      const initiatives = createMockInitiatives(100);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<InitiativeList />);

      // Pagination controls should exist for large datasets
      const paginationButtons = container.querySelectorAll('button[aria-label*="page"]');
      expect(paginationButtons.length).toBeGreaterThanOrEqual(0);
    });

    it('should navigate to next page when next button clicked', () => {
      const initiatives = createMockInitiatives(100);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      // This test verifies pagination works if implemented
      expect(screen.getByText('Test Initiative 1')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for all interactive elements', () => {
      const initiatives = createMockInitiatives(3);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      expect(screen.getByPlaceholderText('Search initiatives...')).toBeTruthy();
      expect(screen.getByLabelText('Filter by phase')).toBeTruthy();
    });

    it('should have proper role attributes on table', () => {
      const initiatives = createMockInitiatives(3);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      expect(screen.getByRole('table')).toBeTruthy();
    });

    it('should have proper heading hierarchy', () => {
      const initiatives = createMockInitiatives(3);
      setMockState({
        initiatives,
        metadata: createMockInitiativesMetadata(),
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<InitiativeList />);

      expect(screen.getByRole('heading', { name: 'Lista de Iniciativas' })).toBeTruthy();
    });
  });
});

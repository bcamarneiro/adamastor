import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEmptyParliament,
  createFilterTestParliament,
  createFullParliamentSetup,
  createMockElectoralDistrict,
  createMockMP,
  createMockParliamentData,
  createMockParliamentMetadata,
  createMockParliamentaryGroup,
  createSearchableMPs,
} from '../../../test/mocks/parliament';
import ParliamentList from './ParliamentList';

// Define the shape of the hook return value
type UseParliamentReturn = {
  parliament: ReturnType<typeof createMockParliamentData>;
  metadata: ReturnType<typeof createMockParliamentMetadata>;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
};

// Default mock state
let mockHookState: UseParliamentReturn = {
  parliament: createEmptyParliament(),
  metadata: createMockParliamentMetadata({ total: 0 }),
  isLoading: false,
  isError: false,
  isSuccess: true,
  error: null,
};

// Mock the useParliament hook
vi.mock('../../../services/parliament/useParliament', () => ({
  useParliament: () => mockHookState,
}));

// Mock react-router-dom Link component
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => {
  type MotionProps = {
    children?: React.ReactNode;
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    variants?: unknown;
    whileInView?: unknown;
    viewport?: unknown;
    transition?: unknown;
    custom?: unknown;
    whileHover?: unknown;
    whileTap?: unknown;
    [key: string]: unknown;
  };

  const createMotionComponent = (Tag: string) => (props: MotionProps) => {
    const { children, initial, animate, exit, variants, whileInView, viewport, transition, custom, whileHover, whileTap, ...rest } = props;
    return React.createElement(Tag, rest, children);
  };

  return {
    motion: {
      div: createMotionComponent('div'),
      nav: createMotionComponent('nav'),
      header: createMotionComponent('header'),
      section: createMotionComponent('section'),
      span: createMotionComponent('span'),
      p: createMotionComponent('p'),
      h1: createMotionComponent('h1'),
      h2: createMotionComponent('h2'),
      h3: createMotionComponent('h3'),
      a: createMotionComponent('a'),
      button: createMotionComponent('button'),
    },
    useInView: () => true,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => children,
  };
});

// Helper to reset mock state before each test
function resetMockState() {
  mockHookState = {
    parliament: createEmptyParliament(),
    metadata: createMockParliamentMetadata({ total: 0 }),
    isLoading: false,
    isError: false,
    isSuccess: true,
    error: null,
  };
}

// Helper to set mock state for specific test scenarios
function setMockState(overrides: Partial<UseParliamentReturn>) {
  mockHookState = { ...mockHookState, ...overrides };
}

describe('ParliamentList', () => {
  beforeEach(() => {
    resetMockState();
  });

  describe('Page Header', () => {
    it('should display page title "Parlamento"', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByRole('heading', { name: 'Parlamento' })).toBeTruthy();
    });

    it('should display page description', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText(/230 deputados eleitos/)).toBeTruthy();
    });

    it('should display breadcrumbs', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(breadcrumb).toBeTruthy();
      expect(screen.getByRole('link', { name: 'Início' })).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('should display skeleton loading when isLoading is true', () => {
      setMockState({ isLoading: true });

      const { container } = render(<ParliamentList />);

      // LoadingState component renders skeleton elements with animate-pulse
      const loadingElements = container.querySelectorAll('[class*="animate-pulse"], [class*="rounded-full"], [class*="rounded-xl"]');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should display page header even when loading', () => {
      setMockState({ isLoading: true });

      render(<ParliamentList />);

      expect(screen.getByRole('heading', { name: 'Parlamento' })).toBeTruthy();
    });

    it('should NOT display deputy cards when loading', () => {
      setMockState({ isLoading: true });

      render(<ParliamentList />);

      // No deputy names should be visible
      expect(screen.queryByText('João Silva')).toBeNull();
    });
  });

  describe('Error State', () => {
    it('should display error message when isError is true', () => {
      setMockState({
        isError: true,
        error: new Error('Network error'),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Erro ao carregar dados')).toBeTruthy();
    });

    it('should display page header even in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<ParliamentList />);

      expect(screen.getByRole('heading', { name: 'Parlamento' })).toBeTruthy();
    });
  });

  describe('Statistics Section', () => {
    it('should display total deputies stat card', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({ total: 230 }),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Deputados')).toBeTruthy();
    });

    it('should display electoral districts stat card', () => {
      const parliament = createMockParliamentData({
        districts: [
          createMockElectoralDistrict({ cpId: 1, cpDes: 'Lisboa' }),
          createMockElectoralDistrict({ cpId: 2, cpDes: 'Porto' }),
        ],
      });

      setMockState({
        parliament,
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Círculos Eleitorais')).toBeTruthy();
    });

    it('should display political parties stat card', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Partidos')).toBeTruthy();
    });
  });

  describe('Search Filtering', () => {
    it('should render search input with correct placeholder', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Pesquisar deputados...');
      expect(searchInput).toBeTruthy();
    });

    it('should have correct aria-label on search input', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByLabelText('Pesquisar deputados');
      expect(searchInput).toBeTruthy();
    });

    it('should filter MPs by parliamentary name', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Pesquisar deputados...');
      fireEvent.change(searchInput, { target: { value: 'João' } });

      expect(screen.getByText('João Silva')).toBeTruthy();
      expect(screen.queryByText('Maria Costa')).toBeNull();
    });

    it('should perform case-insensitive search', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Pesquisar deputados...');
      fireEvent.change(searchInput, { target: { value: 'MARIA' } });

      expect(screen.getByText('Maria Costa')).toBeTruthy();
    });

    it('should show all MPs when search is cleared', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Pesquisar deputados...');

      fireEvent.change(searchInput, { target: { value: 'João' } });
      expect(screen.queryByText('Maria Costa')).toBeNull();

      fireEvent.change(searchInput, { target: { value: '' } });

      expect(screen.getByText('João Silva')).toBeTruthy();
      expect(screen.getByText('Maria Costa')).toBeTruthy();
    });
  });

  describe('District Filter', () => {
    it('should render district dropdown with correct aria-label', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filtrar por círculo');
      expect(districtSelect).toBeTruthy();
    });

    it('should have "Todos os círculos" as default option', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const allDistrictsOption = screen.getByRole('option', { name: 'Todos os círculos' });
      expect(allDistrictsOption).toBeTruthy();
    });

    it('should filter MPs by selected district', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filtrar por círculo');
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });

      // Lisboa has 3 MPs
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.getByText('João Ferreira (PSD Lisboa)')).toBeTruthy();

      // Porto MPs should NOT be visible
      expect(screen.queryByText('Maria Santos (PS Porto)')).toBeNull();
    });
  });

  describe('Party Filter', () => {
    it('should render party dropdown with correct aria-label', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filtrar por partido');
      expect(partySelect).toBeTruthy();
    });

    it('should have "Todos os partidos" as default option', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const allPartiesOption = screen.getByRole('option', { name: 'Todos os partidos' });
      expect(allPartiesOption).toBeTruthy();
    });

    it('should filter MPs by selected party', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filtrar por partido');
      fireEvent.change(partySelect, { target: { value: 'PS' } });

      // PS has 2 MPs
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.getByText('Maria Santos (PS Porto)')).toBeTruthy();

      // Other parties should NOT be visible
      expect(screen.queryByText('João Ferreira (PSD Lisboa)')).toBeNull();
    });
  });

  describe('Combined Filters', () => {
    it('should apply all three filters together', () => {
      const { parliament, metadata } = createFullParliamentSetup();
      setMockState({ parliament, metadata });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Pesquisar deputados...');
      const districtSelect = screen.getByLabelText('Filtrar por círculo');
      const partySelect = screen.getByLabelText('Filtrar por partido');

      fireEvent.change(searchInput, { target: { value: 'Silva' } });
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });
      fireEvent.change(partySelect, { target: { value: 'PS' } });

      expect(screen.getByText('João Silva')).toBeTruthy();
      expect(screen.queryByText('Ana Silva')).toBeNull();
    });

    it('should display active filters badges', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filtrar por círculo');
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });

      expect(screen.getByText('Filtros ativos:')).toBeTruthy();
      // Lisboa appears multiple times (filter badge, option, deputy cards), so use getAllByText
      expect(screen.getAllByText('Lisboa').length).toBeGreaterThan(0);
    });

    it('should have "Limpar todos" button when filters are active', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Pesquisar deputados...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByText('Limpar todos')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no MPs match filters', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Pesquisar deputados...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentName' } });

      expect(screen.getByText('Sem deputados')).toBeTruthy();
    });

    it('should show "Limpar filtros" button in empty state when filters are active', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Pesquisar deputados...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentName' } });

      expect(screen.getByRole('button', { name: /Limpar filtros/i })).toBeTruthy();
    });
  });

  describe('Results Count', () => {
    it('should display results count', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      // The results count text contains "deputados"
      expect(screen.getByText(/A mostrar/)).toBeTruthy();
    });

    it('should update count when filtering', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filtrar por partido');
      fireEvent.change(partySelect, { target: { value: 'PS' } });

      expect(screen.getByText(/deputados encontrados/)).toBeTruthy();
    });
  });

  describe('Deputy Cards', () => {
    it('should display deputy names in cards', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      expect(screen.getByText('João Silva')).toBeTruthy();
      expect(screen.getByText('Maria Costa')).toBeTruthy();
    });

    it('should display party badges on deputy cards', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      // Party badges should be visible
      const psBadges = screen.getAllByText('PS');
      expect(psBadges.length).toBeGreaterThan(0);
    });

    it('should display district info on deputy cards', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      // Districts appear multiple times (in dropdown and in cards)
      expect(screen.getAllByText('Lisboa').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Porto').length).toBeGreaterThan(0);
    });
  });

  describe('Party Change History', () => {
    it('should use the last party in DepGP array for filtering (current party)', () => {
      const mpWithPartyHistory = createMockMP({
        DepId: 1,
        DepNomeParlamentar: 'MP with Party Change',
        DepCPDes: 'Lisboa',
        DepGP: [
          createMockParliamentaryGroup({
            gpSigla: 'PS',
            gpDtInicio: '2022-01-01',
            gpDtFim: '2023-06-01',
          }),
          createMockParliamentaryGroup({ gpSigla: 'PSD', gpDtInicio: '2023-06-02', gpDtFim: '' }),
        ],
      });

      setMockState({
        parliament: createMockParliamentData({
          mps: [mpWithPartyHistory],
        }),
        metadata: createMockParliamentMetadata({ total: 1 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filtrar por partido');

      // Should filter by current party (PSD)
      fireEvent.change(partySelect, { target: { value: 'PSD' } });
      expect(screen.getByText('MP with Party Change')).toBeTruthy();

      // Should NOT appear when filtering by old party (PS not in the dropdown since MP is in PSD now)
      // The PS option won't exist since there are no MPs currently in PS
      expect(screen.queryByRole('option', { name: 'PS' })).toBeNull();
    });
  });
});

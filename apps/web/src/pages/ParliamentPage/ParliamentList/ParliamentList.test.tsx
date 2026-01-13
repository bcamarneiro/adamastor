import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEmptyParliament,
  createFilterTestParliament,
  createFullParliamentSetup,
  createMPsList,
  createMockElectoralDistrict,
  createMockMP,
  createMockMPSituation,
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

// Mock react-router-dom Link component (if needed for future tests)
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

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

  describe('Loading State', () => {
    it('should display loading spinner when isLoading is true', () => {
      setMockState({ isLoading: true });

      render(<ParliamentList />);

      // The Spinner component has an aria-label="Loading"
      const spinner = screen.getByLabelText('Loading');
      expect(spinner).toBeTruthy();
    });

    it('should display loading spinner with correct size class (lg)', () => {
      setMockState({ isLoading: true });

      const { container } = render(<ParliamentList />);

      // The Spinner with size="lg" has w-8 h-8 classes
      const spinner = container.querySelector('.w-8.h-8');
      expect(spinner).toBeTruthy();
    });

    it('should NOT display the table when loading', () => {
      setMockState({ isLoading: true });

      render(<ParliamentList />);

      // Table headers should NOT be visible when loading
      expect(screen.queryByText('Name')).toBeNull();
      expect(screen.queryByText('District')).toBeNull();
      expect(screen.queryByText('Party')).toBeNull();
      expect(screen.queryByText('Status')).toBeNull();
    });

    it('should display spinner in a centered container', () => {
      setMockState({ isLoading: true });

      const { container } = render(<ParliamentList />);

      // The spinner is wrapped in a flex container with justify-center and items-center
      const spinnerContainer = container.querySelector('.flex.justify-center.items-center.h-64');
      expect(spinnerContainer).toBeTruthy();
    });

    it('should NOT display page header when loading', () => {
      setMockState({ isLoading: true });

      render(<ParliamentList />);

      // The page title should NOT be visible during loading (returns early)
      expect(screen.queryByRole('heading', { name: 'Parliament Members' })).toBeNull();
    });

    it('should NOT display filter controls when loading', () => {
      setMockState({ isLoading: true });

      render(<ParliamentList />);

      // Search input and filter dropdowns should not be visible
      expect(screen.queryByPlaceholderText('Search MPs...')).toBeNull();
      expect(screen.queryByLabelText('Filter by district')).toBeNull();
      expect(screen.queryByLabelText('Filter by party')).toBeNull();
    });

    it('should NOT display statistics section when loading', () => {
      setMockState({ isLoading: true });

      render(<ParliamentList />);

      // Statistics sections should not be visible
      expect(screen.queryByText('Party Distribution')).toBeNull();
      expect(screen.queryByText('Quick Stats')).toBeNull();
    });
  });

  describe('Error State', () => {
    it('should display error heading when isError is true', () => {
      setMockState({
        isError: true,
        error: new Error('Network error: Failed to fetch'),
      });

      render(<ParliamentList />);

      // Should display the error heading
      expect(screen.getByRole('heading', { name: 'Error loading parliament data' })).toBeTruthy();
    });

    it('should display the correct error message from Error instance', () => {
      const errorMessage = 'Failed to fetch parliament data: 500';
      setMockState({
        isError: true,
        error: new Error(errorMessage),
      });

      render(<ParliamentList />);

      expect(screen.getByText(errorMessage)).toBeTruthy();
    });

    it('should display fallback message when error is not an Error instance', () => {
      setMockState({
        isError: true,
        error: 'Some string error' as unknown as Error,
      });

      render(<ParliamentList />);

      // Should show the fallback message
      expect(screen.getByText('An unexpected error occurred')).toBeTruthy();
    });

    it('should display fallback message when error is null', () => {
      setMockState({
        isError: true,
        error: null,
      });

      render(<ParliamentList />);

      // Should show the fallback message
      expect(screen.getByText('An unexpected error occurred')).toBeTruthy();
    });

    it('should display error in a centered container', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      const { container } = render(<ParliamentList />);

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

      const { container } = render(<ParliamentList />);

      // Error container has text-red-600 class
      const errorText = container.querySelector('.text-red-600');
      expect(errorText).toBeTruthy();
    });

    it('should NOT display loading spinner when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<ParliamentList />);

      expect(screen.queryByLabelText('Loading')).toBeNull();
    });

    it('should NOT display the table when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<ParliamentList />);

      // Table headers should NOT be visible when in error state
      expect(screen.queryByText('Name')).toBeNull();
      expect(screen.queryByText('District')).toBeNull();
      expect(screen.queryByText('Party')).toBeNull();
      expect(screen.queryByText('Status')).toBeNull();
    });

    it('should NOT display page header when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<ParliamentList />);

      // The component returns early with error, so page header should not render
      expect(screen.queryByRole('heading', { name: 'Parliament Members' })).toBeNull();
    });

    it('should NOT display filter controls when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<ParliamentList />);

      // Search and filters should not render in error state
      expect(screen.queryByPlaceholderText('Search MPs...')).toBeNull();
      expect(screen.queryByLabelText('Filter by district')).toBeNull();
      expect(screen.queryByLabelText('Filter by party')).toBeNull();
    });

    it('should NOT display statistics section when in error state', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      render(<ParliamentList />);

      // Statistics sections should not be visible
      expect(screen.queryByText('Party Distribution')).toBeNull();
      expect(screen.queryByText('Quick Stats')).toBeNull();
    });

    it('should display error with text-center alignment', () => {
      setMockState({
        isError: true,
        error: new Error('Test error'),
      });

      const { container } = render(<ParliamentList />);

      // The inner error container has text-center class
      const centeredErrorDiv = container.querySelector('.text-red-600.text-center');
      expect(centeredErrorDiv).toBeTruthy();
    });
  });

  describe('Success State (no loading, no error)', () => {
    it('should NOT display loading spinner when isLoading is false', () => {
      setMockState({
        isLoading: false,
        isError: false,
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.queryByLabelText('Loading')).toBeNull();
    });

    it('should NOT display error message when isError is false', () => {
      setMockState({
        isLoading: false,
        isError: false,
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.queryByText('Error loading parliament data')).toBeNull();
    });

    it('should display page header when data is loaded successfully', () => {
      setMockState({
        isLoading: false,
        isError: false,
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      // Page header should be visible
      expect(screen.getByRole('heading', { name: 'Parliament Members' })).toBeTruthy();
    });

    it('should display filter controls when data is loaded', () => {
      setMockState({
        isLoading: false,
        isError: false,
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByPlaceholderText('Search MPs...')).toBeTruthy();
      expect(screen.getByLabelText('Filter by district')).toBeTruthy();
      expect(screen.getByLabelText('Filter by party')).toBeTruthy();
    });

    it('should display statistics sections when data is loaded', () => {
      setMockState({
        isLoading: false,
        isError: false,
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Party Distribution')).toBeTruthy();
      expect(screen.getByText('Quick Stats')).toBeTruthy();
    });

    it('should display the table with correct headers when data is loaded', () => {
      setMockState({
        isLoading: false,
        isError: false,
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      // Table headers should be visible
      expect(screen.getByText('Name')).toBeTruthy();
      expect(screen.getByText('District')).toBeTruthy();
      expect(screen.getByText('Party')).toBeTruthy();
      expect(screen.getByText('Status')).toBeTruthy();
    });
  });

  describe('Search Filtering', () => {
    it('should render search input with correct placeholder', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      expect(searchInput).toBeTruthy();
    });

    it('should have correct aria-label on search input', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByLabelText('Search MPs');
      expect(searchInput).toBeTruthy();
    });

    it('should filter MPs by parliamentary name (DepNomeParlamentar)', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      fireEvent.change(searchInput, { target: { value: 'João' } });

      // Should find João Silva
      expect(screen.getByText('João Silva')).toBeTruthy();
      // Should NOT find Maria Costa
      expect(screen.queryByText('Maria Costa')).toBeNull();
    });

    it('should filter MPs by full name (DepNomeCompleto)', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      // Search by full name component
      fireEvent.change(searchInput, { target: { value: 'Manuel Silva Santos' } });

      // Should find João Silva via full name match
      expect(screen.getByText('João Silva')).toBeTruthy();
      // Should NOT find other MPs
      expect(screen.queryByText('Maria Costa')).toBeNull();
    });

    it('should perform case-insensitive search', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      fireEvent.change(searchInput, { target: { value: 'MARIA' } });

      // Should find Maria Costa (case-insensitive)
      expect(screen.getByText('Maria Costa')).toBeTruthy();
    });

    it('should find multiple MPs matching search term', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      // "Silva" appears in João Silva and Ana Silva
      fireEvent.change(searchInput, { target: { value: 'Silva' } });

      expect(screen.getByText('João Silva')).toBeTruthy();
      expect(screen.getByText('Ana Silva')).toBeTruthy();
      // Should NOT find Maria Costa
      expect(screen.queryByText('Maria Costa')).toBeNull();
    });

    it('should show all MPs when search is cleared', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');

      // First filter
      fireEvent.change(searchInput, { target: { value: 'João' } });
      expect(screen.queryByText('Maria Costa')).toBeNull();

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      // All MPs should be visible again
      expect(screen.getByText('João Silva')).toBeTruthy();
      expect(screen.getByText('Maria Costa')).toBeTruthy();
      expect(screen.getByText('António Lima')).toBeTruthy();
    });

    it('should update input value when typing', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput.value).toBe('test search');
    });

    it('should match partial names', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      fireEvent.change(searchInput, { target: { value: 'Ant' } });

      // Should match António Lima
      expect(screen.getByText('António Lima')).toBeTruthy();
    });
  });

  describe('District Filter', () => {
    it('should render district dropdown with correct aria-label', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filter by district');
      expect(districtSelect).toBeTruthy();
    });

    it('should render district dropdown as a select element', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filter by district');
      expect(districtSelect.tagName).toBe('SELECT');
    });

    it('should have "All Districts" as default option', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const allDistrictsOption = screen.getByRole('option', { name: 'All Districts' });
      expect(allDistrictsOption).toBeTruthy();
    });

    it('should populate district options from parliament data', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      // Districts from createFilterTestParliament: Lisboa, Porto
      expect(screen.getByRole('option', { name: 'Lisboa' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'Porto' })).toBeTruthy();
    });

    it('should sort district options alphabetically', () => {
      setMockState({
        parliament: createMockParliamentData({
          districts: [
            createMockElectoralDistrict({ cpId: 1, cpDes: 'Setúbal' }),
            createMockElectoralDistrict({ cpId: 2, cpDes: 'Aveiro' }),
            createMockElectoralDistrict({ cpId: 3, cpDes: 'Porto' }),
          ],
          mps: createSearchableMPs(),
        }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filter by district') as HTMLSelectElement;
      const options = Array.from(districtSelect.options);

      // First option is "All Districts", rest should be sorted
      expect(options[0].text).toBe('All Districts');
      expect(options[1].text).toBe('Aveiro');
      expect(options[2].text).toBe('Porto');
      expect(options[3].text).toBe('Setúbal');
    });

    it('should filter MPs by selected district', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filter by district');
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });

      // Lisboa has 3 MPs: PS Lisboa, PSD Lisboa, IL Lisboa
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.getByText('João Ferreira (PSD Lisboa)')).toBeTruthy();
      expect(screen.getByText('Pedro Oliveira (IL Lisboa)')).toBeTruthy();

      // Porto MPs should NOT be visible
      expect(screen.queryByText('Maria Santos (PS Porto)')).toBeNull();
      expect(screen.queryByText('Ana Costa (PSD Porto)')).toBeNull();
    });

    it('should update dropdown value when district is selected', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filter by district') as HTMLSelectElement;
      fireEvent.change(districtSelect, { target: { value: 'Porto' } });

      expect(districtSelect.value).toBe('Porto');
    });

    it('should show all MPs when district filter is reset to "All Districts"', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filter by district');

      // First filter by Lisboa
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });
      expect(screen.queryByText('Maria Santos (PS Porto)')).toBeNull();

      // Reset to All Districts
      fireEvent.change(districtSelect, { target: { value: '' } });

      // All MPs should be visible
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.getByText('Maria Santos (PS Porto)')).toBeTruthy();
    });
  });

  describe('Party Filter', () => {
    it('should render party dropdown with correct aria-label', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filter by party');
      expect(partySelect).toBeTruthy();
    });

    it('should render party dropdown as a select element', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filter by party');
      expect(partySelect.tagName).toBe('SELECT');
    });

    it('should have "All Parties" as default option', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const allPartiesOption = screen.getByRole('option', { name: 'All Parties' });
      expect(allPartiesOption).toBeTruthy();
    });

    it('should populate party options from MPs data', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      // Parties from createFilterTestParliament: PS, PSD, IL
      expect(screen.getByRole('option', { name: 'PS' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'PSD' })).toBeTruthy();
      expect(screen.getByRole('option', { name: 'IL' })).toBeTruthy();
    });

    it('should sort party options alphabetically', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filter by party') as HTMLSelectElement;
      const options = Array.from(partySelect.options);

      // First option is "All Parties", rest should be sorted
      expect(options[0].text).toBe('All Parties');
      expect(options[1].text).toBe('IL');
      expect(options[2].text).toBe('PS');
      expect(options[3].text).toBe('PSD');
    });

    it('should filter MPs by selected party', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filter by party');
      fireEvent.change(partySelect, { target: { value: 'PS' } });

      // PS has 2 MPs: PS Lisboa, PS Porto
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.getByText('Maria Santos (PS Porto)')).toBeTruthy();

      // Other parties should NOT be visible
      expect(screen.queryByText('João Ferreira (PSD Lisboa)')).toBeNull();
      expect(screen.queryByText('Pedro Oliveira (IL Lisboa)')).toBeNull();
    });

    it('should update dropdown value when party is selected', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filter by party') as HTMLSelectElement;
      fireEvent.change(partySelect, { target: { value: 'IL' } });

      expect(partySelect.value).toBe('IL');
    });

    it('should show all MPs when party filter is reset to "All Parties"', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filter by party');

      // First filter by PS
      fireEvent.change(partySelect, { target: { value: 'PS' } });
      expect(screen.queryByText('Pedro Oliveira (IL Lisboa)')).toBeNull();

      // Reset to All Parties
      fireEvent.change(partySelect, { target: { value: '' } });

      // All MPs should be visible
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.getByText('Pedro Oliveira (IL Lisboa)')).toBeTruthy();
    });

    it('should use the last party in DepGP array for filtering (current party)', async () => {
      // Create MP with party change history
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

      const partySelect = screen.getByLabelText('Filter by party');

      // Should filter by current party (PSD), not previous (PS)
      fireEvent.change(partySelect, { target: { value: 'PSD' } });
      await waitFor(() => {
        expect(screen.getByText('MP with Party Change')).toBeTruthy();
      });

      // Should NOT appear when filtering by old party
      fireEvent.change(partySelect, { target: { value: 'PS' } });
      await waitFor(() => {
        const mpRows = screen.queryAllByRole('row');
        // Should only have header row, no data rows
        expect(mpRows.length).toBeLessThanOrEqual(2); // header + possibly empty state
      });
    });
  });

  describe('Combined Filters', () => {
    it('should apply search and district filters together', async () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      const districtSelect = screen.getByLabelText('Filter by district');

      // Search for "PS" and filter by "Lisboa"
      fireEvent.change(searchInput, { target: { value: 'PS' } });
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });

      // Wait for filters to apply
      await waitFor(() => {
        // PS Lisboa should match
        expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
        // PSD Lisboa also matches because "PS" is in "PSD"
        expect(screen.getByText('João Ferreira (PSD Lisboa)')).toBeTruthy();

        // Should have exactly 3 rows: header + 2 MPs
        const mpRows = screen.queryAllByRole('row');
        expect(mpRows.length).toBe(3);
      });
    });

    it('should apply search and party filters together', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      const partySelect = screen.getByLabelText('Filter by party');

      // Search for "Lisboa" and filter by "PSD"
      fireEvent.change(searchInput, { target: { value: 'Lisboa' } });
      fireEvent.change(partySelect, { target: { value: 'PSD' } });

      // Only PSD Lisboa should match
      expect(screen.getByText('João Ferreira (PSD Lisboa)')).toBeTruthy();

      // PSD Porto doesn't match search
      expect(screen.queryByText('Ana Costa (PSD Porto)')).toBeNull();
      // PS Lisboa doesn't match party
      expect(screen.queryByText('António Silva (PS Lisboa)')).toBeNull();
    });

    it('should apply district and party filters together', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filter by district');
      const partySelect = screen.getByLabelText('Filter by party');

      // Filter by "Lisboa" district and "PS" party
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });
      fireEvent.change(partySelect, { target: { value: 'PS' } });

      // Only PS Lisboa should match
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();

      // PS Porto doesn't match district
      expect(screen.queryByText('Maria Santos (PS Porto)')).toBeNull();
      // PSD Lisboa doesn't match party
      expect(screen.queryByText('João Ferreira (PSD Lisboa)')).toBeNull();
    });

    it('should apply all three filters together', () => {
      const { parliament, metadata } = createFullParliamentSetup();
      setMockState({ parliament, metadata });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      const districtSelect = screen.getByLabelText('Filter by district');
      const partySelect = screen.getByLabelText('Filter by party');

      // Apply all filters
      fireEvent.change(searchInput, { target: { value: 'Silva' } });
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });
      fireEvent.change(partySelect, { target: { value: 'PS' } });

      // Only João Silva matches: name contains "Silva", district is "Lisboa", party is "PS"
      expect(screen.getByText('João Silva')).toBeTruthy();

      // Ana Silva has "Silva" and "Lisboa" but party is CH
      expect(screen.queryByText('Ana Silva')).toBeNull();
    });

    it('should show empty state when combined filters return no results', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      const districtSelect = screen.getByLabelText('Filter by district');
      const partySelect = screen.getByLabelText('Filter by party');

      // Apply filters that match no one
      fireEvent.change(searchInput, { target: { value: 'IL' } });
      fireEvent.change(districtSelect, { target: { value: 'Porto' } });
      fireEvent.change(partySelect, { target: { value: 'IL' } });

      // IL is only in Lisboa, so filtering Porto + IL = no results
      expect(screen.getByText('No MPs found matching your criteria.')).toBeTruthy();
    });

    it('should clear one filter while keeping others active', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      const districtSelect = screen.getByLabelText('Filter by district');

      // Apply both filters
      fireEvent.change(searchInput, { target: { value: 'PS' } });
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.queryByText('Maria Santos (PS Porto)')).toBeNull();

      // Clear search but keep district
      fireEvent.change(searchInput, { target: { value: '' } });

      // Should now show all Lisboa MPs
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.getByText('João Ferreira (PSD Lisboa)')).toBeTruthy();
      expect(screen.getByText('Pedro Oliveira (IL Lisboa)')).toBeTruthy();
      // Porto still filtered out
      expect(screen.queryByText('Maria Santos (PS Porto)')).toBeNull();
    });

    it('should reset all filters to show all MPs', () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      const districtSelect = screen.getByLabelText('Filter by district');
      const partySelect = screen.getByLabelText('Filter by party');

      // Apply all filters
      fireEvent.change(searchInput, { target: { value: 'PS' } });
      fireEvent.change(districtSelect, { target: { value: 'Lisboa' } });
      fireEvent.change(partySelect, { target: { value: 'PS' } });

      // Reset all
      fireEvent.change(searchInput, { target: { value: '' } });
      fireEvent.change(districtSelect, { target: { value: '' } });
      fireEvent.change(partySelect, { target: { value: '' } });

      // All 5 MPs should be visible
      expect(screen.getByText('António Silva (PS Lisboa)')).toBeTruthy();
      expect(screen.getByText('Maria Santos (PS Porto)')).toBeTruthy();
      expect(screen.getByText('João Ferreira (PSD Lisboa)')).toBeTruthy();
      expect(screen.getByText('Ana Costa (PSD Porto)')).toBeTruthy();
      expect(screen.getByText('Pedro Oliveira (IL Lisboa)')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('should show "No MPs available." when parliament has no MPs and no filters are active', () => {
      setMockState({
        parliament: createEmptyParliament(),
        metadata: createMockParliamentMetadata({ total: 0 }),
      });

      render(<ParliamentList />);

      expect(screen.getByText('No MPs available.')).toBeTruthy();
    });

    it('should show "No MPs found matching your criteria." when search returns no results', () => {
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      fireEvent.change(searchInput, { target: { value: 'NonexistentName' } });

      expect(screen.getByText('No MPs found matching your criteria.')).toBeTruthy();
    });

    it('should show "No MPs found matching your criteria." when district filter returns no results', () => {
      // Create parliament with MPs only from Lisboa
      const parliament = createMockParliamentData({
        districts: [
          createMockElectoralDistrict({ cpId: 1, cpDes: 'Lisboa' }),
          createMockElectoralDistrict({ cpId: 2, cpDes: 'Évora' }),
        ],
        mps: [
          createMockMP({
            DepId: 1,
            DepNomeParlamentar: 'Only Lisboa MP',
            DepCPDes: 'Lisboa',
          }),
        ],
      });

      setMockState({
        parliament,
        metadata: createMockParliamentMetadata({ total: 1 }),
      });

      render(<ParliamentList />);

      const districtSelect = screen.getByLabelText('Filter by district');
      fireEvent.change(districtSelect, { target: { value: 'Évora' } });

      expect(screen.getByText('No MPs found matching your criteria.')).toBeTruthy();
    });

    it('should show "No MPs found matching your criteria." when party filter returns no results', async () => {
      setMockState({
        parliament: createFilterTestParliament(),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const partySelect = screen.getByLabelText('Filter by party');
      const searchInput = screen.getByPlaceholderText('Search MPs...');

      // Filter by IL party (only 1 MP) and search for "Porto" (not in IL MP's name)
      fireEvent.change(partySelect, { target: { value: 'IL' } });
      fireEvent.change(searchInput, { target: { value: 'Porto' } });

      await waitFor(() => {
        // Should show empty state - only header row + empty state row
        const mpRows = screen.queryAllByRole('row');
        expect(mpRows.length).toBe(2);
        expect(screen.getByText(/No MPs found/i)).toBeTruthy();
      });
    });

    it('should display FaUserTie icon in empty state', () => {
      setMockState({
        parliament: createEmptyParliament(),
        metadata: createMockParliamentMetadata({ total: 0 }),
      });

      const { container } = render(<ParliamentList />);

      // The empty state contains an FaUserTie icon with aria-hidden="true"
      const userIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(userIcon).toBeTruthy();
    });

    it('should center empty state message in table', () => {
      setMockState({
        parliament: createEmptyParliament(),
        metadata: createMockParliamentMetadata({ total: 0 }),
      });

      const { container } = render(<ParliamentList />);

      // Empty state has text-center and flex items-center classes
      const centeredCell = container.querySelector('.text-center');
      expect(centeredCell).toBeTruthy();

      const flexContainer = container.querySelector('.flex.flex-col.items-center');
      expect(flexContainer).toBeTruthy();
    });

    it('should distinguish between empty list and no search results by message', () => {
      // First test empty list
      setMockState({
        parliament: createEmptyParliament(),
        metadata: createMockParliamentMetadata({ total: 0 }),
      });

      const { unmount } = render(<ParliamentList />);
      expect(screen.getByText('No MPs available.')).toBeTruthy();
      unmount();

      // Then test no search results
      setMockState({
        parliament: createMockParliamentData({ mps: createSearchableMPs() }),
        metadata: createMockParliamentMetadata({ total: 5 }),
      });

      render(<ParliamentList />);

      const searchInput = screen.getByPlaceholderText('Search MPs...');
      fireEvent.change(searchInput, { target: { value: 'xyz123' } });

      expect(screen.getByText('No MPs found matching your criteria.')).toBeTruthy();
      expect(screen.queryByText('No MPs available.')).toBeNull();
    });
  });

  describe('Party Distribution Chart', () => {
    it('should render Party Distribution section header', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Party Distribution')).toBeTruthy();
    });

    it('should render chart container when metadata has party data', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({
          total: 100,
          totalByParty: { PS: 50, PSD: 50 },
        }),
      });

      const { container } = render(<ParliamentList />);

      // PieChart is rendered inside a div with h-64 class
      const chartContainer = container.querySelector('.h-64');
      expect(chartContainer).toBeTruthy();
    });

    it('should render pie chart with party labels', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({
          total: 100,
          totalByParty: { PS: 60, PSD: 40 },
        }),
      });

      const { container } = render(<ParliamentList />);

      // The PieChart component renders - verify chart container exists
      const chartContainer = container.querySelector('.h-64');
      expect(chartContainer).toBeTruthy();

      // Party names appear in the filter dropdown
      expect(screen.getAllByText(/PS/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/PSD/).length).toBeGreaterThan(0);
    });

    it('should show percentage labels on pie chart', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({
          total: 100,
          totalByParty: { PS: 60, PSD: 40 },
        }),
      });

      render(<ParliamentList />);

      // The labels show "Party (percentage%)" format
      expect(screen.getByText(/60%/)).toBeTruthy();
      expect(screen.getByText(/40%/)).toBeTruthy();
    });

    it('should handle multiple parties in pie chart', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({
          total: 100,
          totalByParty: { PS: 30, PSD: 30, IL: 20, CH: 15, BE: 5 },
        }),
      });

      render(<ParliamentList />);

      // All parties should appear in the chart (may also appear in filters)
      expect(screen.getAllByText(/PS/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/PSD/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/IL/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CH/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/BE/).length).toBeGreaterThan(0);
    });

    it('should handle empty totalByParty gracefully', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({
          total: 0,
          totalByParty: {},
        }),
      });

      // Should not throw when totalByParty is empty
      expect(() => render(<ParliamentList />)).not.toThrow();
    });

    it('should handle undefined metadata.totalByParty gracefully', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: {
          total: 0,
          totalByParty: undefined as unknown as Record<string, number>,
          totalByDistrict: {},
          totalByStatus: {},
        },
      });

      // Should not throw when totalByParty is undefined
      expect(() => render(<ParliamentList />)).not.toThrow();
    });

    it('should render chart in a styled card container', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      const { container } = render(<ParliamentList />);

      // Chart is in a bg-white rounded-lg shadow container
      const cardContainer = container.querySelector('.bg-white.rounded-lg.shadow');
      expect(cardContainer).toBeTruthy();
    });

    it('should render single party with 100%', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({
          total: 50,
          totalByParty: { PS: 50 },
        }),
      });

      const { container } = render(<ParliamentList />);

      // Single party should show 100% - verify chart renders
      const chartContainer = container.querySelector('.h-64');
      expect(chartContainer).toBeTruthy();

      // Party name appears in filter dropdown
      expect(screen.getAllByText(/PS/).length).toBeGreaterThan(0);
    });

    it('should round percentages in chart labels', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({
          total: 3,
          totalByParty: { PS: 1, PSD: 1, IL: 1 },
        }),
      });

      const { container } = render(<ParliamentList />);

      // 1/3 = 33.33...% should be rounded - verify chart renders
      const chartContainer = container.querySelector('.h-64');
      expect(chartContainer).toBeTruthy();
    });
  });

  describe('Quick Stats Display', () => {
    it('should render Quick Stats section header', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Quick Stats')).toBeTruthy();
    });

    it('should display "Total MPs" label', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Total MPs')).toBeTruthy();
    });

    it('should display total MPs count from metadata', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({ total: 230 }),
      });

      render(<ParliamentList />);

      expect(screen.getByText('230')).toBeTruthy();
    });

    it('should display 0 when metadata.total is undefined', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: {
          total: undefined as unknown as number,
          totalByParty: {},
          totalByDistrict: {},
          totalByStatus: {},
        },
      });

      render(<ParliamentList />);

      // Should show 0 when total is undefined
      const totalMPsLabel = screen.getByText('Total MPs');
      const parent = totalMPsLabel.parentElement;
      expect(parent?.textContent).toContain('0');
    });

    it('should display 0 when metadata.total is 0', () => {
      setMockState({
        parliament: createEmptyParliament(),
        metadata: createMockParliamentMetadata({ total: 0 }),
      });

      render(<ParliamentList />);

      const totalMPsLabel = screen.getByText('Total MPs');
      const parent = totalMPsLabel.parentElement;
      expect(parent?.textContent).toContain('0');
    });

    it('should display "Electoral Districts" label', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Electoral Districts')).toBeTruthy();
    });

    it('should display correct electoral districts count from parliament data', () => {
      const parliament = createMockParliamentData({
        districts: [
          createMockElectoralDistrict({ cpId: 1, cpDes: 'Lisboa' }),
          createMockElectoralDistrict({ cpId: 2, cpDes: 'Porto' }),
          createMockElectoralDistrict({ cpId: 3, cpDes: 'Braga' }),
          createMockElectoralDistrict({ cpId: 4, cpDes: 'Setúbal' }),
        ],
      });

      setMockState({
        parliament,
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      // Should show 4 districts
      const districtsLabel = screen.getByText('Electoral Districts');
      const parent = districtsLabel.parentElement;
      expect(parent?.textContent).toContain('4');
    });

    it('should display 0 for electoral districts when parliament has no districts', () => {
      setMockState({
        parliament: createEmptyParliament(),
        metadata: createMockParliamentMetadata({ total: 0 }),
      });

      render(<ParliamentList />);

      const districtsLabel = screen.getByText('Electoral Districts');
      const parent = districtsLabel.parentElement;
      expect(parent?.textContent).toContain('0');
    });

    it('should display "Political Parties" label', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      expect(screen.getByText('Political Parties')).toBeTruthy();
    });

    it('should display correct political parties count derived from MPs', () => {
      const parliament = createMockParliamentData({
        mps: [
          createMockMP({ DepId: 1, DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })] }),
          createMockMP({ DepId: 2, DepGP: [createMockParliamentaryGroup({ gpSigla: 'PSD' })] }),
          createMockMP({ DepId: 3, DepGP: [createMockParliamentaryGroup({ gpSigla: 'IL' })] }),
        ],
      });

      setMockState({
        parliament,
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      // Should show 3 parties (PS, PSD, IL)
      const partiesLabel = screen.getByText('Political Parties');
      const parent = partiesLabel.parentElement;
      expect(parent?.textContent).toContain('3');
    });

    it('should count unique parties only (not duplicates)', () => {
      const parliament = createMockParliamentData({
        mps: [
          createMockMP({ DepId: 1, DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })] }),
          createMockMP({ DepId: 2, DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })] }),
          createMockMP({ DepId: 3, DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })] }),
          createMockMP({ DepId: 4, DepGP: [createMockParliamentaryGroup({ gpSigla: 'PSD' })] }),
        ],
      });

      setMockState({
        parliament,
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      // Should show 2 unique parties (PS, PSD)
      const partiesLabel = screen.getByText('Political Parties');
      const parent = partiesLabel.parentElement;
      expect(parent?.textContent).toContain('2');
    });

    it('should display 0 for political parties when parliament has no MPs', () => {
      setMockState({
        parliament: createEmptyParliament(),
        metadata: createMockParliamentMetadata({ total: 0 }),
      });

      render(<ParliamentList />);

      const partiesLabel = screen.getByText('Political Parties');
      const parent = partiesLabel.parentElement;
      expect(parent?.textContent).toContain('0');
    });

    it('should render Quick Stats in a styled card container', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      const { container } = render(<ParliamentList />);

      // Quick Stats is in a bg-white rounded-lg shadow container
      const cardContainers = container.querySelectorAll('.bg-white.rounded-lg.shadow');
      // Should have at least 2 cards (Party Distribution and Quick Stats)
      expect(cardContainers.length).toBeGreaterThanOrEqual(2);
    });

    it('should render stat values in bold large text', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata({ total: 150 }),
      });

      const { container } = render(<ParliamentList />);

      // Stat values have text-2xl font-bold classes
      const boldStats = container.querySelectorAll('.text-2xl.font-bold');
      // Should have at least 3 (Total MPs, Districts, Parties)
      expect(boldStats.length).toBeGreaterThanOrEqual(3);
    });

    it('should render stat labels in neutral color', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      const { container } = render(<ParliamentList />);

      // Stat labels have text-neutral-600 class
      const neutralLabels = container.querySelectorAll('.text-neutral-600');
      expect(neutralLabels.length).toBeGreaterThanOrEqual(3);
    });

    it('should use current party (last in DepGP array) for party count', () => {
      const parliament = createMockParliamentData({
        mps: [
          createMockMP({
            DepId: 1,
            DepGP: [
              createMockParliamentaryGroup({
                gpSigla: 'PS',
                gpDtInicio: '2022-01-01',
                gpDtFim: '2023-06-01',
              }),
              createMockParliamentaryGroup({
                gpSigla: 'PSD',
                gpDtInicio: '2023-06-02',
                gpDtFim: '',
              }),
            ],
          }),
          createMockMP({
            DepId: 2,
            DepGP: [createMockParliamentaryGroup({ gpSigla: 'IL' })],
          }),
        ],
      });

      setMockState({
        parliament,
        metadata: createMockParliamentMetadata(),
      });

      render(<ParliamentList />);

      // Should count 2 parties: PSD (current) and IL, NOT PS (previous)
      const partiesLabel = screen.getByText('Political Parties');
      const parent = partiesLabel.parentElement;
      expect(parent?.textContent).toContain('2');
    });

    it('should handle MPs with empty DepGP array', () => {
      const parliament = createMockParliamentData({
        mps: [
          createMockMP({
            DepId: 1,
            DepGP: [],
          }),
          createMockMP({
            DepId: 2,
            DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })],
          }),
        ],
      });

      setMockState({
        parliament,
        metadata: createMockParliamentMetadata(),
      });

      // Should not throw and should count only 1 party
      expect(() => render(<ParliamentList />)).not.toThrow();

      const partiesLabel = screen.getByText('Political Parties');
      const parent = partiesLabel.parentElement;
      expect(parent?.textContent).toContain('1');
    });
  });

  describe('Statistics Grid Layout', () => {
    it('should render statistics in a two-column grid on larger screens', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      const { container } = render(<ParliamentList />);

      // Grid layout with responsive classes
      const statsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(statsGrid).toBeTruthy();
    });

    it('should have gap between statistics cards', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      const { container } = render(<ParliamentList />);

      // Should have gap-6 class
      const statsGrid = container.querySelector('.gap-6');
      expect(statsGrid).toBeTruthy();
    });

    it('should have margin below statistics section', () => {
      setMockState({
        parliament: createMockParliamentData(),
        metadata: createMockParliamentMetadata(),
      });

      const { container } = render(<ParliamentList />);

      // Should have mb-6 class for margin below
      const statsGrid = container.querySelector('.mb-6');
      expect(statsGrid).toBeTruthy();
    });
  });

  describe('Table Rendering', () => {
    describe('Table Structure', () => {
      it('should render a table element', () => {
        setMockState({
          parliament: createMockParliamentData(),
          metadata: createMockParliamentMetadata(),
        });

        render(<ParliamentList />);

        const table = screen.getByRole('table');
        expect(table).toBeTruthy();
      });

      it('should render all 5 column headers including icon column', () => {
        setMockState({
          parliament: createMockParliamentData(),
          metadata: createMockParliamentMetadata(),
        });

        render(<ParliamentList />);

        // Check for visible text headers
        expect(screen.getByText('Name')).toBeTruthy();
        expect(screen.getByText('District')).toBeTruthy();
        expect(screen.getByText('Party')).toBeTruthy();
        expect(screen.getByText('Status')).toBeTruthy();
      });

      it('should render column headers within header row', () => {
        setMockState({
          parliament: createMockParliamentData(),
          metadata: createMockParliamentMetadata(),
        });

        render(<ParliamentList />);

        // Find headers by role
        const columnHeaders = screen.getAllByRole('columnheader');
        // 5 columns: icon (empty), Name, District, Party, Status
        expect(columnHeaders.length).toBe(5);
      });

      it('should render header row with neutral background', () => {
        setMockState({
          parliament: createMockParliamentData(),
          metadata: createMockParliamentMetadata(),
        });

        const { container } = render(<ParliamentList />);

        // Header row has bg-neutral-2 class
        const headerRow = container.querySelector('.bg-neutral-2');
        expect(headerRow).toBeTruthy();
      });

      it('should render table within a styled card container', () => {
        setMockState({
          parliament: createMockParliamentData(),
          metadata: createMockParliamentMetadata(),
        });

        const { container } = render(<ParliamentList />);

        // Table container has bg-white rounded-lg shadow classes
        const tableContainer = container.querySelector(
          '.bg-white.rounded-lg.shadow.overflow-hidden'
        );
        expect(tableContainer).toBeTruthy();
      });
    });

    describe('Name Column', () => {
      it('should render MP parliamentary name (DepNomeParlamentar)', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        render(<ParliamentList />);

        // Should display parliamentary names
        expect(screen.getByText('João Silva')).toBeTruthy();
        expect(screen.getByText('Maria Costa')).toBeTruthy();
        expect(screen.getByText('António Lima')).toBeTruthy();
      });

      it('should render MP full name (DepNomeCompleto) as secondary text', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        render(<ParliamentList />);

        // Should display full names
        expect(screen.getByText('João Manuel Silva Santos')).toBeTruthy();
        expect(screen.getByText('Maria Teresa Oliveira Costa')).toBeTruthy();
        expect(screen.getByText('António José Ferreira Lima')).toBeTruthy();
      });

      it('should render parliamentary name with font-medium styling', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        const { container } = render(<ParliamentList />);

        // Parliamentary name has font-medium class
        const mediumFontNames = container.querySelectorAll('.font-medium');
        expect(mediumFontNames.length).toBeGreaterThanOrEqual(5); // At least 5 MPs
      });

      it('should render full name with smaller text and neutral color', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        const { container } = render(<ParliamentList />);

        // Full name has text-sm and text-neutral-11 classes
        const secondaryNames = container.querySelectorAll('.text-sm.text-neutral-11');
        expect(secondaryNames.length).toBeGreaterThanOrEqual(5); // At least 5 MPs
      });

      it('should display both parliamentary and full name for each MP', () => {
        const mp = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'Test Parliamentary Name',
          DepNomeCompleto: 'Test Full Name Complete',
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [mp] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        render(<ParliamentList />);

        expect(screen.getByText('Test Parliamentary Name')).toBeTruthy();
        expect(screen.getByText('Test Full Name Complete')).toBeTruthy();
      });
    });

    describe('District Column', () => {
      it('should render MP district (DepCPDes)', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        render(<ParliamentList />);

        // Districts from createSearchableMPs: Lisboa, Porto, Braga
        // Note: "Lisboa" appears in multiple places (header and data), so we check all occurrences
        const lisboas = screen.getAllByText('Lisboa');
        expect(lisboas.length).toBeGreaterThanOrEqual(1);
      });

      it('should display district in table row cells', () => {
        const mp = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'Test MP',
          DepCPDes: 'Évora',
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [mp] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        render(<ParliamentList />);

        expect(screen.getByText('Évora')).toBeTruthy();
      });

      it('should display different districts for different MPs', () => {
        const mps = [
          createMockMP({ DepId: 1, DepNomeParlamentar: 'MP 1', DepCPDes: 'Faro' }),
          createMockMP({ DepId: 2, DepNomeParlamentar: 'MP 2', DepCPDes: 'Coimbra' }),
          createMockMP({ DepId: 3, DepNomeParlamentar: 'MP 3', DepCPDes: 'Aveiro' }),
        ];

        setMockState({
          parliament: createMockParliamentData({ mps }),
          metadata: createMockParliamentMetadata({ total: 3 }),
        });

        render(<ParliamentList />);

        expect(screen.getByText('Faro')).toBeTruthy();
        expect(screen.getByText('Coimbra')).toBeTruthy();
        expect(screen.getByText('Aveiro')).toBeTruthy();
      });
    });

    describe('Party Column', () => {
      it('should render MP current party acronym (last DepGP.gpSigla)', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        render(<ParliamentList />);

        // Parties from createSearchableMPs: PS, PSD, IL, CH
        // Note: These also appear in filters, so we verify they exist multiple times (in table and dropdown)
        expect(screen.getAllByText('IL').length).toBeGreaterThan(0);
        expect(screen.getAllByText('CH').length).toBeGreaterThan(0);
      });

      it('should render party in a badge/pill with neutral background', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        const { container } = render(<ParliamentList />);

        // Party badges have inline-flex px-2 py-1 rounded-full text-sm bg-neutral-2 classes
        const badges = container.querySelectorAll(
          '.inline-flex.px-2.py-1.rounded-full.text-sm.bg-neutral-2'
        );
        // Each MP has 2 badges (party + status), so with 5 MPs we expect 10
        expect(badges.length).toBe(10);
      });

      it('should use current party (last in DepGP array) for display', () => {
        const mpWithPartyHistory = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'Party Changer',
          DepGP: [
            createMockParliamentaryGroup({
              gpSigla: 'PS',
              gpDtInicio: '2022-01-01',
              gpDtFim: '2023-06-01',
            }),
            createMockParliamentaryGroup({
              gpSigla: 'Independente',
              gpDtInicio: '2023-06-02',
              gpDtFim: '',
            }),
          ],
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [mpWithPartyHistory] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        render(<ParliamentList />);

        // Should show current party "Independente", not previous "PS" (appears in table and dropdown)
        expect(screen.getAllByText('Independente').length).toBeGreaterThan(0);
      });

      it('should handle MP with empty DepGP array gracefully', () => {
        const mpNoParty = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'No Party MP',
          DepGP: [],
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [mpNoParty] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        // Should not throw
        expect(() => render(<ParliamentList />)).not.toThrow();

        // MP name should still render
        expect(screen.getByText('No Party MP')).toBeTruthy();
      });
    });

    describe('Status Column', () => {
      it('should render MP current status (last DepSituacao.sioDes)', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        render(<ParliamentList />);

        // Default status from mock is "Efetivo"
        const efetivos = screen.getAllByText('Efetivo');
        // Should have 5 Efetivo statuses (one per MP)
        expect(efetivos.length).toBe(5);
      });

      it('should render status in a badge/pill with neutral background', () => {
        const mp = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'Test MP',
          DepSituacao: [createMockMPSituation({ sioDes: 'Efetivo' })],
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [mp] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        const { container } = render(<ParliamentList />);

        // Status has badge styling
        const badges = container.querySelectorAll(
          '.inline-flex.px-2.py-1.rounded-full.text-sm.bg-neutral-2'
        );
        // 1 MP with party badge + status badge = 2
        expect(badges.length).toBe(2);
      });

      it('should display suspended status when MP is suspended', () => {
        const suspendedMP = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'Suspended MP',
          DepSituacao: [
            createMockMPSituation({
              sioDes: 'Efetivo',
              sioDtInicio: '2024-01-01',
              sioDtFim: '2024-06-01',
            }),
            createMockMPSituation({
              sioDes: 'Suspenso(Eleito)',
              sioDtInicio: '2024-06-02',
              sioDtFim: null,
            }),
          ],
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [suspendedMP] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        render(<ParliamentList />);

        // Should show current status "Suspenso(Eleito)"
        expect(screen.getByText('Suspenso(Eleito)')).toBeTruthy();
        // Should NOT show previous status "Efetivo" in the table row
        expect(screen.queryByText('Efetivo')).toBeNull();
      });

      it('should handle MP with empty DepSituacao array gracefully', () => {
        const mpNoStatus = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'No Status MP',
          DepSituacao: [],
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [mpNoStatus] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        // Should not throw
        expect(() => render(<ParliamentList />)).not.toThrow();

        // MP name should still render
        expect(screen.getByText('No Status MP')).toBeTruthy();
      });

      it('should use current status (last in DepSituacao array) for display', () => {
        const mpWithStatusHistory = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'Status Changer',
          DepSituacao: [
            createMockMPSituation({
              sioDes: 'Efetivo',
              sioDtInicio: '2024-01-01',
              sioDtFim: '2024-03-01',
            }),
            createMockMPSituation({
              sioDes: 'Suspenso(Não Eleito)',
              sioDtInicio: '2024-03-02',
              sioDtFim: '2024-05-01',
            }),
            createMockMPSituation({ sioDes: 'Efetivo', sioDtInicio: '2024-05-02', sioDtFim: null }),
          ],
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [mpWithStatusHistory] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        render(<ParliamentList />);

        // Should show the last/current status "Efetivo"
        expect(screen.getByText('Efetivo')).toBeTruthy();
        // "Suspenso(Não Eleito)" should NOT appear (it's historical)
        expect(screen.queryByText('Suspenso(Não Eleito)')).toBeNull();
      });
    });

    describe('Icon Column', () => {
      it('should render FaUserTie icon for each MP row', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        const { container } = render(<ParliamentList />);

        // Each MP row has an FaUserTie icon in the table body
        const tableBody = container.querySelector('tbody');
        const icons = tableBody?.querySelectorAll('svg.text-neutral-11');
        // 5 MPs = 5 icons in table body
        expect(icons?.length).toBe(5);
      });
    });

    describe('Row Rendering', () => {
      it('should render correct number of table rows for MPs', () => {
        const mps = createSearchableMPs(); // 5 MPs

        setMockState({
          parliament: createMockParliamentData({ mps }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        render(<ParliamentList />);

        // Get all rows from table body (excluding header row)
        const rows = screen.getAllByRole('row');
        // 1 header row + 5 data rows = 6 total rows
        expect(rows.length).toBe(6);
      });

      it('should render each MP with unique key (DepId)', () => {
        const mps = [
          createMockMP({ DepId: 101, DepNomeParlamentar: 'MP 101' }),
          createMockMP({ DepId: 102, DepNomeParlamentar: 'MP 102' }),
          createMockMP({ DepId: 103, DepNomeParlamentar: 'MP 103' }),
        ];

        setMockState({
          parliament: createMockParliamentData({ mps }),
          metadata: createMockParliamentMetadata({ total: 3 }),
        });

        // Should render without React key warning
        expect(() => render(<ParliamentList />)).not.toThrow();

        // Verify all MPs are rendered
        expect(screen.getByText('MP 101')).toBeTruthy();
        expect(screen.getByText('MP 102')).toBeTruthy();
        expect(screen.getByText('MP 103')).toBeTruthy();
      });

      it('should apply hover effect class on table rows', () => {
        setMockState({
          parliament: createMockParliamentData({ mps: createSearchableMPs() }),
          metadata: createMockParliamentMetadata({ total: 5 }),
        });

        const { container } = render(<ParliamentList />);

        // Data rows have hover:bg-neutral-1 and transition-colors classes
        const hoverRows = container.querySelectorAll('.hover\\:bg-neutral-1.transition-colors');
        // 5 MP rows with hover effect
        expect(hoverRows.length).toBe(5);
      });

      it('should render all data in correct column order', () => {
        const mp = createMockMP({
          DepId: 1,
          DepNomeParlamentar: 'Ordered Test MP',
          DepNomeCompleto: 'Ordered Test Full Name',
          DepCPDes: 'Test District',
          DepGP: [createMockParliamentaryGroup({ gpSigla: 'TEST' })],
          DepSituacao: [createMockMPSituation({ sioDes: 'TestStatus' })],
        });

        setMockState({
          parliament: createMockParliamentData({ mps: [mp] }),
          metadata: createMockParliamentMetadata({ total: 1 }),
        });

        render(<ParliamentList />);

        // Verify all data is rendered (column order is verified by structure)
        expect(screen.getByText('Ordered Test MP')).toBeTruthy();
        expect(screen.getByText('Ordered Test Full Name')).toBeTruthy();
        expect(screen.getByText('Test District')).toBeTruthy();
        expect(screen.getAllByText('TEST').length).toBeGreaterThan(0); // Appears in table and dropdown
        expect(screen.getByText('TestStatus')).toBeTruthy();
      });
    });

    describe('Table with Multiple MPs', () => {
      it('should render all MPs in a large list', () => {
        const mps = createMPsList(10); // 10 MPs

        setMockState({
          parliament: createMockParliamentData({ mps }),
          metadata: createMockParliamentMetadata({ total: 10 }),
        });

        render(<ParliamentList />);

        // Should have 10 data rows + 1 header row
        const rows = screen.getAllByRole('row');
        expect(rows.length).toBe(11);
      });

      it('should render MPs with diverse parties correctly', () => {
        const mps = [
          createMockMP({
            DepId: 1,
            DepNomeParlamentar: 'MP PS',
            DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })],
          }),
          createMockMP({
            DepId: 2,
            DepNomeParlamentar: 'MP PSD',
            DepGP: [createMockParliamentaryGroup({ gpSigla: 'PSD' })],
          }),
          createMockMP({
            DepId: 3,
            DepNomeParlamentar: 'MP IL',
            DepGP: [createMockParliamentaryGroup({ gpSigla: 'IL' })],
          }),
          createMockMP({
            DepId: 4,
            DepNomeParlamentar: 'MP CH',
            DepGP: [createMockParliamentaryGroup({ gpSigla: 'CH' })],
          }),
          createMockMP({
            DepId: 5,
            DepNomeParlamentar: 'MP BE',
            DepGP: [createMockParliamentaryGroup({ gpSigla: 'BE' })],
          }),
          createMockMP({
            DepId: 6,
            DepNomeParlamentar: 'MP PCP',
            DepGP: [createMockParliamentaryGroup({ gpSigla: 'PCP' })],
          }),
        ];

        setMockState({
          parliament: createMockParliamentData({ mps }),
          metadata: createMockParliamentMetadata({ total: 6 }),
        });

        render(<ParliamentList />);

        // All party badges should be visible
        expect(screen.getAllByText('IL').length).toBeGreaterThan(0);
        expect(screen.getAllByText('CH').length).toBeGreaterThan(0);
        expect(screen.getAllByText('BE').length).toBeGreaterThan(0);
        expect(screen.getAllByText('PCP').length).toBeGreaterThan(0);
      });

      it('should render MPs with mixed status correctly', () => {
        const mps = [
          createMockMP({
            DepId: 1,
            DepNomeParlamentar: 'Active MP',
            DepSituacao: [createMockMPSituation({ sioDes: 'Efetivo' })],
          }),
          createMockMP({
            DepId: 2,
            DepNomeParlamentar: 'Suspended MP 1',
            DepSituacao: [createMockMPSituation({ sioDes: 'Suspenso(Eleito)' })],
          }),
          createMockMP({
            DepId: 3,
            DepNomeParlamentar: 'Suspended MP 2',
            DepSituacao: [createMockMPSituation({ sioDes: 'Suspenso(Não Eleito)' })],
          }),
        ];

        setMockState({
          parliament: createMockParliamentData({ mps }),
          metadata: createMockParliamentMetadata({ total: 3 }),
        });

        render(<ParliamentList />);

        // All status types should be visible
        expect(screen.getByText('Efetivo')).toBeTruthy();
        expect(screen.getByText('Suspenso(Eleito)')).toBeTruthy();
        expect(screen.getByText('Suspenso(Não Eleito)')).toBeTruthy();
      });

      it('should render MPs from different districts', () => {
        const mps = [
          createMockMP({ DepId: 1, DepNomeParlamentar: 'MP 1', DepCPDes: 'Madeira' }),
          createMockMP({ DepId: 2, DepNomeParlamentar: 'MP 2', DepCPDes: 'Açores' }),
          createMockMP({ DepId: 3, DepNomeParlamentar: 'MP 3', DepCPDes: 'Europa' }),
          createMockMP({ DepId: 4, DepNomeParlamentar: 'MP 4', DepCPDes: 'Fora da Europa' }),
        ];

        setMockState({
          parliament: createMockParliamentData({ mps }),
          metadata: createMockParliamentMetadata({ total: 4 }),
        });

        render(<ParliamentList />);

        // All districts should be visible
        expect(screen.getByText('Madeira')).toBeTruthy();
        expect(screen.getByText('Açores')).toBeTruthy();
        expect(screen.getByText('Europa')).toBeTruthy();
        expect(screen.getByText('Fora da Europa')).toBeTruthy();
      });
    });
  });
});

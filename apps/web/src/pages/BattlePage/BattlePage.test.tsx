import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div {...props}>{children}</div>
    ),
    p: ({ children, ...props }: React.PropsWithChildren<object>) => <p {...props}>{children}</p>,
    h2: ({ children, ...props }: React.PropsWithChildren<object>) => <h2 {...props}>{children}</h2>,
    span: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <span {...props}>{children}</span>
    ),
    a: ({ children, ...props }: React.PropsWithChildren<object>) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock child components
vi.mock('@/components/MainNav', () => ({
  default: () => <nav data-testid="main-nav-component">MainNav</nav>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer-component">Footer</footer>,
}));

vi.mock('@/components/SEO', () => ({
  SEO: () => null,
  SEO_CONFIGS: { battle: {} },
}));

const mockBattleRoyale = vi.fn();
vi.mock('@/components/BattleRoyale', () => ({
  BattleRoyale: (props: { initialDeputyA: unknown; initialDeputyB: unknown }) => {
    mockBattleRoyale(props);
    return <div data-testid="battle-royale">BattleRoyale</div>;
  },
}));

const mockUseDeputyDetail = vi.fn();
vi.mock('@/services/reportCard/useDeputyDetail', () => ({
  useDeputyDetail: (id: string | null) => mockUseDeputyDetail(id),
}));

import BattlePage from './BattlePage';

const renderBattlePage = (initialPath: string) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="batalha" element={<BattlePage />} />
        <Route path="batalha/deputado/:idA/vs/:idB" element={<BattlePage />} />
      </Routes>
    </MemoryRouter>
  );
};

const mockDeputy = (id: string, name: string) => ({
  id,
  external_id: `ext-${id}`,
  name,
  short_name: name,
  photo_url: null,
  is_active: true,
  mandate_start: null,
  mandate_end: null,
  legislature: 16,
  party_id: 'party-1',
  party_acronym: 'PS',
  party_name: 'Partido Socialista',
  party_color: '#FF0000',
  district_id: 'dist-1',
  district_name: 'Lisboa',
  district_slug: 'lisboa',
  proposal_count: 10,
  intervention_count: 5,
  question_count: 8,
  party_votes_favor: 100,
  party_votes_against: 20,
  party_votes_abstain: 5,
  party_total_votes: 125,
  work_score: 0.85,
  grade: 'A',
  national_rank: 3,
  district_rank: 1,
  attendance_rate: 0.9,
  meetings_attended: 90,
  meetings_total: 100,
  birth_date: null,
  profession: null,
  education: null,
  bio_narrative: null,
  biography_source_url: null,
  biography_scraped_at: null,
});

describe('BattlePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDeputyDetail.mockReturnValue({ data: undefined, isLoading: false });
  });

  describe('Without URL params (/batalha)', () => {
    it('renders the page title and description', () => {
      renderBattlePage('/batalha');
      expect(screen.getByText('Battle Royale')).toBeInTheDocument();
      expect(screen.getByText(/Compara a atividade parlamentar/i)).toBeInTheDocument();
    });

    it('renders BattleRoyale with null deputies', () => {
      renderBattlePage('/batalha');
      expect(screen.getByTestId('battle-royale')).toBeInTheDocument();
      expect(mockBattleRoyale).toHaveBeenCalledWith({
        initialDeputyA: null,
        initialDeputyB: null,
      });
    });

    it('does not call useDeputyDetail with IDs', () => {
      renderBattlePage('/batalha');
      // useDeputyDetail is called with null for both params
      expect(mockUseDeputyDetail).toHaveBeenCalledWith(null);
    });
  });

  describe('With URL params (/batalha/deputado/:idA/vs/:idB)', () => {
    it('shows loading state when deputies are not yet loaded', () => {
      mockUseDeputyDetail.mockReturnValue({ data: undefined, isLoading: true });
      renderBattlePage('/batalha/deputado/deputy-1/vs/deputy-2');
      expect(screen.getByText('A carregar comparação...')).toBeInTheDocument();
    });

    it('calls useDeputyDetail with the correct IDs from URL', () => {
      mockUseDeputyDetail.mockReturnValue({ data: undefined, isLoading: true });
      renderBattlePage('/batalha/deputado/deputy-1/vs/deputy-2');
      expect(mockUseDeputyDetail).toHaveBeenCalledWith('deputy-1');
      expect(mockUseDeputyDetail).toHaveBeenCalledWith('deputy-2');
    });

    it('passes loaded deputies to BattleRoyale', () => {
      const deputy1 = mockDeputy('deputy-1', 'Ana Silva');
      const deputy2 = mockDeputy('deputy-2', 'Bruno Costa');

      mockUseDeputyDetail
        .mockReturnValueOnce({ data: deputy1, isLoading: false })
        .mockReturnValueOnce({ data: deputy2, isLoading: false });

      renderBattlePage('/batalha/deputado/deputy-1/vs/deputy-2');

      expect(screen.getByTestId('battle-royale')).toBeInTheDocument();
      expect(mockBattleRoyale).toHaveBeenCalledWith({
        initialDeputyA: deputy1,
        initialDeputyB: deputy2,
      });
    });

    it('shows loading when only one deputy is loaded', () => {
      const deputy1 = mockDeputy('deputy-1', 'Ana Silva');

      mockUseDeputyDetail
        .mockReturnValueOnce({ data: deputy1, isLoading: false })
        .mockReturnValueOnce({ data: undefined, isLoading: true });

      renderBattlePage('/batalha/deputado/deputy-1/vs/deputy-2');

      expect(screen.getByText('A carregar comparação...')).toBeInTheDocument();
      expect(screen.queryByTestId('battle-royale')).not.toBeInTheDocument();
    });

    it('renders navigation elements', () => {
      renderBattlePage('/batalha/deputado/deputy-1/vs/deputy-2');
      expect(screen.getByTestId('main-nav-component')).toBeInTheDocument();
      expect(screen.getByTestId('footer-component')).toBeInTheDocument();
    });

    it('renders the back button', () => {
      renderBattlePage('/batalha/deputado/deputy-1/vs/deputy-2');
      expect(screen.getByText('Voltar')).toBeInTheDocument();
    });
  });
});

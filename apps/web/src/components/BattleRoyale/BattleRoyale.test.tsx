import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DeputyDetail } from '../../lib/supabase';

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
vi.mock('./BattleResults', () => ({
  BattleResults: () => <div data-testid="battle-results">Results</div>,
}));

vi.mock('./ComparisonBars', () => ({
  ComparisonBars: () => <div data-testid="comparison-bars">Bars</div>,
}));

vi.mock('./DeputySelector', () => ({
  DeputySelector: ({ label, onSelect }: { label: string; onSelect: (d: DeputyDetail) => void }) => (
    <div data-testid={`deputy-selector-${label}`}>
      <button onClick={() => onSelect(mockDeputy('sel-1', 'Selected'))}>Select {label}</button>
    </div>
  ),
}));

vi.mock('@/components/Parties', () => ({
  PartyComparison: () => <div data-testid="party-comparison">PartyComparison</div>,
}));

const mockComparison = {
  deputyA: { id: 'a', short_name: 'Dep A', party_acronym: 'PS' },
  deputyB: { id: 'b', short_name: 'Dep B', party_acronym: 'PSD' },
  winsA: 3,
  winsB: 2,
  winner: 'A',
  metrics: [],
};

vi.mock('../../services/battle/useCompareDeputies', () => ({
  useCompareDeputies: () => mockComparison,
}));

function mockDeputy(id: string, name: string): DeputyDetail {
  return {
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
  } as DeputyDetail;
}

import { BattleRoyale } from './BattleRoyale';

// Location observer — renders location into a data attribute we can read
function LocationObserver({ onLocation }: { onLocation: (loc: string) => void }) {
  const location = useLocation();
  onLocation(location.pathname + location.search);
  return <div data-testid="location">{location.pathname}</div>;
}

const renderBattleRoyale = (
  props: { initialDeputyA?: DeputyDetail | null; initialDeputyB?: DeputyDetail | null } = {},
  initialPath = '/batalha'
) => {
  let currentLocation = initialPath;
  const locations: string[] = [initialPath];

  const result = render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationObserver
        onLocation={(loc) => {
          currentLocation = loc;
          if (locations[locations.length - 1] !== loc) {
            locations.push(loc);
          }
        }}
      />
      <Routes>
        <Route path="*" element={<BattleRoyale {...props} />} />
      </Routes>
    </MemoryRouter>
  );

  return { ...result, getLocations: () => [...locations], getLocation: () => currentLocation };
};

describe('BattleRoyale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial rendering', () => {
    it('renders mode toggle buttons', () => {
      renderBattleRoyale();
      expect(screen.getByText('Deputados')).toBeInTheDocument();
      expect(screen.getByText('Partidos')).toBeInTheDocument();
    });

    it('renders deputy selectors in deputies mode', () => {
      renderBattleRoyale();
      expect(screen.getByTestId('deputy-selector-Deputado 1')).toBeInTheDocument();
      expect(screen.getByTestId('deputy-selector-Deputado 2')).toBeInTheDocument();
    });

    it('shows prompt to choose two deputies when none selected', () => {
      renderBattleRoyale();
      expect(screen.getByText('Escolhe dois deputados')).toBeInTheDocument();
    });
  });

  describe('With initial deputies from URL', () => {
    it('shows results immediately when both initial deputies are provided', () => {
      const deputyA = mockDeputy('a', 'Ana Silva');
      const deputyB = mockDeputy('b', 'Bruno Costa');

      renderBattleRoyale({ initialDeputyA: deputyA, initialDeputyB: deputyB });

      expect(screen.getByTestId('battle-results')).toBeInTheDocument();
      expect(screen.getByTestId('comparison-bars')).toBeInTheDocument();
    });

    it('shows reset button when results are displayed from URL', () => {
      const deputyA = mockDeputy('a', 'Ana Silva');
      const deputyB = mockDeputy('b', 'Bruno Costa');

      renderBattleRoyale({ initialDeputyA: deputyA, initialDeputyB: deputyB });

      expect(screen.getByText('Nova Batalha')).toBeInTheDocument();
    });

    it('does not show deputy selectors when results are displayed', () => {
      const deputyA = mockDeputy('a', 'Ana Silva');
      const deputyB = mockDeputy('b', 'Bruno Costa');

      renderBattleRoyale({ initialDeputyA: deputyA, initialDeputyB: deputyB });

      expect(screen.queryByTestId('deputy-selector-Deputado 1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('deputy-selector-Deputado 2')).not.toBeInTheDocument();
    });
  });

  describe('URL updates on comparison', () => {
    it('updates URL to comparison path when both initial deputies are provided', () => {
      const deputyA = mockDeputy('a', 'Ana Silva');
      const deputyB = mockDeputy('b', 'Bruno Costa');

      const { getLocations } = renderBattleRoyale(
        { initialDeputyA: deputyA, initialDeputyB: deputyB },
        '/batalha'
      );

      const locations = getLocations();
      const comparisonUrl = locations.find((l) => l.includes('/batalha/deputado/a/vs/b'));
      expect(comparisonUrl).toBeDefined();
    });

    it('updates URL back to /batalha when reset is clicked', async () => {
      const deputyA = mockDeputy('a', 'Ana Silva');
      const deputyB = mockDeputy('b', 'Bruno Costa');

      const { getLocations } = renderBattleRoyale(
        { initialDeputyA: deputyA, initialDeputyB: deputyB },
        '/batalha'
      );

      // Click reset
      await act(async () => {
        fireEvent.click(screen.getByText('Nova Batalha'));
      });

      const locations = getLocations();
      // After reset, URL should go back to /batalha
      const lastLocation = locations[locations.length - 1];
      expect(lastLocation).toBe('/batalha');
    });
  });

  describe('Mode switching', () => {
    it('shows PartyComparison in parties mode', () => {
      renderBattleRoyale();
      fireEvent.click(screen.getByText('Partidos'));
      expect(screen.getByTestId('party-comparison')).toBeInTheDocument();
    });

    it('hides deputy selectors in parties mode', () => {
      renderBattleRoyale();
      fireEvent.click(screen.getByText('Partidos'));
      expect(screen.queryByTestId('deputy-selector-Deputado 1')).not.toBeInTheDocument();
    });
  });
});

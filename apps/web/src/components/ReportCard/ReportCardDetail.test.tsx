import { describe, expect, it, mock, beforeAll, afterAll } from 'bun:test';
import { render, screen } from '@testing-library/react';
import {
  createMinimalDeputy,
  createMockDeputyDetail,
  createMockNationalAverages,
  createMockDeputyRole,
  createMockDeputyPartyHistory,
  createMockDeputyStatusHistory,
  createMockExtendedInfo,
  createTopPerformingDeputy,
  createLowPerformingDeputy,
  createDeputyWithNoAttendance,
  createDeputyWithZeroMeetings,
  createDeputyWithNoVotes,
  createExtendedInfoWithPartyChanges,
  createExtendedInfoWithMultipleRoles,
  createExtendedInfoWithStatusChanges,
} from '@/test/mocks/deputies';
import { ReportCardDetail } from './ReportCardDetail';

// Default feature flags mock
const defaultFlags = {
  wasteCalculator: false,
  downloadImage: false,
  averageDisplay: true,
  questionCount: false,
};

// Track current flags for dynamic mocking
let currentFlags = { ...defaultFlags };

// Mock the feature flags store
mock.module('@/store/useFeatureFlags', () => ({
  useFeatureFlags: () => ({
    flags: currentFlags,
  }),
}));

// Helper to reset flags before each test
function resetFlags() {
  currentFlags = { ...defaultFlags };
}

// Helper to set flags for specific tests
function setFlags(flags: Partial<typeof defaultFlags>) {
  currentFlags = { ...defaultFlags, ...flags };
}

describe('ReportCardDetail', () => {
  const mockAverages = createMockNationalAverages();

  describe('Header Section', () => {
    describe('Photo rendering', () => {
      it('should render deputy photo when photo_url is available', () => {
        const deputy = createMockDeputyDetail({
          photo_url: 'https://example.com/photo.jpg',
          short_name: 'João Silva',
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        const img = screen.getByRole('img');
        expect(img).toBeTruthy();
        expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
        expect(img.getAttribute('alt')).toBe('João Silva');
      });

      it('should render placeholder when photo_url is null', () => {
        const deputy = createMockDeputyDetail({
          photo_url: null,
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // Placeholder shows a "?" character
        expect(screen.getByText('?')).toBeTruthy();
        // Should not have an img element
        expect(screen.queryByRole('img')).toBeNull();
      });

      it('should render placeholder when photo_url is empty string', () => {
        const deputy = createMockDeputyDetail({
          photo_url: '',
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // Empty string is falsy, so should show placeholder
        expect(screen.getByText('?')).toBeTruthy();
      });
    });

    describe('Name rendering', () => {
      it('should render deputy short_name as heading', () => {
        const deputy = createMockDeputyDetail({
          short_name: 'Maria Santos',
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        const heading = screen.getByRole('heading', { name: 'Maria Santos' });
        expect(heading).toBeTruthy();
        expect(heading.tagName).toBe('H1');
      });

      it('should render deputy full name below short_name', () => {
        const deputy = createMockDeputyDetail({
          name: 'Maria José Alves Santos',
          short_name: 'Maria Santos',
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('Maria José Alves Santos')).toBeTruthy();
      });
    });

    describe('Party badge', () => {
      it('should render party acronym badge when party_acronym is available', () => {
        const deputy = createMockDeputyDetail({
          party_acronym: 'PS',
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('PS')).toBeTruthy();
      });

      it('should not render party badge when party_acronym is null', () => {
        const deputy = createMockDeputyDetail({
          party_acronym: null,
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // The party acronym should not appear in the header badge area
        // Note: party_acronym might still appear in other sections (Party Voting), so we check the header specifically
        const header = document.querySelector('.bg-linear-to-r');
        expect(header?.textContent).not.toContain('PS');
      });
    });

    describe('District rendering', () => {
      it('should render district name when district_name is available', () => {
        const deputy = createMockDeputyDetail({
          district_name: 'Lisboa',
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('Lisboa')).toBeTruthy();
      });

      it('should not render district when district_name is null', () => {
        const deputy = createMockDeputyDetail({
          district_name: null,
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // Ensure no district text is rendered in header
        expect(screen.queryByText('Lisboa')).toBeNull();
      });
    });

    describe('Biography badges', () => {
      describe('Profession badge', () => {
        it('should render profession badge when profession is available', () => {
          const deputy = createMockDeputyDetail({
            profession: 'Advogado',
          });

          render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

          expect(screen.getByText('Advogado')).toBeTruthy();
        });

        it('should not render profession badge when profession is null', () => {
          const deputy = createMockDeputyDetail({
            profession: null,
          });

          render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

          expect(screen.queryByText('Advogado')).toBeNull();
        });
      });

      describe('Education badge', () => {
        it('should render education badge when education is available', () => {
          const deputy = createMockDeputyDetail({
            education: 'Licenciatura em Direito',
          });

          render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

          expect(screen.getByText('Licenciatura em Direito')).toBeTruthy();
        });

        it('should not render education badge when education is null', () => {
          const deputy = createMockDeputyDetail({
            education: null,
          });

          render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

          expect(screen.queryByText('Licenciatura em Direito')).toBeNull();
        });
      });

      it('should render both profession and education badges when both are available', () => {
        const deputy = createMockDeputyDetail({
          profession: 'Médico',
          education: 'Mestrado em Medicina',
        });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('Médico')).toBeTruthy();
        expect(screen.getByText('Mestrado em Medicina')).toBeTruthy();
      });

      it('should not render biography badges section when both profession and education are null', () => {
        const deputy = createMockDeputyDetail({
          profession: null,
          education: null,
        });

        const { container } = render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // The biography badges wrapper should not exist
        const header = container.querySelector('.bg-linear-to-r');
        const badgeWrappers = header?.querySelectorAll('.flex.flex-wrap');

        // The only flex-wrap in header should be for party/district, not biography badges
        // Biography badges have a specific mt-3 class
        const biographyBadges = header?.querySelector('.mt-3.flex.flex-wrap');
        expect(biographyBadges).toBeNull();
      });
    });

    describe('Minimal deputy (fallbacks)', () => {
      it('should render correctly with minimal data', () => {
        const deputy = createMinimalDeputy();

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // Should show placeholder for photo
        expect(screen.getByText('?')).toBeTruthy();

        // Should still show name
        expect(screen.getByRole('heading', { name: deputy.short_name })).toBeTruthy();
        expect(screen.getByText(deputy.name)).toBeTruthy();
      });
    });
  });

  describe('Grade Section', () => {
    beforeAll(() => resetFlags());

    describe('GradeCircle rendering', () => {
      it('should render the grade section heading', () => {
        const deputy = createMockDeputyDetail();

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByRole('heading', { name: /Classificacao/i })).toBeTruthy();
      });

      it('should render GradeCircle with deputy grade', () => {
        const deputy = createMockDeputyDetail({ grade: 'A' });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // GradeCircle renders the grade letter
        expect(screen.getByText('A')).toBeTruthy();
      });

      it('should render GradeCircle with deputy work score', () => {
        const deputy = createMockDeputyDetail({ work_score: 85.3 });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // GradeCircle renders the score with "pts" suffix (rounded)
        expect(screen.getByText('85 pts')).toBeTruthy();
      });

      it('should render GradeCircle with "Pontuacao" label', () => {
        const deputy = createMockDeputyDetail();

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('Pontuacao')).toBeTruthy();
      });
    });

    describe('Rank displays', () => {
      it('should render national rank', () => {
        const deputy = createMockDeputyDetail({ national_rank: 45 });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('#45')).toBeTruthy();
        expect(screen.getByText('nacional')).toBeTruthy();
      });

      it('should render district rank', () => {
        const deputy = createMockDeputyDetail({ district_rank: 12 });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('#12')).toBeTruthy();
        expect(screen.getByText('no distrito')).toBeTruthy();
      });

      it('should render high ranks for top-performing deputies', () => {
        const deputy = createTopPerformingDeputy();

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('#1')).toBeTruthy();
        expect(screen.getByText('A')).toBeTruthy();
      });

      it('should render low ranks for low-performing deputies', () => {
        const deputy = createLowPerformingDeputy();

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('#230')).toBeTruthy();
        expect(screen.getByText('F')).toBeTruthy();
      });
    });
  });

  describe('Metrics Section', () => {
    beforeAll(() => resetFlags());

    describe('Section rendering', () => {
      it('should render the metrics section heading', () => {
        const deputy = createMockDeputyDetail();

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('Atividade Parlamentar')).toBeTruthy();
      });
    });

    describe('Proposals metric', () => {
      it('should render proposals label', () => {
        const deputy = createMockDeputyDetail();

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('Propostas apresentadas')).toBeTruthy();
      });

      it('should render proposals count', () => {
        const deputy = createMockDeputyDetail({ proposal_count: 15 });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // MetricBar renders the value as rounded integer
        expect(screen.getByText('15')).toBeTruthy();
      });

      it('should show above average indicator when proposals exceed average', () => {
        const deputy = createMockDeputyDetail({ proposal_count: 25 }); // Avg is 12.5

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // Should show "acima" text
        expect(screen.getByText(/acima/)).toBeTruthy();
      });

      it('should show below average indicator when proposals are below average', () => {
        const deputy = createMockDeputyDetail({ proposal_count: 5 }); // Avg is 12.5

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // Should show "abaixo" text
        expect(screen.getByText(/abaixo/)).toBeTruthy();
      });
    });

    describe('Interventions metric', () => {
      it('should render interventions label', () => {
        const deputy = createMockDeputyDetail();

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        expect(screen.getByText('Intervencoes em debates')).toBeTruthy();
      });

      it('should render interventions count', () => {
        const deputy = createMockDeputyDetail({ intervention_count: 42 });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // MetricBar renders the value as rounded integer
        expect(screen.getByText('42')).toBeTruthy();
      });
    });

    describe('Questions metric (feature flag controlled)', () => {
      it('should NOT render questions section when questionCount flag is false', () => {
        resetFlags();
        setFlags({ questionCount: false });
        const deputy = createMockDeputyDetail({ question_count: 8 });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // Should NOT find the questions label
        expect(screen.queryByText('Perguntas ao Governo')).toBeNull();
      });

      it('should render questions section when questionCount flag is true', () => {
        resetFlags();
        setFlags({ questionCount: true });
        const deputy = createMockDeputyDetail({ question_count: 8 });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // Should find the questions label
        expect(screen.getByText('Perguntas ao Governo')).toBeTruthy();
      });

      it('should render questions count when flag is enabled', () => {
        resetFlags();
        setFlags({ questionCount: true });
        const deputy = createMockDeputyDetail({ question_count: 10 });

        render(<ReportCardDetail deputy={deputy} averages={mockAverages} />);

        // MetricBar renders the value as rounded integer
        expect(screen.getByText('10')).toBeTruthy();
      });
    });

    describe('Averages comparison', () => {
      it('should use national averages for metric comparisons', () => {
        const averages = createMockNationalAverages({
          avg_proposals: 20.0,
          avg_interventions: 50.0,
        });
        const deputy = createMockDeputyDetail({
          proposal_count: 10, // Below avg of 20
          intervention_count: 25, // Below avg of 50
        });

        render(<ReportCardDetail deputy={deputy} averages={averages} />);

        // Both metrics should show "abaixo" text (below average)
        const belowTexts = screen.getAllByText(/abaixo/);
        expect(belowTexts.length).toBeGreaterThanOrEqual(2);
      });

      it('should handle null averages gracefully', () => {
        const deputy = createMockDeputyDetail({
          proposal_count: 15,
          intervention_count: 42,
        });

        // Should not throw with null averages
        render(<ReportCardDetail deputy={deputy} averages={null} />);

        // Component should still render
        expect(screen.getByText('15')).toBeTruthy();
        expect(screen.getByText('42')).toBeTruthy();
      });

      it('should display average values in MetricBar', () => {
        const averages = createMockNationalAverages({
          avg_proposals: 12.5,
        });
        const deputy = createMockDeputyDetail({ proposal_count: 15 });

        render(<ReportCardDetail deputy={deputy} averages={averages} />);

        // MetricBar shows average in the format "(12)"
        expect(screen.getByText(/12/)).toBeTruthy();
      });
    });
  });

  describe('Attendance Section', () => {
    beforeAll(() => resetFlags());

    describe('Conditional rendering', () => {
      it('should render attendance section when meetings_total > 0', () => {
        const deputy = createMockDeputyDetail({
          attendance_rate: 92.5,
          meetings_attended: 74,
          meetings_total: 80,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Section heading should be rendered
        expect(screen.getByText('Presenca em Plenario')).toBeTruthy();
      });

      it('should NOT render attendance section when meetings_total is 0', () => {
        const deputy = createDeputyWithZeroMeetings();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Section heading should NOT be rendered
        expect(screen.queryByText('Presenca em Plenario')).toBeNull();
      });

      it('should NOT render attendance section when meetings_total is null', () => {
        const deputy = createDeputyWithNoAttendance();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Section heading should NOT be rendered
        expect(screen.queryByText('Presenca em Plenario')).toBeNull();
      });

      it('should NOT render attendance section when attendance_rate is null', () => {
        const deputy = createMockDeputyDetail({
          attendance_rate: null,
          meetings_attended: 74,
          meetings_total: 80,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Section heading should NOT be rendered
        expect(screen.queryByText('Presenca em Plenario')).toBeNull();
      });
    });

    describe('Attendance data display', () => {
      it('should display meetings attended and total in label', () => {
        const deputy = createMockDeputyDetail({
          attendance_rate: 92.5,
          meetings_attended: 74,
          meetings_total: 80,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText('Presente em 74 de 80 sessoes')).toBeTruthy();
      });

      it('should handle zero meetings_attended gracefully', () => {
        const deputy = createMockDeputyDetail({
          attendance_rate: 0,
          meetings_attended: null,
          meetings_total: 80,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Should use 0 as fallback for null meetings_attended
        expect(screen.getByText('Presente em 0 de 80 sessoes')).toBeTruthy();
      });

      it('should render with percentage mode for MetricBar', () => {
        const deputy = createMockDeputyDetail({
          attendance_rate: 92.5,
          meetings_attended: 74,
          meetings_total: 80,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // MetricBar in percentage mode should display the percentage
        // The value is rendered as "92" (rounded)
        expect(screen.getByText('92')).toBeTruthy();
      });

      it('should compare attendance rate with national average', () => {
        const deputy = createMockDeputyDetail({
          attendance_rate: 95.0, // Above avg of 85.0
          meetings_attended: 76,
          meetings_total: 80,
        });
        const averages = createMockNationalAverages({ avg_attendance: 85.0 });

        render(<ReportCardDetail deputy={deputy} averages={averages} />);

        // Should show "acima" text for above-average attendance
        expect(screen.getByText(/acima/)).toBeTruthy();
      });

      it('should show below average indicator for low attendance', () => {
        const deputy = createMockDeputyDetail({
          attendance_rate: 70.0, // Below avg of 85.0
          meetings_attended: 56,
          meetings_total: 80,
        });
        const averages = createMockNationalAverages({ avg_attendance: 85.0 });

        render(<ReportCardDetail deputy={deputy} averages={averages} />);

        // Should show "abaixo" text for below-average attendance
        expect(screen.getByText(/abaixo/)).toBeTruthy();
      });
    });
  });

  describe('Party Voting Section', () => {
    beforeAll(() => resetFlags());

    describe('Section rendering', () => {
      it('should render party voting section heading with party acronym', () => {
        const deputy = createMockDeputyDetail({
          party_acronym: 'PS',
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText('Votacoes do Partido (PS)')).toBeTruthy();
      });

      it('should render all three voting categories', () => {
        const deputy = createMockDeputyDetail();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText('A favor')).toBeTruthy();
        expect(screen.getByText('Contra')).toBeTruthy();
        expect(screen.getByText('Abstencao')).toBeTruthy();
      });
    });

    describe('Percentage calculations', () => {
      it('should calculate favor percentage correctly', () => {
        const deputy = createMockDeputyDetail({
          party_votes_favor: 120,
          party_votes_against: 15,
          party_votes_abstain: 10,
          party_total_votes: 145,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // (120 / 145) * 100 = 82.76... -> 82.8%
        expect(screen.getByText('82.8%')).toBeTruthy();
      });

      it('should calculate against percentage correctly', () => {
        const deputy = createMockDeputyDetail({
          party_votes_favor: 120,
          party_votes_against: 15,
          party_votes_abstain: 10,
          party_total_votes: 145,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // (15 / 145) * 100 = 10.34... -> 10.3%
        expect(screen.getByText('10.3%')).toBeTruthy();
      });

      it('should calculate abstain percentage correctly', () => {
        const deputy = createMockDeputyDetail({
          party_votes_favor: 120,
          party_votes_against: 15,
          party_votes_abstain: 10,
          party_total_votes: 145,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // (10 / 145) * 100 = 6.89... -> 6.9%
        expect(screen.getByText('6.9%')).toBeTruthy();
      });

      it('should handle zero total votes without division error', () => {
        const deputy = createDeputyWithNoVotes();

        // Should not throw with zero votes
        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // All percentages should be 0.0%
        const zeroPercentages = screen.getAllByText('0.0%');
        expect(zeroPercentages.length).toBe(3);
      });

      it('should handle null vote values gracefully', () => {
        const deputy = createMockDeputyDetail({
          party_votes_favor: null as unknown as number,
          party_votes_against: null as unknown as number,
          party_votes_abstain: null as unknown as number,
          party_total_votes: 100,
        });

        // Should not throw with null values
        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Component should render
        expect(screen.getByText('Votacoes do Partido (PS)')).toBeTruthy();
      });
    });

    describe('Vote counts display', () => {
      it('should display favor vote count', () => {
        const deputy = createMockDeputyDetail({
          party_votes_favor: 120,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText('120 votos')).toBeTruthy();
      });

      it('should display against vote count', () => {
        const deputy = createMockDeputyDetail({
          party_votes_against: 15,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText('15 votos')).toBeTruthy();
      });

      it('should display abstain vote count', () => {
        const deputy = createMockDeputyDetail({
          party_votes_abstain: 10,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText('10 votos')).toBeTruthy();
      });

      it('should display zero vote counts for deputy with no votes', () => {
        const deputy = createDeputyWithNoVotes();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // All should show "0 votos"
        const zeroVotes = screen.getAllByText('0 votos');
        expect(zeroVotes.length).toBe(3);
      });
    });
  });

  describe('Extended Info Section', () => {
    beforeAll(() => resetFlags());

    describe('Conditional rendering', () => {
      it('should NOT render extended info sections when extendedInfo is undefined', () => {
        const deputy = createMockDeputyDetail();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // None of the extended info sections should be rendered
        expect(screen.queryByText('Cargos e Funcoes')).toBeNull();
        expect(screen.queryByText('Historico Partidario')).toBeNull();
        expect(screen.queryByText('Historico de Situacao')).toBeNull();
      });

      it('should NOT render extended info sections when extendedInfo is null', () => {
        const deputy = createMockDeputyDetail();

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={null} />
        );

        // None of the extended info sections should be rendered
        expect(screen.queryByText('Cargos e Funcoes')).toBeNull();
        expect(screen.queryByText('Historico Partidario')).toBeNull();
        expect(screen.queryByText('Historico de Situacao')).toBeNull();
      });
    });

    describe('Roles/Positions Section', () => {
      it('should render roles section when roles array has entries', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          roles: [createMockDeputyRole()],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.getByText('Cargos e Funcoes')).toBeTruthy();
      });

      it('should NOT render roles section when roles array is empty', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          roles: [],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.queryByText('Cargos e Funcoes')).toBeNull();
      });

      it('should display role name for each role', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          roles: [
            createMockDeputyRole({ role_name: 'Vice-Presidente da Comissão de Economia' }),
            createMockDeputyRole({ id: 'role-2', role_name: 'Membro da Comissão de Orçamento' }),
          ],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.getByText('Vice-Presidente da Comissão de Economia')).toBeTruthy();
        expect(screen.getByText('Membro da Comissão de Orçamento')).toBeTruthy();
      });

      it('should display date range for roles', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          roles: [
            createMockDeputyRole({
              role_name: 'Secretário de Mesa',
              start_date: '2024-03-26',
              end_date: null,
            }),
          ],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // The formatDate function formats dates as "Mar 2024" and null as "presente"
        expect(screen.getByText(/mar.* 2024 - presente/i)).toBeTruthy();
      });

      it('should display closed date range for ended roles', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          roles: [
            createMockDeputyRole({
              role_name: 'Líder Parlamentar',
              start_date: '2022-03-01',
              end_date: '2024-03-26',
            }),
          ],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Both dates should be formatted
        expect(screen.getByText(/mar.* 2022 - mar.* 2024/i)).toBeTruthy();
      });

      it('should render multiple roles from createExtendedInfoWithMultipleRoles', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createExtendedInfoWithMultipleRoles();

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.getByText('Vice-Presidente da Comissão de Economia')).toBeTruthy();
        expect(screen.getByText('Membro da Comissão de Orçamento')).toBeTruthy();
      });
    });

    describe('Party History Section', () => {
      it('should NOT render party history section when partyHistory has only 1 entry', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          partyHistory: [createMockDeputyPartyHistory()],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Party history should NOT show when there's only 1 entry
        expect(screen.queryByText('Historico Partidario')).toBeNull();
      });

      it('should render party history section when partyHistory has more than 1 entry', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createExtendedInfoWithPartyChanges();

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.getByText('Historico Partidario')).toBeTruthy();
      });

      it('should NOT render party history section when partyHistory is empty', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          partyHistory: [],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.queryByText('Historico Partidario')).toBeNull();
      });

      it('should display party acronyms for each party history entry', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          partyHistory: [
            createMockDeputyPartyHistory({ id: 'ph-1', party_acronym: 'PSD' }),
            createMockDeputyPartyHistory({ id: 'ph-2', party_acronym: 'IL' }),
          ],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.getByText('PSD')).toBeTruthy();
        expect(screen.getByText('IL')).toBeTruthy();
      });

      it('should display date ranges for party history entries', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          partyHistory: [
            createMockDeputyPartyHistory({
              id: 'ph-1',
              party_acronym: 'PSD',
              start_date: '2020-10-25',
              end_date: '2022-06-15',
            }),
            createMockDeputyPartyHistory({
              id: 'ph-2',
              party_acronym: 'IL',
              start_date: '2022-06-16',
              end_date: null,
            }),
          ],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Closed date range for first party
        expect(screen.getByText(/out.* 2020 - jun.* 2022/i)).toBeTruthy();
        // Open date range for current party
        expect(screen.getByText(/jun.* 2022 - presente/i)).toBeTruthy();
      });

      it('should render party history from createExtendedInfoWithPartyChanges helper', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createExtendedInfoWithPartyChanges();

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Should show both party acronyms from the helper
        expect(screen.getByText('PSD')).toBeTruthy();
        expect(screen.getByText('IL')).toBeTruthy();
      });
    });

    describe('Status History Section', () => {
      it('should render status history section when statusHistory has entries', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          statusHistory: [createMockDeputyStatusHistory()],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.getByText('Historico de Situacao')).toBeTruthy();
      });

      it('should NOT render status history section when statusHistory is empty', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          statusHistory: [],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.queryByText('Historico de Situacao')).toBeNull();
      });

      it('should display status name for each status history entry', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          statusHistory: [
            createMockDeputyStatusHistory({ id: 'sh-1', status: 'Efetivo' }),
            createMockDeputyStatusHistory({ id: 'sh-2', status: 'Suspenso' }),
          ],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.getByText('Efetivo')).toBeTruthy();
        expect(screen.getByText('Suspenso')).toBeTruthy();
      });

      it('should display date ranges for status history entries', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          statusHistory: [
            createMockDeputyStatusHistory({
              id: 'sh-1',
              status: 'Efetivo',
              start_date: '2024-03-26',
              end_date: null,
            }),
          ],
        });

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        expect(screen.getByText(/mar.* 2024 - presente/i)).toBeTruthy();
      });

      it('should render multiple status entries with varied dates', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createExtendedInfoWithStatusChanges();

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Should render all three status entries
        expect(screen.getAllByText('Efetivo').length).toBe(2);
        expect(screen.getByText('Suspenso')).toBeTruthy();
      });

      it('should apply correct color indicator for "Efetivo" status', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          statusHistory: [createMockDeputyStatusHistory({ status: 'Efetivo' })],
        });

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // The "Efetivo" status should have a green (success) indicator
        const statusIndicator = container.querySelector('.bg-success-9');
        expect(statusIndicator).toBeTruthy();
      });

      it('should apply correct color indicator for "Suspenso" status', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          statusHistory: [createMockDeputyStatusHistory({ status: 'Suspenso' })],
        });

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // The "Suspenso" status should have a yellow (warning) indicator
        const statusIndicator = container.querySelector('.bg-warning-9');
        expect(statusIndicator).toBeTruthy();
      });

      it('should apply neutral color indicator for other status types', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          statusHistory: [createMockDeputyStatusHistory({ status: 'Renunciou' })],
        });

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Other statuses should have a neutral indicator
        const statusIndicator = container.querySelector('.bg-neutral-9');
        expect(statusIndicator).toBeTruthy();
      });

      it('should handle case-insensitive status matching for color indicators', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = createMockExtendedInfo({
          statusHistory: [
            createMockDeputyStatusHistory({ id: 'sh-1', status: 'EFETIVO' }),
            createMockDeputyStatusHistory({ id: 'sh-2', status: 'suspenso temporariamente' }),
          ],
        });

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Both should use the correct color indicators despite case differences
        expect(container.querySelector('.bg-success-9')).toBeTruthy();
        expect(container.querySelector('.bg-warning-9')).toBeTruthy();
      });
    });

    describe('All extended info sections together', () => {
      it('should render all extended info sections when all have data', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = {
          roles: [
            createMockDeputyRole({ role_name: 'Presidente da Comissão' }),
          ],
          partyHistory: [
            createMockDeputyPartyHistory({ id: 'ph-1', party_acronym: 'PS' }),
            createMockDeputyPartyHistory({ id: 'ph-2', party_acronym: 'PSD' }),
          ],
          statusHistory: [
            createMockDeputyStatusHistory({ status: 'Efetivo' }),
          ],
        };

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // All sections should be rendered
        expect(screen.getByText('Cargos e Funcoes')).toBeTruthy();
        expect(screen.getByText('Historico Partidario')).toBeTruthy();
        expect(screen.getByText('Historico de Situacao')).toBeTruthy();

        // And their content
        expect(screen.getByText('Presidente da Comissão')).toBeTruthy();
        expect(screen.getByText('PS')).toBeTruthy();
        expect(screen.getByText('PSD')).toBeTruthy();
        expect(screen.getByText('Efetivo')).toBeTruthy();
      });

      it('should only render sections with data, skipping empty ones', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = {
          roles: [], // Empty - should not render
          partyHistory: [
            createMockDeputyPartyHistory({ id: 'ph-1', party_acronym: 'PS' }),
            createMockDeputyPartyHistory({ id: 'ph-2', party_acronym: 'BE' }),
          ], // 2 entries - should render
          statusHistory: [], // Empty - should not render
        };

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Only party history should be rendered
        expect(screen.queryByText('Cargos e Funcoes')).toBeNull();
        expect(screen.getByText('Historico Partidario')).toBeTruthy();
        expect(screen.queryByText('Historico de Situacao')).toBeNull();
      });

      it('should skip party history when only 1 entry exists but render other sections', () => {
        const deputy = createMockDeputyDetail();
        const extendedInfo = {
          roles: [
            createMockDeputyRole({ role_name: 'Secretário' }),
          ],
          partyHistory: [
            createMockDeputyPartyHistory({ party_acronym: 'PS' }),
          ], // Only 1 entry - should NOT render
          statusHistory: [
            createMockDeputyStatusHistory({ status: 'Efetivo' }),
          ],
        };

        render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} extendedInfo={extendedInfo} />
        );

        // Roles and status history should render, but not party history
        expect(screen.getByText('Cargos e Funcoes')).toBeTruthy();
        expect(screen.queryByText('Historico Partidario')).toBeNull();
        expect(screen.getByText('Historico de Situacao')).toBeTruthy();
      });
    });
  });

  describe('Biography Section', () => {
    beforeAll(() => resetFlags());

    describe('Conditional rendering', () => {
      it('should render biography section when bio_narrative exists', () => {
        const deputy = createMockDeputyDetail({
          bio_narrative: 'Esta é uma biografia de teste do deputado.',
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText('Biografia')).toBeTruthy();
      });

      it('should NOT render biography section when bio_narrative is null', () => {
        const deputy = createMockDeputyDetail({
          bio_narrative: null,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.queryByText('Biografia')).toBeNull();
      });

      it('should NOT render biography section when bio_narrative is undefined', () => {
        const deputy = createMinimalDeputy();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.queryByText('Biografia')).toBeNull();
      });

      it('should NOT render biography section when bio_narrative is empty string', () => {
        const deputy = createMockDeputyDetail({
          bio_narrative: '',
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Empty string is falsy, so should not render
        expect(screen.queryByText('Biografia')).toBeNull();
      });
    });

    describe('Biography content display', () => {
      it('should display the full bio_narrative text', () => {
        const bioText = 'João Silva Santos é um deputado experiente com mais de 10 anos de carreira política.';
        const deputy = createMockDeputyDetail({
          bio_narrative: bioText,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText(bioText)).toBeTruthy();
      });

      it('should display long biography text correctly', () => {
        const longBio =
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
        const deputy = createMockDeputyDetail({
          bio_narrative: longBio,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText(longBio)).toBeTruthy();
      });
    });

    describe('Biography source indicator', () => {
      it('should display source indicator showing scraper as source type', () => {
        const deputy = createMockDeputyDetail({
          bio_narrative: 'Biografia do deputado.',
          biography_source_url: 'https://www.parlamento.pt/deputado/bio',
        });

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />
        );

        // Find the biography section and check for the Globe icon (scraper indicator)
        const biographySection = screen.getByText('Biografia').closest('div');
        expect(biographySection).toBeTruthy();

        // The source indicator should be present in the header
        const sourceIndicator = container.querySelector('a[href="https://www.parlamento.pt/deputado/bio"]');
        expect(sourceIndicator).toBeTruthy();
      });

      it('should render external link when biography_source_url is provided', () => {
        const deputy = createMockDeputyDetail({
          bio_narrative: 'Biografia do deputado.',
          biography_source_url: 'https://www.parlamento.pt/deputado/12345/bio',
        });

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />
        );

        // Check for external link in the biography section
        const externalLink = container.querySelector(
          'a[href="https://www.parlamento.pt/deputado/12345/bio"]'
        );
        expect(externalLink).toBeTruthy();
        expect(externalLink?.getAttribute('target')).toBe('_blank');
        expect(externalLink?.getAttribute('rel')).toBe('noopener noreferrer');
      });

      it('should NOT render external link when biography_source_url is null', () => {
        const deputy = createMockDeputyDetail({
          bio_narrative: 'Biografia do deputado.',
          biography_source_url: null,
        });

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />
        );

        // Find the biography section
        const biographyHeading = screen.getByText('Biografia');
        const biographyContainer = biographyHeading.closest('div');

        // Check that there is no external link in this section
        // The SourceIndicator should not render the <a> element when sourceUrl is null
        const sourceIndicatorSpan = biographyContainer?.querySelector('.text-xs.text-neutral-9');
        if (sourceIndicatorSpan) {
          // Should not have an anchor inside
          const anchor = sourceIndicatorSpan.querySelector('a');
          expect(anchor).toBeNull();
        }
      });
    });
  });

  describe('Data Sources Footer', () => {
    beforeAll(() => resetFlags());

    describe('Footer rendering', () => {
      it('should always render the data sources footer', () => {
        const deputy = createMockDeputyDetail();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Footer should contain API source description
        expect(screen.getByText('API: Dados base, votos')).toBeTruthy();
        // Footer should contain Scraper source description
        expect(screen.getByText('Scraper: Presenca, biografia')).toBeTruthy();
      });

      it('should render footer even for minimal deputy', () => {
        const deputy = createMinimalDeputy();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        expect(screen.getByText('API: Dados base, votos')).toBeTruthy();
        expect(screen.getByText('Scraper: Presenca, biografia')).toBeTruthy();
      });
    });

    describe('Last synced date display', () => {
      it('should display formatted last_synced_at date when available', () => {
        const deputy = createMockDeputyDetail({
          last_synced_at: '2024-10-15T08:00:00Z',
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // The formatDate function converts to "oct 2024" format (Portuguese locale)
        expect(screen.getByText(/Atualizado:/)).toBeTruthy();
        expect(screen.getByText(/out.* 2024/i)).toBeTruthy();
      });

      it('should NOT display Atualizado when last_synced_at is null', () => {
        const deputy = createMockDeputyDetail({
          last_synced_at: null,
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // The "Atualizado:" text should not appear
        expect(screen.queryByText(/Atualizado:/)).toBeNull();
      });

      it('should display different date formats correctly', () => {
        const deputy = createMockDeputyDetail({
          last_synced_at: '2024-03-01T14:30:00Z',
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // March 2024 in Portuguese
        expect(screen.getByText(/mar.* 2024/i)).toBeTruthy();
      });

      it('should display date from earlier years correctly', () => {
        const deputy = createMockDeputyDetail({
          last_synced_at: '2023-12-25T10:00:00Z',
        });

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // December 2023 in Portuguese
        expect(screen.getByText(/dez.* 2023/i)).toBeTruthy();
      });
    });

    describe('Footer structure', () => {
      it('should have proper footer styling with bg-neutral-2', () => {
        const deputy = createMockDeputyDetail();

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />
        );

        // Find the footer element
        const footer = container.querySelector('.bg-neutral-2.p-4.border-t.border-neutral-5');
        expect(footer).toBeTruthy();
      });

      it('should contain both source icons (Database and Globe)', () => {
        const deputy = createMockDeputyDetail();

        const { container } = render(
          <ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />
        );

        // Find footer and check for both icon types (both Database and Globe should be present)
        const footer = container.querySelector('.p-4.border-t.border-neutral-5.bg-neutral-2');
        expect(footer).toBeTruthy();

        // Both icons should render as SVG elements with specific classes
        const svgIcons = footer?.querySelectorAll('svg');
        expect(svgIcons?.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Integration with minimal deputy', () => {
      it('should render footer but without Atualizado for minimal deputy', () => {
        const deputy = createMinimalDeputy();

        render(<ReportCardDetail deputy={deputy} averages={createMockNationalAverages()} />);

        // Footer sources should still render
        expect(screen.getByText('API: Dados base, votos')).toBeTruthy();
        expect(screen.getByText('Scraper: Presenca, biografia')).toBeTruthy();

        // But Atualizado should not render since last_synced_at is null
        expect(screen.queryByText(/Atualizado:/)).toBeNull();
      });
    });
  });
});

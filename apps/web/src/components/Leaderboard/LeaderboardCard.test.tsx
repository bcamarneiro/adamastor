import { describe, expect, it, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import type { DeputyDetail } from '../../lib/supabase';
import { LeaderboardCard } from './LeaderboardCard';

// Mock react-router-dom Link
mock.module('react-router-dom', () => ({
  Link: ({
    to,
    children,
    className,
  }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className} data-testid="leaderboard-link">
      {children}
    </a>
  ),
}));

const mockDeputy: DeputyDetail = {
  id: '123',
  external_id: '1234',
  name: 'João Silva Santos',
  short_name: 'João Silva',
  party_acronym: 'PS',
  party_name: 'Partido Socialista',
  party_color: '#FF0000',
  district_name: 'Lisboa',
  district_slug: 'lisboa',
  photo_url: 'https://example.com/photo.jpg',
  grade: 'A',
  work_score: 85,
  national_rank: 1,
  district_rank: 1,
  party_id: 'party-1',
  district_id: 'district-1',
  legislature: 16,
  is_active: true,
  proposal_count: 10,
  intervention_count: 20,
  question_count: 5,
  party_votes_favor: 100,
  party_votes_against: 10,
  party_votes_abstain: 5,
  party_total_votes: 115,
  mandate_start: '2024-01-01',
  mandate_end: null,
  // Attendance
  attendance_rate: null,
  meetings_attended: null,
  meetings_total: null,
  // Biography
  birth_date: null,
  profession: null,
  education: null,
  bio_narrative: null,
  biography_source_url: null,
  biography_scraped_at: null,
  // Source tracking
  last_synced_at: null,
  deputy_source_url: null,
  deputy_source_type: null,
  deputy_source_name: null,
};

describe('LeaderboardCard', () => {
  it('should render deputy name', () => {
    render(<LeaderboardCard deputy={mockDeputy} position={1} />);
    expect(screen.getByText('João Silva')).toBeTruthy();
  });

  it('should render deputy party acronym', () => {
    render(<LeaderboardCard deputy={mockDeputy} position={1} />);
    expect(screen.getByText('PS')).toBeTruthy();
  });

  it('should render deputy district', () => {
    render(<LeaderboardCard deputy={mockDeputy} position={1} />);
    expect(screen.getByText('Lisboa')).toBeTruthy();
  });

  it('should render deputy photo when available', () => {
    render(<LeaderboardCard deputy={mockDeputy} position={1} />);
    const img = screen.getByRole('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
    expect(img.getAttribute('alt')).toBe('João Silva');
  });

  it('should render placeholder when no photo', () => {
    const deputyNoPhoto = { ...mockDeputy, photo_url: null };
    render(<LeaderboardCard deputy={deputyNoPhoto} position={1} />);
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('should link to deputy page', () => {
    render(<LeaderboardCard deputy={mockDeputy} position={1} />);
    const link = screen.getByTestId('leaderboard-link');
    expect(link.getAttribute('href')).toBe('/deputado/123');
  });

  describe('position badges for top workers', () => {
    it('should show gold medal for position 1', () => {
      render(<LeaderboardCard deputy={mockDeputy} position={1} isTop={true} />);
      expect(screen.getByText('🥇')).toBeTruthy();
    });

    it('should show silver medal for position 2', () => {
      render(<LeaderboardCard deputy={mockDeputy} position={2} isTop={true} />);
      expect(screen.getByText('🥈')).toBeTruthy();
    });

    it('should show bronze medal for position 3', () => {
      render(<LeaderboardCard deputy={mockDeputy} position={3} isTop={true} />);
      expect(screen.getByText('🥉')).toBeTruthy();
    });
  });

  describe('position badge for bottom workers', () => {
    it('should show sleepy emoji for bottom workers', () => {
      render(<LeaderboardCard deputy={mockDeputy} position={1} isTop={false} />);
      expect(screen.getByText('💤')).toBeTruthy();
    });
  });

  it('should apply success border for top workers', () => {
    const { container } = render(<LeaderboardCard deputy={mockDeputy} position={1} isTop={true} />);
    const link = container.querySelector('a');
    expect(link?.className).toContain('border-success-6');
  });

  it('should apply danger border for bottom workers', () => {
    const { container } = render(
      <LeaderboardCard deputy={mockDeputy} position={1} isTop={false} />
    );
    const link = container.querySelector('a');
    expect(link?.className).toContain('border-danger-6');
  });

  it('should render GradeCircle with correct values', () => {
    render(<LeaderboardCard deputy={mockDeputy} position={1} />);
    // GradeCircle should show the grade
    expect(screen.getByText('A')).toBeTruthy();
    // And the score rounded
    expect(screen.getByText('85 pts')).toBeTruthy();
  });
});

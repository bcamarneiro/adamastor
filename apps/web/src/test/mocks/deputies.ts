import type {
  DeputyDetail,
  DeputyPartyHistory,
  DeputyRole,
  DeputyStatusHistory,
  NationalAverages,
} from '../../lib/supabase';

/**
 * Factory function to create mock DeputyDetail objects.
 * Provides sensible defaults while allowing partial overrides for testing various scenarios.
 */
export function createMockDeputyDetail(overrides: Partial<DeputyDetail> = {}): DeputyDetail {
  return {
    // Base identification
    id: 'deputy-1',
    external_id: '12345',
    name: 'João Manuel Silva Santos',
    short_name: 'João Silva',
    photo_url: 'https://example.com/photos/joao-silva.jpg',
    is_active: true,
    mandate_start: '2024-03-26',
    mandate_end: null,
    legislature: 16,

    // Party information
    party_id: 'party-ps',
    party_acronym: 'PS',
    party_name: 'Partido Socialista',
    party_color: '#FF6B9D',

    // District information
    district_id: 'district-lisboa',
    district_name: 'Lisboa',
    district_slug: 'lisboa',

    // Activity metrics
    proposal_count: 15,
    intervention_count: 42,
    question_count: 8,

    // Voting data
    party_votes_favor: 120,
    party_votes_against: 15,
    party_votes_abstain: 10,
    party_total_votes: 145,

    // Scoring
    work_score: 78.5,
    grade: 'B',
    national_rank: 45,
    district_rank: 12,

    // Attendance
    attendance_rate: 92.5,
    meetings_attended: 74,
    meetings_total: 80,

    // Biography
    birth_date: '1975-06-15',
    profession: 'Advogado',
    education: 'Licenciatura em Direito',
    bio_narrative:
      'João Silva Santos é um deputado experiente com mais de 10 anos de carreira política. Licenciado em Direito pela Universidade de Lisboa, dedicou-se à advocacia antes de ingressar na política.',
    biography_source_url: 'https://www.parlamento.pt/deputados/joao-silva',
    biography_scraped_at: '2024-10-01T14:30:00Z',

    // Source tracking
    last_synced_at: '2024-10-15T08:00:00Z',
    deputy_source_url: 'https://www.parlamento.pt/deputados/12345',
    deputy_source_type: 'api',
    deputy_source_name: 'Parlamento API',

    ...overrides,
  };
}

/**
 * Factory function to create mock NationalAverages objects.
 * Used for comparison metrics in the ReportCardDetail component.
 */
export function createMockNationalAverages(
  overrides: Partial<NationalAverages> = {}
): NationalAverages {
  return {
    avg_proposals: 12.5,
    avg_interventions: 35.2,
    avg_questions: 6.8,
    avg_work_score: 65.0,
    avg_attendance: 85.0,
    ...overrides,
  };
}

/**
 * Factory function to create mock DeputyRole objects.
 * Used for roles/positions in the extended info section.
 */
export function createMockDeputyRole(overrides: Partial<DeputyRole> = {}): DeputyRole {
  return {
    id: 'role-1',
    deputy_id: 'deputy-1',
    role_name: 'Vice-Presidente da Comissão de Economia',
    role_id: 101,
    start_date: '2024-03-26',
    end_date: null,
    ...overrides,
  };
}

/**
 * Factory function to create mock DeputyPartyHistory objects.
 * Used for party history in the extended info section.
 * Only displayed when there are more than 1 entries.
 */
export function createMockDeputyPartyHistory(
  overrides: Partial<DeputyPartyHistory> = {}
): DeputyPartyHistory {
  return {
    id: 'party-history-1',
    deputy_id: 'deputy-1',
    party_id: 'party-ps',
    party_acronym: 'PS',
    start_date: '2024-03-26',
    end_date: null,
    ...overrides,
  };
}

/**
 * Factory function to create mock DeputyStatusHistory objects.
 * Used for status history in the extended info section.
 */
export function createMockDeputyStatusHistory(
  overrides: Partial<DeputyStatusHistory> = {}
): DeputyStatusHistory {
  return {
    id: 'status-history-1',
    deputy_id: 'deputy-1',
    status: 'Efetivo',
    start_date: '2024-03-26',
    end_date: null,
    ...overrides,
  };
}

/**
 * Factory function to create mock extended info object.
 * Contains roles, party history, and status history arrays.
 */
export function createMockExtendedInfo(
  options: {
    roles?: DeputyRole[];
    partyHistory?: DeputyPartyHistory[];
    statusHistory?: DeputyStatusHistory[];
  } = {}
): {
  roles: DeputyRole[];
  partyHistory: DeputyPartyHistory[];
  statusHistory: DeputyStatusHistory[];
} {
  return {
    roles: options.roles ?? [createMockDeputyRole()],
    partyHistory: options.partyHistory ?? [createMockDeputyPartyHistory()],
    statusHistory: options.statusHistory ?? [createMockDeputyStatusHistory()],
  };
}

// ============================================
// Pre-configured mock variants for common test scenarios
// ============================================

/**
 * Deputy with minimal data - tests fallback/placeholder rendering
 */
export function createMinimalDeputy(): DeputyDetail {
  return createMockDeputyDetail({
    id: 'deputy-minimal',
    photo_url: null,
    party_acronym: null,
    party_name: null,
    party_color: null,
    district_name: null,
    district_slug: null,
    profession: null,
    education: null,
    bio_narrative: null,
    biography_source_url: null,
    biography_scraped_at: null,
    attendance_rate: null,
    meetings_attended: null,
    meetings_total: null,
    last_synced_at: null,
    deputy_source_url: null,
    deputy_source_type: null,
    deputy_source_name: null,
  });
}

/**
 * Deputy with no attendance data - tests conditional attendance section
 */
export function createDeputyWithNoAttendance(): DeputyDetail {
  return createMockDeputyDetail({
    id: 'deputy-no-attendance',
    attendance_rate: null,
    meetings_attended: null,
    meetings_total: null,
  });
}

/**
 * Deputy with zero meetings - tests attendance section not rendering
 */
export function createDeputyWithZeroMeetings(): DeputyDetail {
  return createMockDeputyDetail({
    id: 'deputy-zero-meetings',
    attendance_rate: 0,
    meetings_attended: 0,
    meetings_total: 0,
  });
}

/**
 * Top-performing deputy with high scores
 */
export function createTopPerformingDeputy(): DeputyDetail {
  return createMockDeputyDetail({
    id: 'deputy-top',
    grade: 'A',
    work_score: 95.5,
    national_rank: 1,
    district_rank: 1,
    proposal_count: 45,
    intervention_count: 120,
    question_count: 25,
    attendance_rate: 98.5,
    meetings_attended: 79,
    meetings_total: 80,
  });
}

/**
 * Low-performing deputy with low scores
 */
export function createLowPerformingDeputy(): DeputyDetail {
  return createMockDeputyDetail({
    id: 'deputy-low',
    grade: 'F',
    work_score: 15.2,
    national_rank: 230,
    district_rank: 48,
    proposal_count: 0,
    intervention_count: 2,
    question_count: 0,
    attendance_rate: 45.0,
    meetings_attended: 36,
    meetings_total: 80,
  });
}

/**
 * Inactive deputy with mandate end date
 */
export function createInactiveDeputy(): DeputyDetail {
  return createMockDeputyDetail({
    id: 'deputy-inactive',
    is_active: false,
    mandate_end: '2024-09-15',
  });
}

/**
 * Deputy with no votes - tests zero division handling
 */
export function createDeputyWithNoVotes(): DeputyDetail {
  return createMockDeputyDetail({
    id: 'deputy-no-votes',
    party_votes_favor: 0,
    party_votes_against: 0,
    party_votes_abstain: 0,
    party_total_votes: 0,
  });
}

/**
 * Creates extended info with multiple party changes - tests party history section
 */
export function createExtendedInfoWithPartyChanges(): ReturnType<typeof createMockExtendedInfo> {
  return createMockExtendedInfo({
    partyHistory: [
      createMockDeputyPartyHistory({
        id: 'party-history-1',
        party_acronym: 'PSD',
        start_date: '2020-10-25',
        end_date: '2022-06-15',
      }),
      createMockDeputyPartyHistory({
        id: 'party-history-2',
        party_acronym: 'IL',
        start_date: '2022-06-16',
        end_date: null,
      }),
    ],
  });
}

/**
 * Creates extended info with multiple roles
 */
export function createExtendedInfoWithMultipleRoles(): ReturnType<typeof createMockExtendedInfo> {
  return createMockExtendedInfo({
    roles: [
      createMockDeputyRole({
        id: 'role-1',
        role_name: 'Vice-Presidente da Comissão de Economia',
        start_date: '2024-03-26',
        end_date: null,
      }),
      createMockDeputyRole({
        id: 'role-2',
        role_name: 'Membro da Comissão de Orçamento',
        start_date: '2024-04-15',
        end_date: null,
      }),
    ],
  });
}

/**
 * Creates extended info with varied status history
 */
export function createExtendedInfoWithStatusChanges(): ReturnType<typeof createMockExtendedInfo> {
  return createMockExtendedInfo({
    statusHistory: [
      createMockDeputyStatusHistory({
        id: 'status-1',
        status: 'Efetivo',
        start_date: '2024-03-26',
        end_date: '2024-06-30',
      }),
      createMockDeputyStatusHistory({
        id: 'status-2',
        status: 'Suspenso',
        start_date: '2024-07-01',
        end_date: '2024-08-31',
      }),
      createMockDeputyStatusHistory({
        id: 'status-3',
        status: 'Efetivo',
        start_date: '2024-09-01',
        end_date: null,
      }),
    ],
  });
}

import type {
  ElectoralDistrict,
  MP,
  MPSituation,
  ParliamentData,
  ParliamentaryGroup,
} from '../../types/parliament';

/**
 * Metadata type for parliament statistics
 */
type ParliamentMetadata = {
  total: number;
  totalByParty: Record<string, number>;
  totalByDistrict: Record<string, number>;
  totalByStatus: Record<string, number>;
};

/**
 * Factory function to create mock ElectoralDistrict objects.
 * Provides sensible defaults while allowing partial overrides.
 */
export function createMockElectoralDistrict(
  overrides: Partial<ElectoralDistrict> = {}
): ElectoralDistrict {
  return {
    cpDes: 'Lisboa',
    cpId: 1,
    legDes: 'XVI Legislatura',
    ...overrides,
  };
}

/**
 * Factory function to create mock ParliamentaryGroup objects.
 * Used for parliamentary group history in MP data.
 */
export function createMockParliamentaryGroup(
  overrides: Partial<ParliamentaryGroup> = {}
): ParliamentaryGroup {
  return {
    gpDtFim: '',
    gpDtInicio: '2024-03-26',
    gpId: 1,
    gpSigla: 'PS',
    ...overrides,
  };
}

/**
 * Factory function to create mock MPSituation objects.
 * Used for MP status history.
 */
export function createMockMPSituation(overrides: Partial<MPSituation> = {}): MPSituation {
  return {
    sioDes: 'Efetivo',
    sioDtFim: null,
    sioDtInicio: '2024-03-26',
    ...overrides,
  };
}

/**
 * Factory function to create mock MP (Member of Parliament) objects.
 * Provides sensible defaults while allowing partial overrides for testing various scenarios.
 */
export function createMockMP(overrides: Partial<MP> = {}): MP {
  return {
    DepCadId: 12345,
    DepCargo: null,
    DepCPDes: 'Lisboa',
    DepCPId: 1,
    DepGP: overrides.DepGP ?? [createMockParliamentaryGroup()],
    DepId: 1,
    DepNomeCompleto: 'João Manuel Silva Santos',
    DepNomeParlamentar: 'João Silva',
    DepSituacao: overrides.DepSituacao ?? [createMockMPSituation()],
    LegDes: 'XVI Legislatura',
    Videos: null,
    ...overrides,
  };
}

/**
 * Factory function to create mock ParliamentData objects.
 * Contains the complete parliament structure with districts and MPs.
 */
export function createMockParliamentData(
  options: {
    districts?: ElectoralDistrict[];
    mps?: MP[];
  } = {}
): ParliamentData {
  const defaultDistricts: ElectoralDistrict[] = [
    createMockElectoralDistrict({ cpId: 1, cpDes: 'Lisboa' }),
    createMockElectoralDistrict({ cpId: 2, cpDes: 'Porto' }),
    createMockElectoralDistrict({ cpId: 3, cpDes: 'Braga' }),
    createMockElectoralDistrict({ cpId: 4, cpDes: 'Setúbal' }),
  ];

  const defaultMPs: MP[] = [
    createMockMP({
      DepId: 1,
      DepNomeCompleto: 'João Manuel Silva Santos',
      DepNomeParlamentar: 'João Silva',
      DepCPId: 1,
      DepCPDes: 'Lisboa',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })],
    }),
    createMockMP({
      DepId: 2,
      DepNomeCompleto: 'Maria Teresa Oliveira Costa',
      DepNomeParlamentar: 'Maria Costa',
      DepCPId: 1,
      DepCPDes: 'Lisboa',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PSD' })],
    }),
    createMockMP({
      DepId: 3,
      DepNomeCompleto: 'António José Ferreira Lima',
      DepNomeParlamentar: 'António Lima',
      DepCPId: 2,
      DepCPDes: 'Porto',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'IL' })],
    }),
  ];

  return {
    CirculosEleitorais: options.districts ?? defaultDistricts,
    Deputados: options.mps ?? defaultMPs,
  };
}

/**
 * Factory function to create mock ParliamentMetadata objects.
 * Used for testing statistics display in the parliament list.
 */
export function createMockParliamentMetadata(
  overrides: Partial<ParliamentMetadata> = {}
): ParliamentMetadata {
  return {
    total: 230,
    totalByParty: {
      PS: 78,
      PSD: 80,
      IL: 8,
      CH: 50,
      BE: 5,
      PCP: 6,
      L: 1,
      PAN: 1,
      'CDS-PP': 1,
    },
    totalByDistrict: {
      Lisboa: 48,
      Porto: 40,
      Braga: 19,
      Setúbal: 18,
      Aveiro: 16,
      Faro: 9,
      Coimbra: 9,
      Leiria: 10,
    },
    totalByStatus: {
      Efetivo: 210,
      'Suspenso(Eleito)': 15,
      'Suspenso(Não Eleito)': 5,
    },
    ...overrides,
  };
}

// ============================================
// Pre-configured mock variants for common test scenarios
// ============================================

/**
 * Creates an empty parliament - tests empty state rendering
 */
export function createEmptyParliament(): ParliamentData {
  return {
    CirculosEleitorais: [],
    Deputados: [],
  };
}

/**
 * Creates parliament with only districts, no MPs
 */
export function createParliamentWithNoMPs(): ParliamentData {
  return createMockParliamentData({
    mps: [],
  });
}

/**
 * Creates MP with multiple party changes - tests party history
 */
export function createMPWithPartyChanges(): MP {
  return createMockMP({
    DepId: 100,
    DepNomeCompleto: 'Carlos Alberto Mudança Partido',
    DepNomeParlamentar: 'Carlos Mudança',
    DepGP: [
      createMockParliamentaryGroup({
        gpId: 1,
        gpSigla: 'PS',
        gpDtInicio: '2022-03-29',
        gpDtFim: '2023-06-15',
      }),
      createMockParliamentaryGroup({
        gpId: 2,
        gpSigla: 'PSD',
        gpDtInicio: '2023-06-16',
        gpDtFim: '',
      }),
    ],
  });
}

/**
 * Creates MP with suspended status
 */
export function createSuspendedMP(): MP {
  return createMockMP({
    DepId: 101,
    DepNomeCompleto: 'Ana Paula Suspensa',
    DepNomeParlamentar: 'Ana Suspensa',
    DepSituacao: [
      createMockMPSituation({
        sioDes: 'Efetivo',
        sioDtInicio: '2024-03-26',
        sioDtFim: '2024-06-30',
      }),
      createMockMPSituation({
        sioDes: 'Suspenso(Eleito)',
        sioDtInicio: '2024-07-01',
        sioDtFim: null,
      }),
    ],
  });
}

/**
 * Creates MP with a specific role/position
 */
export function createMPWithRole(): MP {
  return createMockMP({
    DepId: 102,
    DepNomeCompleto: 'Pedro Manuel Presidente',
    DepNomeParlamentar: 'Pedro Presidente',
    DepCargo: 'Presidente da Comissão de Economia',
  });
}

/**
 * Creates a diverse set of MPs for list testing
 */
export function createMPsList(count = 10): MP[] {
  const parties = ['PS', 'PSD', 'IL', 'CH', 'BE', 'PCP', 'L', 'PAN', 'CDS-PP'];
  const districts = ['Lisboa', 'Porto', 'Braga', 'Setúbal', 'Aveiro', 'Faro'];
  const firstNames = [
    'João',
    'Maria',
    'António',
    'Ana',
    'Pedro',
    'Sofia',
    'Carlos',
    'Beatriz',
    'Miguel',
    'Inês',
  ];
  const lastNames = [
    'Silva',
    'Costa',
    'Lima',
    'Ferreira',
    'Oliveira',
    'Santos',
    'Pereira',
    'Rodrigues',
  ];

  return Array.from({ length: count }, (_, index) => {
    const firstName = firstNames[index % firstNames.length];
    const lastName = lastNames[index % lastNames.length];
    const party = parties[index % parties.length];
    const district = districts[index % districts.length];
    const districtId = districts.indexOf(district) + 1;

    return createMockMP({
      DepId: index + 1,
      DepCadId: 10000 + index,
      DepNomeCompleto: `${firstName} Manuel ${lastName}`,
      DepNomeParlamentar: `${firstName} ${lastName}`,
      DepCPId: districtId,
      DepCPDes: district,
      DepGP: [createMockParliamentaryGroup({ gpId: index + 1, gpSigla: party })],
    });
  });
}

/**
 * Creates MPs for testing search functionality
 */
export function createSearchableMPs(): MP[] {
  return [
    createMockMP({
      DepId: 1,
      DepNomeCompleto: 'João Manuel Silva Santos',
      DepNomeParlamentar: 'João Silva',
      DepCPDes: 'Lisboa',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })],
    }),
    createMockMP({
      DepId: 2,
      DepNomeCompleto: 'Maria Teresa Oliveira Costa',
      DepNomeParlamentar: 'Maria Costa',
      DepCPDes: 'Porto',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PSD' })],
    }),
    createMockMP({
      DepId: 3,
      DepNomeCompleto: 'António José Ferreira Lima',
      DepNomeParlamentar: 'António Lima',
      DepCPDes: 'Braga',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'IL' })],
    }),
    createMockMP({
      DepId: 4,
      DepNomeCompleto: 'Ana Paula Rodrigues Silva',
      DepNomeParlamentar: 'Ana Silva',
      DepCPDes: 'Lisboa',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'CH' })],
    }),
    createMockMP({
      DepId: 5,
      DepNomeCompleto: 'Pedro Miguel Santos Costa',
      DepNomeParlamentar: 'Pedro Costa',
      DepCPDes: 'Porto',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })],
    }),
  ];
}

/**
 * Creates a complete parliament setup for comprehensive testing
 */
export function createFullParliamentSetup(): {
  parliament: ParliamentData;
  metadata: ParliamentMetadata;
} {
  const districts = [
    createMockElectoralDistrict({ cpId: 1, cpDes: 'Lisboa', legDes: 'XVI Legislatura' }),
    createMockElectoralDistrict({ cpId: 2, cpDes: 'Porto', legDes: 'XVI Legislatura' }),
    createMockElectoralDistrict({ cpId: 3, cpDes: 'Braga', legDes: 'XVI Legislatura' }),
  ];

  const mps = createSearchableMPs();

  // Calculate metadata from MPs
  const totalByParty: Record<string, number> = {};
  const totalByDistrict: Record<string, number> = {};
  const totalByStatus: Record<string, number> = {};

  for (const mp of mps) {
    const party = mp.DepGP[mp.DepGP.length - 1]?.gpSigla;
    const status = mp.DepSituacao[mp.DepSituacao.length - 1]?.sioDes;

    if (party) {
      totalByParty[party] = (totalByParty[party] || 0) + 1;
    }
    totalByDistrict[mp.DepCPDes] = (totalByDistrict[mp.DepCPDes] || 0) + 1;
    if (status) {
      totalByStatus[status] = (totalByStatus[status] || 0) + 1;
    }
  }

  return {
    parliament: {
      CirculosEleitorais: districts,
      Deputados: mps,
    },
    metadata: {
      total: mps.length,
      totalByParty,
      totalByDistrict,
      totalByStatus,
    },
  };
}

/**
 * Creates parliament data for filter testing (multiple parties and districts)
 */
export function createFilterTestParliament(): ParliamentData {
  const districts = [
    createMockElectoralDistrict({ cpId: 1, cpDes: 'Lisboa' }),
    createMockElectoralDistrict({ cpId: 2, cpDes: 'Porto' }),
  ];

  const mps = [
    // PS Lisboa
    createMockMP({
      DepId: 1,
      DepNomeParlamentar: 'António Silva (PS Lisboa)',
      DepCPId: 1,
      DepCPDes: 'Lisboa',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })],
    }),
    // PS Porto
    createMockMP({
      DepId: 2,
      DepNomeParlamentar: 'Maria Santos (PS Porto)',
      DepCPId: 2,
      DepCPDes: 'Porto',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PS' })],
    }),
    // PSD Lisboa
    createMockMP({
      DepId: 3,
      DepNomeParlamentar: 'João Ferreira (PSD Lisboa)',
      DepCPId: 1,
      DepCPDes: 'Lisboa',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PSD' })],
    }),
    // PSD Porto
    createMockMP({
      DepId: 4,
      DepNomeParlamentar: 'Ana Costa (PSD Porto)',
      DepCPId: 2,
      DepCPDes: 'Porto',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'PSD' })],
    }),
    // IL Lisboa
    createMockMP({
      DepId: 5,
      DepNomeParlamentar: 'Pedro Oliveira (IL Lisboa)',
      DepCPId: 1,
      DepCPDes: 'Lisboa',
      DepGP: [createMockParliamentaryGroup({ gpSigla: 'IL' })],
    }),
  ];

  return {
    CirculosEleitorais: districts,
    Deputados: mps,
  };
}

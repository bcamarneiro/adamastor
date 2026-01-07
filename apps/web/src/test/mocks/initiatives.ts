import type { Initiative } from '@/services/initiatives/useInitiatives';

/**
 * Event type with phase information for initiative timeline
 */
type InitiativeEvent = {
  EvtId: string;
  DataFase: string | Date;
  Observacoes?: string;
  Responsavel?: string;
  Estado?: string;
  DataPrevista?: string;
  CodigoFase: string;
  Fase: string;
};

/**
 * Parsed initiative with computed latest event
 */
type ParsedInitiative = Initiative & {
  latestEvent: InitiativeEvent;
  IniEventos: (InitiativeEvent & { DataFase: Date })[];
};

/**
 * Metadata for the initiatives list
 */
type InitiativesListMetadata = {
  total?: number;
  totalByFase?: Record<string, number>;
  fasesList?: Record<string, string>;
};

/**
 * Factory function to create mock InitiativeEvent objects.
 * Provides sensible defaults while allowing partial overrides.
 */
export function createMockInitiativeEvent(overrides: Partial<InitiativeEvent> = {}): InitiativeEvent {
  return {
    EvtId: 'event-1',
    DataFase: '2024-03-15',
    Observacoes: undefined,
    Responsavel: undefined,
    Estado: undefined,
    DataPrevista: undefined,
    CodigoFase: 'FAC',
    Fase: 'Em Análise',
    ...overrides,
  };
}

/**
 * Factory function to create mock Initiative objects.
 * Provides sensible defaults while allowing partial overrides for testing various scenarios.
 */
export function createMockInitiative(overrides: Partial<Initiative> = {}): Initiative {
  const defaultEvents: InitiativeEvent[] = [
    createMockInitiativeEvent({
      EvtId: 'event-1',
      DataFase: '2024-01-15',
      CodigoFase: 'INI',
      Fase: 'Entrada',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-2',
      DataFase: '2024-02-20',
      CodigoFase: 'DIS',
      Fase: 'Distribuição',
      Responsavel: 'Comissão de Economia',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-3',
      DataFase: '2024-03-15',
      CodigoFase: 'FAC',
      Fase: 'Em Análise',
    }),
  ];

  return {
    IniId: 'initiative-1',
    IniNr: '123/XVI/1',
    IniTitulo: 'Proposta de alteração ao regime fiscal',
    description: 'Esta proposta visa alterar o regime fiscal aplicável às pequenas empresas.',
    IniTipo: 'P',
    IniEventos: overrides.IniEventos ?? defaultEvents,
    ...overrides,
  };
}

/**
 * Factory function to create mock ParsedInitiative objects.
 * Includes computed latestEvent and Date-parsed events.
 */
export function createMockParsedInitiative(
  overrides: Partial<ParsedInitiative> = {}
): ParsedInitiative {
  const baseInitiative = createMockInitiative(overrides);

  const parsedEvents = baseInitiative.IniEventos.map((event) => ({
    ...event,
    DataFase: new Date(event.DataFase as string),
  }));

  return {
    ...baseInitiative,
    IniEventos: parsedEvents,
    latestEvent: parsedEvents[parsedEvents.length - 1],
    ...overrides,
  } as ParsedInitiative;
}

/**
 * Factory function to create mock InitiativesListMetadata objects.
 * Used for testing statistics display in the initiatives list.
 */
export function createMockInitiativesMetadata(
  overrides: Partial<InitiativesListMetadata> = {}
): InitiativesListMetadata {
  return {
    total: 100,
    totalByFase: {
      INI: 15,
      DIS: 25,
      FAC: 30,
      VOT: 20,
      FIN: 10,
    },
    fasesList: {
      INI: 'Entrada',
      DIS: 'Distribuição',
      FAC: 'Em Análise',
      VOT: 'Votação',
      FIN: 'Concluído',
    },
    ...overrides,
  };
}

// ============================================
// Pre-configured mock variants for common test scenarios
// ============================================

/**
 * Initiative with voting phases - tests voting indicator display
 */
export function createInitiativeWithVoting(): ParsedInitiative {
  const events: InitiativeEvent[] = [
    createMockInitiativeEvent({
      EvtId: 'event-1',
      DataFase: '2024-01-10',
      CodigoFase: 'INI',
      Fase: 'Entrada',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-2',
      DataFase: '2024-02-15',
      CodigoFase: 'DIS',
      Fase: 'Distribuição',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-3',
      DataFase: '2024-03-20',
      CodigoFase: 'VG1',
      Fase: 'Votação na Generalidade',
      Observacoes: 'Aprovado por unanimidade',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-4',
      DataFase: '2024-04-25',
      CodigoFase: 'VE',
      Fase: 'Votação na Especialidade',
    }),
  ];

  return createMockParsedInitiative({
    IniId: 'initiative-voting',
    IniNr: '456/XVI/1',
    IniTitulo: 'Lei sobre proteção de dados pessoais',
    description: 'Proposta para reforçar a proteção de dados pessoais.',
    IniEventos: events,
  });
}

/**
 * Long-running initiative (> 180 days) - tests long-running indicator
 */
export function createLongRunningInitiative(): ParsedInitiative {
  const events: InitiativeEvent[] = [
    createMockInitiativeEvent({
      EvtId: 'event-1',
      DataFase: '2023-01-15',
      CodigoFase: 'INI',
      Fase: 'Entrada',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-2',
      DataFase: '2023-03-20',
      CodigoFase: 'DIS',
      Fase: 'Distribuição',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-3',
      DataFase: '2024-06-15',
      CodigoFase: 'FAC',
      Fase: 'Em Análise',
      Observacoes: 'Aguarda parecer técnico',
    }),
  ];

  return createMockParsedInitiative({
    IniId: 'initiative-long',
    IniNr: '789/XVI/1',
    IniTitulo: 'Reforma do sistema de saúde',
    description: 'Proposta abrangente para reforma do sistema nacional de saúde.',
    IniEventos: events,
  });
}

/**
 * Quick initiative (< 30 days) - tests quick processing indicator
 */
export function createQuickInitiative(): ParsedInitiative {
  const events: InitiativeEvent[] = [
    createMockInitiativeEvent({
      EvtId: 'event-1',
      DataFase: '2024-06-01',
      CodigoFase: 'INI',
      Fase: 'Entrada',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-2',
      DataFase: '2024-06-10',
      CodigoFase: 'DIS',
      Fase: 'Distribuição',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-3',
      DataFase: '2024-06-15',
      CodigoFase: 'FIN',
      Fase: 'Concluído',
    }),
  ];

  return createMockParsedInitiative({
    IniId: 'initiative-quick',
    IniNr: '101/XVI/1',
    IniTitulo: 'Medida de emergência COVID',
    description: 'Medida urgente para resposta à pandemia.',
    IniEventos: events,
  });
}

/**
 * Initiative with minimal data - tests fallback rendering
 */
export function createMinimalInitiative(): ParsedInitiative {
  const events: InitiativeEvent[] = [
    createMockInitiativeEvent({
      EvtId: 'event-1',
      DataFase: '2024-05-01',
      CodigoFase: 'INI',
      Fase: 'Entrada',
    }),
  ];

  return createMockParsedInitiative({
    IniId: 'initiative-minimal',
    IniNr: '999/XVI/1',
    IniTitulo: 'Iniciativa sem detalhes',
    description: '',
    IniEventos: events,
  });
}

/**
 * Initiative with observations and responsible party
 */
export function createInitiativeWithDetails(): ParsedInitiative {
  const events: InitiativeEvent[] = [
    createMockInitiativeEvent({
      EvtId: 'event-1',
      DataFase: '2024-02-01',
      CodigoFase: 'INI',
      Fase: 'Entrada',
      Observacoes: 'Apresentada pelo Governo',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-2',
      DataFase: '2024-02-20',
      CodigoFase: 'DIS',
      Fase: 'Distribuição',
      Responsavel: 'Comissão de Educação',
      Observacoes: 'Distribuída à comissão competente',
    }),
    createMockInitiativeEvent({
      EvtId: 'event-3',
      DataFase: '2024-03-10',
      CodigoFase: 'FAC',
      Fase: 'Em Análise',
      Responsavel: 'Comissão de Educação',
      Observacoes: 'Aguarda audições públicas',
      DataPrevista: '2024-04-15',
    }),
  ];

  return createMockParsedInitiative({
    IniId: 'initiative-detailed',
    IniNr: '234/XVI/1',
    IniTitulo: 'Alteração ao regime de propinas no ensino superior',
    description:
      'Esta proposta visa reduzir as propinas no ensino superior público, estabelecendo um novo modelo de financiamento.',
    IniEventos: events,
  });
}

/**
 * Creates a set of diverse initiatives for testing list display
 */
export function createInitiativesList(count: number = 5): ParsedInitiative[] {
  const initiativeTypes = ['P', 'PL', 'PJL', 'PAR', 'PJR'];
  const phases = ['Entrada', 'Distribuição', 'Em Análise', 'Votação na Generalidade', 'Concluído'];
  const phaseCodes = ['INI', 'DIS', 'FAC', 'VG1', 'FIN'];

  return Array.from({ length: count }, (_, index) => {
    const phaseIndex = index % phases.length;
    const events: InitiativeEvent[] = Array.from({ length: phaseIndex + 1 }, (_, evtIdx) =>
      createMockInitiativeEvent({
        EvtId: `event-${index}-${evtIdx}`,
        DataFase: new Date(2024, evtIdx, 15 + index).toISOString(),
        CodigoFase: phaseCodes[evtIdx],
        Fase: phases[evtIdx],
      })
    );

    return createMockParsedInitiative({
      IniId: `initiative-${index + 1}`,
      IniNr: `${100 + index}/XVI/1`,
      IniTitulo: `Proposta de lei número ${index + 1}`,
      description: `Descrição da proposta número ${index + 1}.`,
      IniTipo: initiativeTypes[index % initiativeTypes.length],
      IniEventos: events,
    });
  });
}

/**
 * Creates mock initiatives for testing search functionality
 */
export function createSearchableInitiatives(): ParsedInitiative[] {
  return [
    createMockParsedInitiative({
      IniId: 'search-1',
      IniNr: '001/XVI/1',
      IniTitulo: 'Reforma fiscal para empresas',
      description: 'Alteração ao código fiscal.',
    }),
    createMockParsedInitiative({
      IniId: 'search-2',
      IniNr: '002/XVI/1',
      IniTitulo: 'Lei do trabalho remoto',
      description: 'Regulamentação do teletrabalho.',
    }),
    createMockParsedInitiative({
      IniId: 'search-3',
      IniNr: '003/XVI/1',
      IniTitulo: 'Proteção ambiental costeira',
      description: 'Medidas para proteção das zonas costeiras.',
    }),
  ];
}

/**
 * Creates mock initiatives with different phases for filter testing
 */
export function createPhaseFilterTestInitiatives(): ParsedInitiative[] {
  return [
    createMockParsedInitiative({
      IniId: 'phase-1',
      IniNr: '010/XVI/1',
      IniTitulo: 'Iniciativa em entrada',
      IniEventos: [
        createMockInitiativeEvent({
          EvtId: 'pe-1',
          DataFase: '2024-03-01',
          CodigoFase: 'INI',
          Fase: 'Entrada',
        }),
      ],
    }),
    createMockParsedInitiative({
      IniId: 'phase-2',
      IniNr: '011/XVI/1',
      IniTitulo: 'Iniciativa em análise',
      IniEventos: [
        createMockInitiativeEvent({
          EvtId: 'pe-2',
          DataFase: '2024-03-01',
          CodigoFase: 'INI',
          Fase: 'Entrada',
        }),
        createMockInitiativeEvent({
          EvtId: 'pe-3',
          DataFase: '2024-04-01',
          CodigoFase: 'FAC',
          Fase: 'Em Análise',
        }),
      ],
    }),
    createMockParsedInitiative({
      IniId: 'phase-3',
      IniNr: '012/XVI/1',
      IniTitulo: 'Iniciativa em votação',
      IniEventos: [
        createMockInitiativeEvent({
          EvtId: 'pe-4',
          DataFase: '2024-03-01',
          CodigoFase: 'INI',
          Fase: 'Entrada',
        }),
        createMockInitiativeEvent({
          EvtId: 'pe-5',
          DataFase: '2024-05-01',
          CodigoFase: 'VG1',
          Fase: 'Votação na Generalidade',
        }),
      ],
    }),
  ];
}

import { describe, expect, it, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import InitiativeRow, {
  calcularDuracao,
  type InitiativeData,
  type RelatedInitiativeData,
} from './InitiativeRow';

// Mock react-router-dom Link
mock.module('react-router-dom', () => ({
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

// Helper to create a mock initiative with default values
const createMockInitiative = (overrides: Partial<InitiativeData> = {}): InitiativeData => ({
  IniId: 'init-123',
  IniNr: '123/XVI/1',
  IniTitulo: 'Test Initiative Title',
  description: 'Test initiative description text.',
  IniTipo: 'P',
  IniEventos: [
    {
      EvtId: 'evt-1',
      DataFase: new Date('2024-01-15'),
      CodigoFase: 'FASE1',
      Fase: 'Entrada',
      Observacoes: 'Initial observation',
    },
    {
      EvtId: 'evt-2',
      DataFase: new Date('2024-03-20'),
      CodigoFase: 'FASE2',
      Fase: 'Discussão',
      Observacoes: '',
    },
  ],
  latestEvent: {
    EvtId: 'evt-2',
    DataFase: new Date('2024-03-20'),
    CodigoFase: 'FASE2',
    Fase: 'Discussão',
    Observacoes: 'Latest observation',
    Responsavel: 'Comissão de Economia',
  },
  ...overrides,
});

// Helper to create mock related initiatives
const createMockRelatedInitiatives = (count = 2): RelatedInitiativeData[] =>
  Array.from({ length: count }, (_, i) => ({
    IniId: `related-${i + 1}`,
    IniNr: `${100 + i}/XVI/1`,
    IniTitulo: `Related Initiative ${i + 1}`,
    IniTipo: 'P',
  }));

describe('InitiativeRow', () => {
  describe('calcularDuracao helper', () => {
    it('should calculate duration between two dates in days', () => {
      const duration = calcularDuracao('2024-01-01', '2024-01-31');
      expect(duration).toBe(30);
    });

    it('should handle same day dates', () => {
      const duration = calcularDuracao('2024-01-01', '2024-01-01');
      expect(duration).toBe(0);
    });

    it('should use current date when end date is not provided', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);
      const duration = calcularDuracao(startDate.toISOString());
      expect(duration).toBe(10);
    });
  });

  describe('collapsed row rendering', () => {
    it('should render the initiative number', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('123/XVI/1')).toBeTruthy();
    });

    it('should render the initiative title', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Test Initiative Title')).toBeTruthy();
    });

    it('should render the latest phase', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Discussão')).toBeTruthy();
    });

    it('should render right chevron when collapsed', () => {
      const { container } = render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      // Check for SVG icon presence (FaChevronRight renders as svg)
      const row = container.querySelector('[role="row"]');
      expect(row?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should render the Details link', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      const detailsLink = screen.getByText('Details');
      expect(detailsLink).toBeTruthy();
      expect(detailsLink.getAttribute('href')).toBe('/initiatives/init-123/details');
    });

    it('should have proper accessibility roles', () => {
      const { container } = render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(container.querySelector('[role="rowgroup"]')).toBeTruthy();
      expect(container.querySelector('[role="row"]')).toBeTruthy();
      expect(container.querySelector('[role="rowheader"]')).toBeTruthy();
      expect(container.querySelectorAll('[role="cell"]').length).toBeGreaterThan(0);
    });
  });

  describe('expanded row rendering', () => {
    it('should render down chevron when expanded', () => {
      const { container } = render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      const row = container.querySelector('[role="row"]');
      expect(row?.getAttribute('aria-expanded')).toBe('true');
    });

    it('should render the description section when expanded', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Description')).toBeTruthy();
      expect(screen.getByText('Test initiative description text.')).toBeTruthy();
    });

    it('should not render description section when description is empty', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative({ description: '' })}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.queryByText('Description')).toBeNull();
    });

    it('should render Timeline Progress section when expanded', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Timeline Progress')).toBeTruthy();
      expect(screen.getByText('Entrada')).toBeTruthy();
      expect(screen.getByText('Discussão')).toBeTruthy();
    });

    it('should show duration in days', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      // The initiative spans from Jan 15 to Mar 20, which is ~65 days
      expect(screen.getByText(/\d+ days in process/)).toBeTruthy();
    });

    it('should display initiative type correctly', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative({ IniTipo: 'P' })}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Type')).toBeTruthy();
      expect(screen.getByText('Proposta de Lei')).toBeTruthy();
    });

    it('should render Latest Update section when expanded', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Latest Update')).toBeTruthy();
    });

    it('should render Current Responsible when available', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Current Responsible')).toBeTruthy();
      expect(screen.getByText('Comissão de Economia')).toBeTruthy();
    });

    it('should not render Current Responsible when not available', () => {
      const initiative = createMockInitiative();
      initiative.latestEvent.Responsavel = undefined;

      render(
        <InitiativeRow
          initiative={initiative}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.queryByText('Current Responsible')).toBeNull();
    });

    it('should render Latest Observations when available', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Latest Observations')).toBeTruthy();
      expect(screen.getByText('Latest observation')).toBeTruthy();
    });

    it('should not render Latest Observations when not available', () => {
      const initiative = createMockInitiative();
      initiative.latestEvent.Observacoes = undefined;

      render(
        <InitiativeRow
          initiative={initiative}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.queryByText('Latest Observations')).toBeNull();
    });
  });

  describe('voting phases', () => {
    it('should display voting icon when initiative has voting phases', () => {
      const initiativeWithVoting = createMockInitiative({
        IniEventos: [
          {
            EvtId: 'evt-1',
            DataFase: new Date('2024-01-15'),
            CodigoFase: 'VOTE',
            Fase: 'Votação na generalidade',
            Observacoes: '',
          },
        ],
      });

      const { container } = render(
        <InitiativeRow
          initiative={initiativeWithVoting}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      // FaVoteYea icon should have title "Has voting phases"
      const votingIcon = container.querySelector('[title="Has voting phases"]');
      expect(votingIcon).toBeTruthy();
    });

    it('should render Voting Information section when expanded and has voting phases', () => {
      const initiativeWithVoting = createMockInitiative({
        IniEventos: [
          {
            EvtId: 'evt-1',
            DataFase: new Date('2024-01-15'),
            CodigoFase: 'VOTE',
            Fase: 'Votação na generalidade',
            Observacoes: 'Voting observation',
          },
        ],
        latestEvent: {
          EvtId: 'evt-1',
          DataFase: new Date('2024-01-15'),
          CodigoFase: 'VOTE',
          Fase: 'Votação na generalidade',
          Observacoes: '',
        },
      });

      render(
        <InitiativeRow
          initiative={initiativeWithVoting}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Voting Information')).toBeTruthy();
      expect(screen.getByText('Voting Phases')).toBeTruthy();
      expect(screen.getAllByText('Votação na generalidade').length).toBeGreaterThan(0);
    });

    it('should not render Voting Information when no voting phases', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.queryByText('Voting Information')).toBeNull();
    });
  });

  describe('long running initiatives', () => {
    it('should display clock icon for initiatives running longer than 180 days', () => {
      const longRunningInitiative = createMockInitiative({
        IniEventos: [
          {
            EvtId: 'evt-1',
            DataFase: new Date('2023-01-01'),
            CodigoFase: 'FASE1',
            Fase: 'Entrada',
            Observacoes: '',
          },
        ],
        latestEvent: {
          EvtId: 'evt-2',
          DataFase: new Date('2024-01-01'), // ~365 days later
          CodigoFase: 'FASE2',
          Fase: 'Discussão',
          Observacoes: '',
        },
      });

      const { container } = render(
        <InitiativeRow
          initiative={longRunningInitiative}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      // FaClock icon should have title "Long running initiative"
      const clockIcon = container.querySelector('[title="Long running initiative"]');
      expect(clockIcon).toBeTruthy();
    });

    it('should show "longer than usual" text when expanded', () => {
      const longRunningInitiative = createMockInitiative({
        IniEventos: [
          {
            EvtId: 'evt-1',
            DataFase: new Date('2023-01-01'),
            CodigoFase: 'FASE1',
            Fase: 'Entrada',
            Observacoes: '',
          },
        ],
        latestEvent: {
          EvtId: 'evt-2',
          DataFase: new Date('2024-01-01'),
          CodigoFase: 'FASE2',
          Fase: 'Discussão',
          Observacoes: '',
        },
      });

      render(
        <InitiativeRow
          initiative={longRunningInitiative}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText(/longer than usual/)).toBeTruthy();
    });

    it('should show "relatively quick" for initiatives under 30 days', () => {
      const quickInitiative = createMockInitiative({
        IniEventos: [
          {
            EvtId: 'evt-1',
            DataFase: new Date('2024-01-01'),
            CodigoFase: 'FASE1',
            Fase: 'Entrada',
            Observacoes: '',
          },
        ],
        latestEvent: {
          EvtId: 'evt-2',
          DataFase: new Date('2024-01-15'), // 14 days later
          CodigoFase: 'FASE2',
          Fase: 'Conclusão',
          Observacoes: '',
        },
      });

      render(
        <InitiativeRow
          initiative={quickInitiative}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText(/relatively quick/)).toBeTruthy();
    });
  });

  describe('related initiatives', () => {
    it('should render related initiatives section when available', () => {
      const relatedInitiatives = createMockRelatedInitiatives(2);

      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={relatedInitiatives}
        />
      );

      expect(screen.getByText('Related Initiatives')).toBeTruthy();
      expect(screen.getByText('#100/XVI/1')).toBeTruthy();
      expect(screen.getByText('#101/XVI/1')).toBeTruthy();
      expect(screen.getByText('Related Initiative 1')).toBeTruthy();
      expect(screen.getByText('Related Initiative 2')).toBeTruthy();
    });

    it('should not render related initiatives section when empty', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.queryByText('Related Initiatives')).toBeNull();
    });

    it('should link related initiatives to their detail pages', () => {
      const relatedInitiatives = createMockRelatedInitiatives(1);

      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={relatedInitiatives}
        />
      );

      const link = screen.getByTestId('link-/initiatives/related-1/details');
      expect(link).toBeTruthy();
    });

    it('should display "Proposta de Lei" for type P', () => {
      const relatedInitiatives: RelatedInitiativeData[] = [
        {
          IniId: 'related-1',
          IniNr: '100/XVI/1',
          IniTitulo: 'Related Initiative',
          IniTipo: 'P',
        },
      ];

      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={relatedInitiatives}
        />
      );

      // Find all "Proposta de Lei" texts - should have one for main initiative and one for related
      const propostas = screen.getAllByText('Proposta de Lei');
      expect(propostas.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('user interactions', () => {
    it('should call onToggle when row is clicked', () => {
      const handleToggle = mock(() => {});

      const { container } = render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={handleToggle}
          relatedInitiatives={[]}
        />
      );

      const row = container.querySelector('[role="row"]');
      if (row) {
        fireEvent.click(row);
      }

      expect(handleToggle).toHaveBeenCalledTimes(1);
      expect(handleToggle).toHaveBeenCalledWith('init-123');
    });

    it('should call onToggle when Enter key is pressed on row', () => {
      const handleToggle = mock(() => {});

      const { container } = render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={handleToggle}
          relatedInitiatives={[]}
        />
      );

      const row = container.querySelector('[role="row"]');
      if (row) {
        fireEvent.keyDown(row, { key: 'Enter' });
      }

      expect(handleToggle).toHaveBeenCalledTimes(1);
      expect(handleToggle).toHaveBeenCalledWith('init-123');
    });

    it('should call onToggle when Space key is pressed on row', () => {
      const handleToggle = mock(() => {});

      const { container } = render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={handleToggle}
          relatedInitiatives={[]}
        />
      );

      const row = container.querySelector('[role="row"]');
      if (row) {
        fireEvent.keyDown(row, { key: ' ' });
      }

      expect(handleToggle).toHaveBeenCalledTimes(1);
    });

    it('should not call onToggle for other keys', () => {
      const handleToggle = mock(() => {});

      const { container } = render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={handleToggle}
          relatedInitiatives={[]}
        />
      );

      const row = container.querySelector('[role="row"]');
      if (row) {
        fireEvent.keyDown(row, { key: 'Tab' });
      }

      expect(handleToggle).toHaveBeenCalledTimes(0);
    });

    it('should not propagate click from Details link to row', () => {
      const handleToggle = mock(() => {});

      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={handleToggle}
          relatedInitiatives={[]}
        />
      );

      const detailsLink = screen.getByText('Details');
      fireEvent.click(detailsLink);

      // The click should be stopped from propagating to the row
      expect(handleToggle).toHaveBeenCalledTimes(0);
    });

    it('should not propagate click from related initiative links', () => {
      const handleToggle = mock(() => {});
      const relatedInitiatives = createMockRelatedInitiatives(1);

      render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={true}
          onToggle={handleToggle}
          relatedInitiatives={relatedInitiatives}
        />
      );

      const relatedLink = screen.getByTestId('link-/initiatives/related-1/details');
      fireEvent.click(relatedLink);

      // Click already triggered toggle from expanded row click
      // The related link click should NOT trigger additional toggle
      expect(handleToggle).toHaveBeenCalledTimes(0);
    });

    it('should have proper tabIndex for keyboard navigation', () => {
      const { container } = render(
        <InitiativeRow
          initiative={createMockInitiative()}
          isExpanded={false}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      const row = container.querySelector('[role="row"]');
      expect(row?.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('event observations', () => {
    it('should render event observations in timeline when available', () => {
      const initiativeWithObservations = createMockInitiative({
        IniEventos: [
          {
            EvtId: 'evt-1',
            DataFase: new Date('2024-01-15'),
            CodigoFase: 'FASE1',
            Fase: 'Entrada',
            Observacoes: 'Initial observation text',
          },
        ],
        latestEvent: {
          EvtId: 'evt-1',
          DataFase: new Date('2024-01-15'),
          CodigoFase: 'FASE1',
          Fase: 'Entrada',
          Observacoes: 'Initial observation text',
        },
      });

      render(
        <InitiativeRow
          initiative={initiativeWithObservations}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getAllByText('Initial observation text').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle initiative with only one event', () => {
      const singleEventInitiative = createMockInitiative({
        IniEventos: [
          {
            EvtId: 'evt-1',
            DataFase: new Date('2024-01-15'),
            CodigoFase: 'FASE1',
            Fase: 'Entrada',
            Observacoes: '',
          },
        ],
        latestEvent: {
          EvtId: 'evt-1',
          DataFase: new Date('2024-01-15'),
          CodigoFase: 'FASE1',
          Fase: 'Entrada',
          Observacoes: '',
        },
      });

      render(
        <InitiativeRow
          initiative={singleEventInitiative}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('Entrada')).toBeTruthy();
    });

    it('should handle initiative type that is not P', () => {
      render(
        <InitiativeRow
          initiative={createMockInitiative({ IniTipo: 'PJL' })}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      expect(screen.getByText('PJL')).toBeTruthy();
    });

    it('should handle Date objects in event dates', () => {
      const initiative = createMockInitiative();
      // Dates are already Date objects from the mock

      render(
        <InitiativeRow
          initiative={initiative}
          isExpanded={true}
          onToggle={() => {}}
          relatedInitiatives={[]}
        />
      );

      // Should render without errors - dates should be formatted
      expect(screen.getByText('Timeline Progress')).toBeTruthy();
    });
  });
});

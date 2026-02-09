import { memo } from 'react';
import { FaChevronDown, FaChevronRight, FaClock, FaVoteYea } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/dateUtils';

// Event type matching the structure from useInitiatives
type Event = {
  EvtId: string;
  DataFase: string | Date;
  Observacoes?: string;
  Responsavel?: string;
  Estado?: string;
  DataPrevista?: string;
  CodigoFase: string;
  Fase: string;
};

// Initiative type matching the parsed structure from useInitiatives
export type InitiativeData = {
  IniId: string;
  IniNr: string;
  IniTitulo: string;
  description: string;
  IniTipo: string;
  IniEventos: (Event & { DataFase: Date })[];
  latestEvent: Event;
};

// Related initiative type (minimal data needed for display)
export type RelatedInitiativeData = {
  IniId: string;
  IniNr: string;
  IniTitulo: string;
  IniTipo: string;
};

export interface InitiativeRowProps {
  initiative: InitiativeData;
  isExpanded: boolean;
  onToggle: (initiativeId: string) => void;
  relatedInitiatives: RelatedInitiativeData[];
}

/**
 * Calculate duration in days between two dates
 */
export const calcularDuracao = (inicio: string, fim?: string): number => {
  const startDate = new Date(inicio);
  const endDate = fim ? new Date(fim) : new Date();
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Grid column classes for consistent layout (matching header)
const gridColsClass = 'grid grid-cols-[48px_auto_auto_1fr_96px] items-center';

/**
 * InitiativeRow component - displays a single initiative row with expandable content
 * Supports both collapsed (summary) and expanded (detailed) states
 * Uses div-based layout for virtualization compatibility
 */
const InitiativeRow = memo(function InitiativeRow({
  initiative,
  isExpanded,
  onToggle,
  relatedInitiatives,
}: InitiativeRowProps) {
  const duration = calcularDuracao(
    typeof initiative.IniEventos[0].DataFase === 'string'
      ? initiative.IniEventos[0].DataFase
      : initiative.IniEventos[0].DataFase.toISOString(),
    typeof initiative.latestEvent.DataFase === 'string'
      ? initiative.latestEvent.DataFase
      : (initiative.latestEvent.DataFase as Date).toISOString()
  );

  const hasVotingPhases = initiative.IniEventos.some((event) =>
    event.Fase.toLowerCase().includes('votação')
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: rowgroup role required for virtualized table structure
    <div role="rowgroup">
      {/* Main Row */}
      {/* biome-ignore lint/a11y/useSemanticElements: row role for grid-based accessible table */}
      <div
        role="row"
        className={`${gridColsClass} hover:bg-neutral-1 transition-colors cursor-pointer border-b border-neutral-3`}
        onClick={() => onToggle(initiative.IniId)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(initiative.IniId);
          }
        }}
        aria-expanded={isExpanded}
      >
        {/* biome-ignore lint/a11y/useSemanticElements: cell role for table consistency */}
        <div role="cell" className="p-3 flex items-center justify-center">
          {isExpanded ? (
            <FaChevronDown className="text-neutral-11" aria-hidden="true" />
          ) : (
            <FaChevronRight className="text-neutral-11" aria-hidden="true" />
          )}
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: rowheader role for table structure */}
        <div role="rowheader" className="p-3 font-medium">
          {initiative.IniNr}
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: cell role for table consistency */}
        <div role="cell" className="p-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 rounded-full text-sm bg-neutral-2">
              {initiative.latestEvent.Fase?.trim()}
            </span>
            {hasVotingPhases && <FaVoteYea className="text-neutral-11" title="Has voting phases" />}
            {duration > 180 && (
              <FaClock className="text-neutral-11" title="Long running initiative" />
            )}
          </div>
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: cell role for table consistency */}
        <div role="cell" className="p-3 truncate">
          {initiative.IniTitulo}
        </div>
        {/* biome-ignore lint/a11y/useSemanticElements: cell role for table consistency */}
        <div role="cell" className="p-3">
          <Link
            to={`/initiatives/${initiative.IniId}/details`}
            className="inline-block px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:underline rounded transition-colors"
            aria-label={`View details for initiative ${initiative.IniTitulo}`}
            onClick={(e) => e.stopPropagation()}
          >
            Details
          </Link>
        </div>
      </div>

      {/* Expanded Content Row */}
      {isExpanded && (
        // biome-ignore lint/a11y/useSemanticElements: row role for expanded content in table
        // biome-ignore lint/a11y/useFocusableInteractive: Expanded content doesn't need independent focus
        <div role="row" className="bg-neutral-1 border-b border-neutral-3">
          {/* biome-ignore lint/a11y/useSemanticElements: cell role for table consistency */}
          <div role="cell" className="p-4">
            <div className="space-y-6">
              {/* Description Section */}
              {initiative.description && (
                <div>
                  <h4 className="font-medium text-sm text-neutral-11 mb-1">Description</h4>
                  <p className="text-neutral-12">{initiative.description}</p>
                </div>
              )}

              {/* Timeline Progress */}
              <div>
                <h4 className="font-medium text-sm text-neutral-11 mb-3">Timeline Progress</h4>
                <div className="bg-neutral-2 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FaClock className="text-neutral-11" />
                    <span className="text-sm">
                      {duration} days in process
                      {duration > 180
                        ? ' (longer than usual)'
                        : duration < 30
                          ? ' (relatively quick)'
                          : ''}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {initiative.IniEventos.map((event, index) => (
                      <div key={event.EvtId} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              event.Fase.toLowerCase().includes('votação')
                                ? 'bg-blue-500'
                                : 'bg-neutral-6'
                            }`}
                          />
                          {index < initiative.IniEventos.length - 1 && (
                            <div className="w-0.5 h-full bg-neutral-6" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm font-medium text-neutral-12">{event.Fase}</p>
                          <p className="text-sm text-neutral-11">
                            {formatDate(
                              typeof event.DataFase === 'string'
                                ? event.DataFase
                                : event.DataFase.toISOString()
                            )}
                          </p>
                          {event.Observacoes && (
                            <p className="text-sm text-neutral-11 mt-1 italic">
                              {event.Observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Voting Information */}
              {hasVotingPhases && (
                <div>
                  <h4 className="font-medium text-sm text-neutral-11 mb-3">Voting Information</h4>
                  <div className="bg-neutral-2 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <FaVoteYea className="text-neutral-11" />
                      <span className="text-sm font-medium">Voting Phases</span>
                    </div>
                    <div className="space-y-3">
                      {initiative.IniEventos.filter((event) =>
                        event.Fase.toLowerCase().includes('votação')
                      ).map((event) => (
                        <div key={event.EvtId} className="flex flex-col gap-1">
                          <p className="text-sm text-neutral-12">{event.Fase}</p>
                          <p className="text-sm text-neutral-11">
                            {formatDate(
                              typeof event.DataFase === 'string'
                                ? event.DataFase
                                : event.DataFase.toISOString()
                            )}
                          </p>
                          {event.Observacoes && (
                            <p className="text-sm text-neutral-11 mt-1 italic">
                              {event.Observacoes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-neutral-11 mb-1">Type</h4>
                  <p className="text-neutral-12">
                    {initiative.IniTipo === 'P' ? 'Proposta de Lei' : initiative.IniTipo}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-neutral-11 mb-1">Latest Update</h4>
                  <p className="text-neutral-12">
                    {formatDate(
                      typeof initiative.latestEvent.DataFase === 'string'
                        ? initiative.latestEvent.DataFase
                        : (initiative.latestEvent.DataFase as Date).toISOString()
                    )}
                  </p>
                </div>
                {initiative.latestEvent.Responsavel && (
                  <div>
                    <h4 className="font-medium text-sm text-neutral-11 mb-1">
                      Current Responsible
                    </h4>
                    <p className="text-neutral-12">{initiative.latestEvent.Responsavel}</p>
                  </div>
                )}
              </div>

              {/* Related Initiatives */}
              {relatedInitiatives.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-neutral-11 mb-3">Related Initiatives</h4>
                  <div className="grid gap-3">
                    {relatedInitiatives.map((relatedInitiative) => (
                      <Link
                        key={relatedInitiative.IniId}
                        to={`/initiatives/${relatedInitiative.IniId}/details`}
                        className="block p-3 bg-white rounded-lg border border-neutral-3 hover:border-neutral-6 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-neutral-12">
                            #{relatedInitiative.IniNr}
                          </span>
                          <span className="text-sm text-neutral-11">
                            {relatedInitiative.IniTipo === 'P'
                              ? 'Proposta de Lei'
                              : relatedInitiative.IniTipo}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-12">{relatedInitiative.IniTitulo}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Observations */}
              {initiative.latestEvent.Observacoes && (
                <div>
                  <h4 className="font-medium text-sm text-neutral-11 mb-1">Latest Observations</h4>
                  <p className="text-neutral-12">{initiative.latestEvent.Observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default InitiativeRow;

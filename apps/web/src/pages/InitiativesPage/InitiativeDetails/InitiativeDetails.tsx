import { Spinner } from '@/components/Spinner';
import {
  type Initiative,
  useInitiatives,
} from '@/services/initiatives/useInitiatives';
import { formatDate } from '@/utils/dateUtils';
import type React from 'react';
import { Link, useParams } from 'react-router-dom';

/**
 * Calculates the duration in days between two dates
 * @param inicio - Start date string in ISO format
 * @param fim - End date string in ISO format (optional, defaults to current date)
 * @returns Number of days between the dates
 */
const calcularDuracao = (inicio: string, fim?: string): number => {
  try {
    const dataInicio = new Date(inicio);

    // Check if the start date is valid
    if (Number.isNaN(dataInicio.getTime())) {
      console.error('Data de início inválida:', inicio);
      return 0;
    }

    const dataFim = fim ? new Date(fim) : new Date();

    // Check if the end date is valid
    if (Number.isNaN(dataFim.getTime())) {
      console.error('Data de fim inválida:', fim);
      return 0;
    }

    const diferencaTempo = Math.abs(dataFim.getTime() - dataInicio.getTime());
    const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

    return diferencaDias;
  } catch (error) {
    console.error('Erro ao calcular duração:', error);
    return 0;
  }
};

const InitiativeDetails: React.FC = () => {
  const { selectedInitiativeId } = useParams<{
    selectedInitiativeId: string;
  }>();

  const { initiatives, isLoading, isError, error } = useInitiatives();
  const initiative = initiatives.find(
    (initiative: Initiative) => initiative.IniId === selectedInitiativeId,
  );

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-bold mb-2">Error loading initiative</h2>
          <p>
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-neutral-8">Initiative not found</p>
      </div>
    );
  }

  const currentPhase = initiative.latestEvent.Fase;
  const totalDuration = calcularDuracao(
    typeof initiative.IniEventos[0].DataFase === 'string'
      ? initiative.IniEventos[0].DataFase
      : initiative.IniEventos[0].DataFase.toISOString(),
    typeof initiative.latestEvent.DataFase === 'string'
      ? initiative.latestEvent.DataFase
      : initiative.latestEvent.DataFase.toISOString(),
  );

  // Find related initiatives (same type or similar title keywords)
  const relatedInitiatives = initiatives
    .filter((ini) => {
      if (ini.IniId === initiative.IniId) return false;
      return (
        ini.IniTipo === initiative.IniTipo ||
        initiative.IniTitulo.split(' ').some((word) =>
          ini.IniTitulo.toLowerCase().includes(word.toLowerCase()),
        )
      );
    })
    .slice(0, 3);

  // Get voting phases
  const votingPhases = initiative.IniEventos.filter((event) =>
    event.Fase.toLowerCase().includes('votação'),
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Quick Summary Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            #{initiative.IniNr}
          </span>
          <span className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm">
            {initiative.IniTipo === 'P'
              ? 'Proposta de Lei'
              : initiative.IniTipo}
          </span>
        </div>
        <h1>{initiative.IniTitulo}</h1>
        {initiative.description && (
          <p className="text-gray-700 mb-3">{initiative.description}</p>
        )}
      </div>

      {/* What This Means Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2>What This Means for You</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-blue-100 rounded-full">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label="Status information icon"
                role="img"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Current Status</h3>
              <p className="text-gray-600">
                This initiative is currently in the "{currentPhase}" phase.
                {currentPhase.toLowerCase().includes('votação')
                  ? " This means it's being voted on by parliament."
                  : currentPhase.toLowerCase().includes('promulgação')
                    ? ' This means it has been approved and is being prepared to become law.'
                    : " This means it's being reviewed and processed by parliament."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 p-2 bg-green-100 rounded-full">
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-label="Time information icon"
                role="img"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Time Frame</h3>
              <p className="text-gray-600">
                This initiative has been in process for {totalDuration} days
                {totalDuration > 180
                  ? ' (which is longer than usual)'
                  : totalDuration < 30
                    ? ' (which is relatively quick)'
                    : ''}
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Information Card */}
      {votingPhases.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2>Voting Information</h2>
          <div className="space-y-4">
            {votingPhases.map((phase, index) => (
              <div key={index} className="bg-neutral-50 p-4 rounded">
                <h3 className="font-medium text-gray-900 mb-2">{phase.Fase}</h3>
                {phase.Observacoes && (
                  <p className="text-gray-600 mb-2">{phase.Observacoes}</p>
                )}
                <p className="text-sm text-gray-500">
                  {formatDate(
                    typeof phase.DataFase === 'string'
                      ? phase.DataFase
                      : phase.DataFase.toISOString(),
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2>Current Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-50 p-4 rounded">
            <p className="text-sm text-neutral-600">Current Phase</p>
            <p className="text-lg font-medium">{currentPhase}</p>
          </div>
          <div className="bg-neutral-50 p-4 rounded">
            <p className="text-sm text-neutral-600">Time in Process</p>
            <p className="text-lg font-medium">{totalDuration} days</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2>Progress Timeline</h2>
        <div className="relative">
          {initiative.IniEventos.map((event, index) => {
            const prevEvent =
              index > 0 ? initiative.IniEventos[index - 1] : null;
            const duration = prevEvent
              ? calcularDuracao(
                  typeof prevEvent.DataFase === 'string'
                    ? prevEvent.DataFase
                    : prevEvent.DataFase.toISOString(),
                  typeof event.DataFase === 'string'
                    ? event.DataFase
                    : event.DataFase.toISOString(),
                )
              : 0;

            return (
              <div
                key={event.EvtId || index}
                className="relative pl-8 pb-8 border-l-2 border-neutral-200 last:border-l-0"
              >
                {/* Timeline dot */}
                <div className="absolute -left-[9px] w-4 h-4 bg-blue-500 rounded-full border-4 border-white" />

                <div className="bg-neutral-50 p-4 rounded">
                  <div className="flex flex-wrap items-baseline gap-3 mb-2">
                    <span className="font-medium">{event.Fase}</span>
                    <span className="text-sm text-neutral-600">
                      {typeof event.DataFase === 'string'
                        ? formatDate(event.DataFase)
                        : formatDate(event.DataFase.toISOString())}
                    </span>
                    {duration > 0 && (
                      <span className="text-sm text-neutral-500">
                        ({duration} days)
                      </span>
                    )}
                  </div>

                  {event.Observacoes && (
                    <p className="text-neutral-700 mt-2">{event.Observacoes}</p>
                  )}

                  <div className="mt-2 space-y-1">
                    {event.Responsavel && (
                      <p className="text-sm text-neutral-600">
                        <span className="font-medium">Responsible:</span>{' '}
                        {event.Responsavel}
                      </p>
                    )}
                    {event.Estado && (
                      <p className="text-sm text-neutral-600">
                        <span className="font-medium">Status:</span>{' '}
                        {event.Estado}
                      </p>
                    )}
                    {event.DataPrevista && (
                      <p className="text-sm text-neutral-600">
                        <span className="font-medium">Expected Date:</span>{' '}
                        {formatDate(event.DataPrevista)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Related Initiatives */}
      {relatedInitiatives.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2>Related Initiatives</h2>
          <div className="space-y-4">
            {relatedInitiatives.map((related) => (
              <Link
                key={related.IniId}
                to={`/initiatives/${related.IniId}/details`}
                className="block p-4 bg-neutral-50 rounded hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-neutral-600">
                    #{related.IniNr}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {related.IniTipo === 'P'
                      ? 'Proposta de Lei'
                      : related.IniTipo}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900">
                  {related.IniTitulo}
                </h3>
                <p className="text-sm text-neutral-600 mt-1">
                  Current Phase: {related.latestEvent.Fase}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InitiativeDetails;

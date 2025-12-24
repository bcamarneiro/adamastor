import { Spinner } from '@/components/Spinner';
import { useInitiatives } from '@/services/initiatives/useInitiatives';
import { formatDate } from '@/utils/dateUtils';
import * as Accordion from '@radix-ui/react-accordion';
import { Table } from '@radix-ui/themes';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import {
  FaChevronDown,
  FaChevronRight,
  FaClock,
  FaSearch,
  FaVoteYea,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const calcularDuracao = (inicio: string, fim?: string): number => {
  const startDate = new Date(inicio);
  const endDate = fim ? new Date(fim) : new Date();
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const WhatHappened = () => {
  const { initiatives, metadata, isLoading, isError, error } = useInitiatives();
  const [filterText, setFilterText] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [debouncedFilterText, setDebouncedFilterText] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [timeFilter, setTimeFilter] = useState<
    'day' | 'week' | 'month' | '3months' | '6months' | ''
  >('');

  // Debounce filter text updates
  const debouncedSetFilter = useMemo(
    () => debounce((value: string) => setDebouncedFilterText(value), 300),
    [],
  );

  useEffect(() => {
    debouncedSetFilter(filterText);
    return () => {
      debouncedSetFilter.cancel();
    };
  }, [filterText, debouncedSetFilter]);

  // Memoize filtered initiatives
  const filteredInitiatives = useMemo(() => {
    // Helper to check if any event is in the selected period
    const isInPeriod = (
      eventDate: Date,
      period: 'day' | 'week' | 'month' | '3months' | '6months',
    ) => {
      const now = new Date();
      const diffMs = now.getTime() - eventDate.getTime();
      if (period === 'day') return diffMs <= 1000 * 60 * 60 * 24;
      if (period === 'week') return diffMs <= 1000 * 60 * 60 * 24 * 7;
      if (period === 'month') return diffMs <= 1000 * 60 * 60 * 24 * 30;
      if (period === '3months') return diffMs <= 1000 * 60 * 60 * 24 * 90;
      if (period === '6months') return diffMs <= 1000 * 60 * 60 * 24 * 180;
      return true;
    };
    return initiatives.filter((initiative) => {
      const matchesSearch = initiative.IniTitulo.toLowerCase().includes(
        debouncedFilterText.toLowerCase(),
      );
      const matchesPhase = selectedPhase
        ? initiative.latestEvent.Fase === selectedPhase
        : true;
      let matchesTime = true;
      if (timeFilter) {
        matchesTime = initiative.IniEventos.some((event) => {
          const date = new Date(
            typeof event.DataFase === 'string'
              ? event.DataFase
              : event.DataFase.toISOString(),
          );
          return isInPeriod(date, timeFilter);
        });
      }
      return matchesSearch && matchesPhase && matchesTime;
    });
  }, [initiatives, debouncedFilterText, selectedPhase, timeFilter]);

  const toggleRow = (initiativeId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(initiativeId)) {
        newSet.delete(initiativeId);
      } else {
        newSet.add(initiativeId);
      }
      return newSet;
    });
  };

  // Get unique phases for filter
  const phases = useMemo(() => {
    const phaseSet = new Set<string>();
    for (const initiative of initiatives) {
      if (initiative.latestEvent.Fase) {
        phaseSet.add(initiative.latestEvent.Fase);
      }
    }
    return Array.from(phaseSet);
  }, [initiatives]);

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-bold mb-2">Error loading initiatives</h2>
          <p>
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-5 overflow-hidden">
      <div className="flex-none">
        <h1 className="text-2xl font-bold mb-4">What Happened?</h1>
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded border text-sm transition-colors ${
              timeFilter === 'day'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
            }`}
            type="button"
            onClick={() => setTimeFilter(timeFilter === 'day' ? '' : 'day')}
          >
            Last Day
          </button>
          <button
            className={`px-3 py-1 rounded border text-sm transition-colors ${
              timeFilter === 'week'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
            }`}
            type="button"
            onClick={() => setTimeFilter(timeFilter === 'week' ? '' : 'week')}
          >
            Last Week
          </button>
          <button
            className={`px-3 py-1 rounded border text-sm transition-colors ${
              timeFilter === 'month'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
            }`}
            type="button"
            onClick={() => setTimeFilter(timeFilter === 'month' ? '' : 'month')}
          >
            Last Month
          </button>
          <button
            className={`px-3 py-1 rounded border text-sm transition-colors ${
              timeFilter === '3months'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
            }`}
            type="button"
            onClick={() =>
              setTimeFilter(timeFilter === '3months' ? '' : '3months')
            }
          >
            Last 3 Months
          </button>
          <button
            className={`px-3 py-1 rounded border text-sm transition-colors ${
              timeFilter === '6months'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
            }`}
            type="button"
            onClick={() =>
              setTimeFilter(timeFilter === '6months' ? '' : '6months')
            }
          >
            Last 6 Months
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table.Root>
              <Table.Header>
                <Table.Row className="bg-neutral-2">
                  <Table.ColumnHeaderCell scope="col" className="w-12" />
                  <Table.ColumnHeaderCell scope="col">#</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell scope="col">
                    Phase
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell scope="col">
                    Title
                  </Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell scope="col" className="w-24">
                    Actions
                  </Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {filteredInitiatives.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={5}
                      className="text-center py-8 text-neutral-11"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <FaSearch className="w-6 h-6" aria-hidden="true" />
                        <p>
                          {debouncedFilterText || selectedPhase
                            ? 'No initiatives found matching your criteria.'
                            : 'No initiatives available.'}
                        </p>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  filteredInitiatives.map((initiative) => {
                    const isExpanded = expandedRows.has(initiative.IniId);
                    const duration = calcularDuracao(
                      typeof initiative.IniEventos[0].DataFase === 'string'
                        ? initiative.IniEventos[0].DataFase
                        : initiative.IniEventos[0].DataFase.toISOString(),
                      typeof initiative.latestEvent.DataFase === 'string'
                        ? initiative.latestEvent.DataFase
                        : initiative.latestEvent.DataFase.toISOString(),
                    );
                    const hasVotingPhases = initiative.IniEventos.some(
                      (event) => event.Fase.toLowerCase().includes('votação'),
                    );

                    return (
                      <>
                        <Table.Row
                          key={initiative.IniId}
                          className="hover:bg-neutral-1 transition-colors cursor-pointer"
                          onClick={() => toggleRow(initiative.IniId)}
                        >
                          <Table.Cell className="w-12">
                            {isExpanded ? (
                              <FaChevronDown className="text-neutral-11" />
                            ) : (
                              <FaChevronRight className="text-neutral-11" />
                            )}
                          </Table.Cell>
                          <Table.RowHeaderCell>
                            {initiative.IniNr}
                          </Table.RowHeaderCell>
                          <Table.Cell>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex px-2 py-1 rounded-full text-sm bg-neutral-2">
                                {initiative.latestEvent.Fase?.trim()}
                              </span>
                              {hasVotingPhases && (
                                <FaVoteYea
                                  className="text-neutral-11"
                                  title="Has voting phases"
                                />
                              )}
                              {duration > 180 && (
                                <FaClock
                                  className="text-neutral-11"
                                  title="Long running initiative"
                                />
                              )}
                            </div>
                          </Table.Cell>
                          <Table.Cell>{initiative.IniTitulo}</Table.Cell>
                          <Table.Cell>
                            <Link
                              to={`/initiatives/${initiative.IniId}/details`}
                              className="inline-block px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:underline rounded transition-colors"
                              aria-label={`View details for initiative ${initiative.IniTitulo}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Details
                            </Link>
                          </Table.Cell>
                        </Table.Row>
                        {isExpanded && (
                          <Table.Row className="bg-neutral-1">
                            <Table.Cell colSpan={5} className="p-4">
                              <div className="space-y-6">
                                {/* Description Section */}
                                {initiative.description && (
                                  <div>
                                    <h4 className="font-medium text-sm text-neutral-11 mb-1">
                                      Description
                                    </h4>
                                    <p className="text-neutral-12">
                                      {initiative.description}
                                    </p>
                                  </div>
                                )}

                                {/* Timeline Progress */}
                                <div>
                                  <h4 className="font-medium text-sm text-neutral-11 mb-3">
                                    Timeline Progress
                                  </h4>
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
                                      {initiative.IniEventos.map(
                                        (event, index) => (
                                          <div
                                            key={event.EvtId}
                                            className="flex items-start gap-3"
                                          >
                                            <div className="flex flex-col items-center">
                                              <div
                                                className={`w-2 h-2 rounded-full ${
                                                  event.Fase.toLowerCase().includes(
                                                    'votação',
                                                  )
                                                    ? 'bg-blue-500'
                                                    : 'bg-neutral-6'
                                                }`}
                                              />
                                              {index <
                                                initiative.IniEventos.length -
                                                  1 && (
                                                <div className="w-0.5 h-full bg-neutral-6" />
                                              )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                              <p className="text-sm font-medium text-neutral-12">
                                                {event.Fase}
                                              </p>
                                              <p className="text-sm text-neutral-11">
                                                {formatDate(
                                                  typeof event.DataFase ===
                                                    'string'
                                                    ? event.DataFase
                                                    : event.DataFase.toISOString(),
                                                )}
                                              </p>
                                              {event.Observacoes && (
                                                <p className="text-sm text-neutral-11 mt-1 italic">
                                                  {event.Observacoes}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Voting Information */}
                                {hasVotingPhases && (
                                  <div>
                                    <h4 className="font-medium text-sm text-neutral-11 mb-3">
                                      Voting Information
                                    </h4>
                                    <div className="bg-neutral-2 p-4 rounded-lg">
                                      <div className="flex items-center gap-2 mb-3">
                                        <FaVoteYea className="text-neutral-11" />
                                        <span className="text-sm font-medium">
                                          Voting Phases
                                        </span>
                                      </div>
                                      <div className="space-y-3">
                                        {initiative.IniEventos.filter((event) =>
                                          event.Fase.toLowerCase().includes(
                                            'votação',
                                          ),
                                        ).map((event) => (
                                          <div
                                            key={event.EvtId}
                                            className="flex flex-col gap-1"
                                          >
                                            <p className="text-sm text-neutral-12">
                                              {event.Fase}
                                            </p>
                                            <p className="text-sm text-neutral-11">
                                              {formatDate(
                                                typeof event.DataFase ===
                                                  'string'
                                                  ? event.DataFase
                                                  : event.DataFase.toISOString(),
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
                                    <h4 className="font-medium text-sm text-neutral-11 mb-1">
                                      Type
                                    </h4>
                                    <p className="text-neutral-12">
                                      {initiative.IniTipo === 'P'
                                        ? 'Proposta de Lei'
                                        : initiative.IniTipo}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm text-neutral-11 mb-1">
                                      Latest Update
                                    </h4>
                                    <p className="text-neutral-12">
                                      {formatDate(
                                        typeof initiative.latestEvent
                                          .DataFase === 'string'
                                          ? initiative.latestEvent.DataFase
                                          : initiative.latestEvent.DataFase.toISOString(),
                                      )}
                                    </p>
                                  </div>
                                  {initiative.latestEvent.Responsavel && (
                                    <div>
                                      <h4 className="font-medium text-sm text-neutral-11 mb-1">
                                        Current Responsible
                                      </h4>
                                      <p className="text-neutral-12">
                                        {initiative.latestEvent.Responsavel}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Related Initiatives */}
                                {initiatives
                                  .filter(
                                    (ini) =>
                                      ini.IniId !== initiative.IniId &&
                                      (ini.IniTipo === initiative.IniTipo ||
                                        initiative.IniTitulo.split(' ').some(
                                          (word) =>
                                            ini.IniTitulo.toLowerCase().includes(
                                              word.toLowerCase(),
                                            ),
                                        )),
                                  )
                                  .slice(0, 3).length > 0 && (
                                  <div>
                                    <h4 className="font-medium text-sm text-neutral-11 mb-3">
                                      Related Initiatives
                                    </h4>
                                    <div className="grid gap-3">
                                      {initiatives
                                        .filter(
                                          (ini) =>
                                            ini.IniId !== initiative.IniId &&
                                            (ini.IniTipo ===
                                              initiative.IniTipo ||
                                              initiative.IniTitulo.split(
                                                ' ',
                                              ).some((word) =>
                                                ini.IniTitulo.toLowerCase().includes(
                                                  word.toLowerCase(),
                                                ),
                                              )),
                                        )
                                        .slice(0, 3)
                                        .map((relatedInitiative) => (
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
                                                {relatedInitiative.IniTipo ===
                                                'P'
                                                  ? 'Proposta de Lei'
                                                  : relatedInitiative.IniTipo}
                                              </span>
                                            </div>
                                            <p className="text-sm text-neutral-12">
                                              {relatedInitiative.IniTitulo}
                                            </p>
                                          </Link>
                                        ))}
                                    </div>
                                  </div>
                                )}

                                {/* Latest Observations */}
                                {initiative.latestEvent.Observacoes && (
                                  <div>
                                    <h4 className="font-medium text-sm text-neutral-11 mb-1">
                                      Latest Observations
                                    </h4>
                                    <p className="text-neutral-12">
                                      {initiative.latestEvent.Observacoes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        )}
                      </>
                    );
                  })
                )}
              </Table.Body>
            </Table.Root>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatHappened;

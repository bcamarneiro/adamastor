import * as Accordion from '@radix-ui/react-accordion';
import { useVirtualizer } from '@tanstack/react-virtual';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown, FaSearch } from 'react-icons/fa';
import { Spinner } from '../../../components/Spinner';
import { useInitiatives } from '../../../services/initiatives/useInitiatives';
import { buildRelatedInitiativesMap } from '../../../utils/relatedInitiatives';
import InitiativeRow, { type InitiativeData } from './InitiativeRow';

// Grid column classes for consistent layout (matching InitiativeRow)
const gridColsClass = 'grid grid-cols-[48px_auto_auto_1fr_96px] items-center';

// Estimated row heights for virtualization
const COLLAPSED_ROW_HEIGHT = 48;
const EXPANDED_ROW_HEIGHT = 400; // Estimated height for expanded rows

const InitiativeList = () => {
  const { initiatives, metadata, isLoading, isError, error } = useInitiatives();
  const [filterText, setFilterText] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [debouncedFilterText, setDebouncedFilterText] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Ref for the scroll container used by the virtualizer
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Debounce filter text updates
  const debouncedSetFilter = useMemo(
    () => debounce((value: string) => setDebouncedFilterText(value), 300),
    []
  );

  useEffect(() => {
    debouncedSetFilter(filterText);
    return () => {
      debouncedSetFilter.cancel();
    };
  }, [filterText, debouncedSetFilter]);

  // Memoize filtered initiatives
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter((initiative) => {
      const matchesSearch = initiative.IniTitulo.toLowerCase().includes(
        debouncedFilterText.toLowerCase()
      );
      const matchesPhase = selectedPhase ? initiative.latestEvent.Fase === selectedPhase : true;
      return matchesSearch && matchesPhase;
    });
  }, [initiatives, debouncedFilterText, selectedPhase]);

  // Memoize toggle callback to prevent unnecessary re-renders in virtualized rows
  const toggleRow = useCallback((initiativeId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(initiativeId)) {
        newSet.delete(initiativeId);
      } else {
        newSet.add(initiativeId);
      }
      return newSet;
    });
  }, []);

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

  // Precompute related initiatives map once when initiatives change
  // This avoids O(n²) computation on every render
  const relatedInitiativesMap = useMemo(
    () => buildRelatedInitiativesMap(initiatives),
    [initiatives]
  );

  // Clear expanded rows that are no longer in filtered results
  // This prevents stale expanded state for filtered-out items
  useEffect(() => {
    setExpandedRows((prev) => {
      if (prev.size === 0) return prev;

      const filteredIds = new Set(filteredInitiatives.map((i) => i.IniId));
      const hasStaleExpanded = Array.from(prev).some((id) => !filteredIds.has(id));

      if (!hasStaleExpanded) return prev;

      const newSet = new Set<string>();
      for (const id of prev) {
        if (filteredIds.has(id)) {
          newSet.add(id);
        }
      }
      return newSet;
    });
    // Only depend on filteredInitiatives, not expandedRows (would cause infinite loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInitiatives]);

  // Track previous filter values to detect meaningful changes
  const prevFilterRef = useRef({ filterText: debouncedFilterText, phase: selectedPhase });

  // Reset scroll position to top when filters change
  // This provides a consistent UX when searching or filtering
  useEffect(() => {
    const prevFilter = prevFilterRef.current;
    const filterChanged =
      prevFilter.filterText !== debouncedFilterText || prevFilter.phase !== selectedPhase;

    if (filterChanged && scrollContainerRef.current) {
      // Use smooth scrolling for a polished feel
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }

    // Update the ref for next comparison
    prevFilterRef.current = { filterText: debouncedFilterText, phase: selectedPhase };
  }, [debouncedFilterText, selectedPhase]);

  // Memoize virtualizer configuration functions to prevent unnecessary recreations
  const getScrollElement = useCallback(() => scrollContainerRef.current, []);

  const estimateSize = useCallback(
    (index: number) => {
      const initiative = filteredInitiatives[index];
      if (!initiative) return COLLAPSED_ROW_HEIGHT;
      return expandedRows.has(initiative.IniId) ? EXPANDED_ROW_HEIGHT : COLLAPSED_ROW_HEIGHT;
    },
    [filteredInitiatives, expandedRows]
  );

  const getItemKey = useCallback(
    (index: number) => filteredInitiatives[index]?.IniId ?? `fallback-${index}`,
    [filteredInitiatives]
  );

  // Set up the virtualizer for efficient rendering of large lists
  // Only enable when we have data to virtualize
  const virtualizer = useVirtualizer({
    count: filteredInitiatives.length,
    getScrollElement,
    estimateSize,
    getItemKey,
    overscan: 5, // Render 5 extra rows above/below viewport for smooth scrolling
    enabled: !isLoading && filteredInitiatives.length > 0,
  });

  // Force remeasurement when expanded rows change
  useLayoutEffect(() => {
    virtualizer.measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRows]);

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-bold mb-2">Error loading initiatives</h2>
          <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-5 overflow-hidden">
      <div className="flex-none">
        <h1 className="text-2xl font-bold mb-4">Initiatives List</h1>

        <Accordion.Root type="single" collapsible className="mb-6">
          <Accordion.Item value="details" className="border rounded-lg overflow-hidden">
            <Accordion.Header className="bg-neutral-2">
              <Accordion.Trigger className="w-full flex items-center justify-between p-4 hover:bg-neutral-3 transition-colors">
                <span className="font-medium text-neutral-12">Statistics Overview</span>
                <FaChevronDown className="text-neutral-11 transition-transform ui-expanded:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="p-4 bg-white">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-2 p-4 rounded-lg">
                  <span className="text-neutral-11 text-sm">Total Initiatives</span>
                  <p className="text-2xl font-bold mt-1">{metadata.total}</p>
                </div>
                {Object.entries(metadata?.totalByFase ?? {}).map(([key, value]) => {
                  return metadata.fasesList ? (
                    <div key={key} className="bg-neutral-2 p-4 rounded-lg">
                      <span className="text-neutral-11 text-sm">{metadata.fasesList[key]}</span>
                      <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                  ) : null;
                })}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search initiatives..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setFilterText('');
                }
              }}
              className="w-full px-4 py-2 rounded-lg border border-neutral-6 bg-neutral-2 focus:ring-2 focus:ring-accent-9 focus:border-transparent transition-all"
              aria-label="Search initiatives"
            />
            <FaSearch
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-11"
              aria-hidden="true"
            />
          </div>
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="px-4 py-2 rounded-lg border border-neutral-6 bg-neutral-2 focus:ring-2 focus:ring-accent-9 focus:border-transparent transition-all"
            aria-label="Filter by phase"
          >
            <option value="">All Phases</option>
            {phases.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div
            className="flex justify-center items-center h-full min-h-64 transition-opacity duration-200"
            role="status"
            aria-label="Loading initiatives"
          >
            <Spinner size="lg" />
          </div>
        ) : (
          <div role="table" aria-label="Initiatives list" className="flex flex-col min-h-0 h-full">
            {/* Sticky Header */}
            <div role="rowgroup" className="flex-none bg-neutral-2 border-b border-neutral-3">
              <div role="row" className={gridColsClass}>
                <div role="columnheader" className="p-3" aria-label="Expand/collapse">
                  <span className="sr-only">Expand</span>
                </div>
                <div role="columnheader" className="p-3 font-semibold text-neutral-12">
                  #
                </div>
                <div role="columnheader" className="p-3 font-semibold text-neutral-12">
                  Phase
                </div>
                <div role="columnheader" className="p-3 font-semibold text-neutral-12">
                  Title
                </div>
                <div role="columnheader" className="p-3 font-semibold text-neutral-12">
                  Actions
                </div>
              </div>
            </div>

            {/* Virtualized Table Body */}
            <div ref={scrollContainerRef} role="rowgroup" className="flex-1 overflow-auto">
              {filteredInitiatives.length === 0 ? (
                <div
                  role="row"
                  className="flex items-center justify-center h-full min-h-48 text-neutral-11 transition-opacity duration-200"
                >
                  <div role="cell" className="flex flex-col items-center gap-3 p-8">
                    <FaSearch className="w-8 h-8 opacity-50" aria-hidden="true" />
                    <p className="text-center">
                      {debouncedFilterText || selectedPhase
                        ? 'No initiatives found matching your criteria.'
                        : 'No initiatives available.'}
                    </p>
                    {(debouncedFilterText || selectedPhase) && (
                      <p className="text-sm text-neutral-9">
                        Try adjusting your search or filter settings.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const initiative = filteredInitiatives[virtualRow.index];
                    // Defensive check: skip rendering if initiative is undefined
                    // This can happen briefly during rapid filter changes
                    if (!initiative) return null;

                    const isExpanded = expandedRows.has(initiative.IniId);
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <InitiativeRow
                          initiative={initiative as InitiativeData}
                          isExpanded={isExpanded}
                          onToggle={toggleRow}
                          relatedInitiatives={relatedInitiativesMap.get(initiative.IniId) ?? []}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitiativeList;

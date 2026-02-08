import { motion } from 'framer-motion';
import { Building, Filter, Landmark, MapPin, Search, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/data/EmptyState';
import { ErrorState } from '@/components/data/ErrorState';
import { LoadingState } from '@/components/data/LoadingState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { StatCard } from '@/components/layout/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PARTY_COLORS } from '@/services/parliament/constants';
import { useParliament } from '@/services/parliament/useParliament';

const ParliamentList = () => {
  const { parliament, metadata, isLoading, isError, error } = useParliament();
  const [filterText, setFilterText] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Memoize filtered MPs
  const filteredMPs = useMemo(() => {
    if (!parliament?.Deputados) return [];
    return parliament.Deputados.filter((mp) => {
      const matchesSearch =
        mp.DepNomeCompleto.toLowerCase().includes(filterText.toLowerCase()) ||
        mp.DepNomeParlamentar.toLowerCase().includes(filterText.toLowerCase());
      const matchesDistrict = selectedDistrict ? mp.DepCPDes === selectedDistrict : true;
      const matchesParty = selectedParty
        ? mp.DepGP[mp.DepGP.length - 1]?.gpSigla === selectedParty
        : true;
      return matchesSearch && matchesDistrict && matchesParty;
    });
  }, [parliament?.Deputados, filterText, selectedDistrict, selectedParty]);

  // Get unique parties for filter
  const parties = useMemo(() => {
    if (!parliament?.Deputados) return [];
    const partySet = new Set<string>();
    for (const mp of parliament.Deputados) {
      const currentParty = mp.DepGP[mp.DepGP.length - 1]?.gpSigla;
      if (currentParty) {
        partySet.add(currentParty);
      }
    }
    return Array.from(partySet).sort();
  }, [parliament?.Deputados]);

  // Get districts for filter
  const districts = useMemo(() => {
    if (!parliament?.CirculosEleitorais) return [];
    return parliament.CirculosEleitorais.sort((a, b) => a.cpDes.localeCompare(b.cpDes));
  }, [parliament?.CirculosEleitorais]);

  // Check if any filters are active
  const hasActiveFilters = filterText || selectedDistrict || selectedParty;

  // Clear all filters
  const clearFilters = () => {
    setFilterText('');
    setSelectedDistrict('');
    setSelectedParty('');
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-neutral-1">
        <PageHeader
          title="Parlamento"
          description="Explore os deputados da Assembleia da República."
          breadcrumbs={[{ label: 'Início', href: '/' }, { label: 'Parlamento' }]}
        />
        <Section size="lg">
          <ErrorState
            title="Erro ao carregar dados"
            error={error instanceof Error ? error : null}
          />
        </Section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-1">
      {/* Header */}
      <PageHeader
        title="Parlamento"
        description="Conhece os 230 deputados eleitos para a Assembleia da República e os círculos eleitorais que representam."
        breadcrumbs={[{ label: 'Início', href: '/' }, { label: 'Parlamento' }]}
      />

      {/* Stats Section */}
      <Section variant="muted" size="sm">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <LoadingState variant="grid" count={3} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              value={metadata?.total || 0}
              label="Deputados"
              description="Na legislatura atual"
              icon={<Users className="h-6 w-6" />}
              variant="accent"
            />
            <StatCard
              value={districts.length}
              label="Círculos Eleitorais"
              description="Incluindo Europa e Fora da Europa"
              icon={<MapPin className="h-6 w-6" />}
            />
            <StatCard
              value={parties.length}
              label="Partidos"
              description="Com representação parlamentar"
              icon={<Landmark className="h-6 w-6" />}
            />
          </div>
        )}
      </Section>

      {/* Filters and List Section */}
      <Section size="md">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-9" />
              <input
                type="text"
                placeholder="Pesquisar deputados..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-4 bg-white focus:ring-2 focus:ring-accent-9 focus:border-transparent transition-all text-neutral-12 placeholder:text-neutral-9"
                aria-label="Pesquisar deputados"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-9 hover:text-neutral-12"
                  aria-label="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle (Mobile) */}
            <Button
              variant="outline"
              className="sm:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 bg-accent-9 text-white px-2 py-0.5 rounded-full text-xs">
                  {[selectedDistrict, selectedParty].filter(Boolean).length}
                </span>
              )}
            </Button>

            {/* Filters (Desktop always visible, Mobile toggle) */}
            <div
              className={cn(
                'flex flex-col sm:flex-row gap-3',
                showFilters ? 'flex' : 'hidden sm:flex'
              )}
            >
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-4 py-3 rounded-xl border border-neutral-4 bg-white focus:ring-2 focus:ring-accent-9 focus:border-transparent transition-all text-neutral-12 min-w-[160px]"
                aria-label="Filtrar por círculo"
              >
                <option value="">Todos os círculos</option>
                {districts.map((district) => (
                  <option key={district.cpId} value={district.cpDes}>
                    {district.cpDes}
                  </option>
                ))}
              </select>

              <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="px-4 py-3 rounded-xl border border-neutral-4 bg-white focus:ring-2 focus:ring-accent-9 focus:border-transparent transition-all text-neutral-12 min-w-[140px]"
                aria-label="Filtrar por partido"
              >
                <option value="">Todos os partidos</option>
                {parties.map((party) => (
                  <option key={party} value={party}>
                    {party}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
              <span className="text-sm text-neutral-11">Filtros ativos:</span>
              {filterText && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Pesquisa: "{filterText}"
                  <button
                    type="button"
                    onClick={() => setFilterText('')}
                    className="ml-1 hover:text-danger-9"
                    aria-label="Remover filtro de pesquisa"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedDistrict && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {selectedDistrict}
                  <button
                    type="button"
                    onClick={() => setSelectedDistrict('')}
                    className="ml-1 hover:text-danger-9"
                    aria-label="Remover filtro de círculo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedParty && (
                <Badge
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: PARTY_COLORS[selectedParty] || '#666',
                    color: 'white',
                  }}
                >
                  {selectedParty}
                  <button
                    type="button"
                    onClick={() => setSelectedParty('')}
                    className="ml-1 hover:opacity-70"
                    aria-label="Remover filtro de partido"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-neutral-11 hover:text-neutral-12"
              >
                Limpar todos
              </Button>
            </motion.div>
          )}
        </div>

        {/* Results Count */}
        {!isLoading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-neutral-11">
              {hasActiveFilters ? (
                <>
                  <span className="font-semibold text-neutral-12">{filteredMPs.length}</span>{' '}
                  {filteredMPs.length === 1 ? 'deputado encontrado' : 'deputados encontrados'}
                </>
              ) : (
                <>
                  A mostrar{' '}
                  <span className="font-semibold text-neutral-12">{filteredMPs.length}</span>{' '}
                  deputados
                </>
              )}
            </p>
          </div>
        )}

        {/* Deputies Grid */}
        {isLoading ? (
          <LoadingState variant="card" count={12} />
        ) : filteredMPs.length === 0 ? (
          <EmptyState
            variant="users"
            action={
              hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMPs.map((mp, index) => {
              const currentParty = mp.DepGP[mp.DepGP.length - 1]?.gpSigla;
              const currentStatus = mp.DepSituacao[mp.DepSituacao.length - 1]?.sioDes;
              const partyColor = PARTY_COLORS[currentParty] || '#666';

              return (
                <motion.div
                  key={mp.DepId}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.4 }}
                  className="group rounded-xl border border-neutral-4 bg-white p-4 hover:border-accent-7 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar placeholder */}
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${partyColor}20` }}
                    >
                      <Building className="h-6 w-6" style={{ color: partyColor }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-neutral-12 truncate group-hover:text-accent-9 transition-colors">
                        {mp.DepNomeParlamentar}
                      </div>
                      <div className="text-sm text-neutral-11 truncate">{mp.DepNomeCompleto}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {currentParty && (
                          <Badge
                            style={{
                              backgroundColor: partyColor,
                              color: 'white',
                            }}
                          >
                            {currentParty}
                          </Badge>
                        )}
                        <span className="text-xs text-neutral-9">{mp.DepCPDes}</span>
                      </div>
                      {currentStatus && currentStatus !== 'Efetivo' && (
                        <Badge variant="secondary" className="mt-2">
                          {currentStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
};

export default ParliamentList;

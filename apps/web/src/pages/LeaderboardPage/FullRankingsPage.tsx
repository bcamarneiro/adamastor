import Footer from '@/components/Footer';
import { FullRankings } from '@/components/Leaderboard/FullRankings';
import { LegislatureBadge } from '@/components/LegislatureBadge';
import MainNav from '@/components/MainNav';
import { SEO } from '@/components/SEO';
import PageHeader from '@/components/layout/PageHeader';
import Section from '@/components/layout/Section';
import StatCard from '@/components/layout/StatCard';
import { type District, type Party, supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Filter, TrendingUp, Users, X } from 'lucide-react';
import { useState } from 'react';
const GRADES = ['A', 'B', 'C', 'D', 'F'] as const;

const gradeColors: Record<string, string> = {
  A: 'bg-success-3 text-success-11 border-success-6',
  B: 'bg-accent-3 text-accent-11 border-accent-6',
  C: 'bg-warning-3 text-warning-11 border-warning-6',
  D: 'bg-danger-3 text-danger-11 border-danger-6',
  F: 'bg-danger-4 text-danger-12 border-danger-7',
};

async function fetchParties(): Promise<Party[]> {
  const { data, error } = await supabase.from('parties').select('*').order('acronym');

  if (error) {
    console.error('Error fetching parties:', error);
    return [];
  }
  return data || [];
}

async function fetchDistricts(): Promise<District[]> {
  const { data, error } = await supabase.from('districts').select('*').order('name');

  if (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
  return data || [];
}

async function fetchAggregateStats() {
  const { data, error } = await supabase
    .from('deputy_detail')
    .select('work_score, grade')
    .not('work_score', 'is', null);

  if (error) {
    console.error('Error fetching aggregate stats:', error);
    return { totalDeputies: 0, avgScore: 0, gradeDistribution: {} as Record<string, number> };
  }

  const totalDeputies = data.length;
  const avgScore = data.reduce((sum, d) => sum + (d.work_score || 0), 0) / totalDeputies;
  const gradeDistribution = data.reduce(
    (acc, d) => {
      const grade = d.grade || 'F';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return { totalDeputies, avgScore, gradeDistribution };
}

export function FullRankingsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);

  const { data: parties = [] } = useQuery({
    queryKey: ['parties'],
    queryFn: fetchParties,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - static reference data
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['districts'],
    queryFn: fetchDistricts,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - static reference data
  });

  const { data: stats } = useQuery({
    queryKey: ['aggregate-stats'],
    queryFn: fetchAggregateStats,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const clearFilters = () => {
    setSelectedParty(null);
    setSelectedDistrict(null);
    setSelectedGrade(null);
  };

  const hasFilters = selectedParty || selectedDistrict || selectedGrade;
  const filterCount = [selectedParty, selectedDistrict, selectedGrade].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO
        title="Ranking Completo de Deputados"
        description="Ranking completo de todos os deputados portugueses da legislatura atual, ordenados por desempenho parlamentar."
        url="/ranking/completo"
      />
      <MainNav scrollY={0} />

      <PageHeader
        variant="dark"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Ranking', href: '/ranking' },
          { label: 'Completo' },
        ]}
        title={
          <div className="flex flex-col gap-2">
            <span className="font-serif text-sm uppercase tracking-widest text-accent-11">
              Todos os Deputados
            </span>
            <div className="flex items-center gap-3">
              <span>Ranking Completo</span>
              <LegislatureBadge />
            </div>
          </div>
        }
        description="Todos os deputados da legislatura atual ordenados por desempenho"
        actions={
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-full h-12 px-6 font-semibold transition-colors ${
              showFilters || hasFilters
                ? 'bg-white text-neutral-12 hover:bg-neutral-3'
                : 'bg-neutral-11 text-white hover:bg-neutral-10'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {hasFilters && (
              <span className="bg-accent-9 text-white text-xs px-2 py-0.5 rounded-full">
                {filterCount}
              </span>
            )}
          </button>
        }
      />

      {/* Stats Section */}
      {stats && (
        <Section variant="light" size="sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              value={stats.totalDeputies}
              label="Total de Deputados"
              description="Na legislatura atual"
              icon={<Users className="w-6 h-6" />}
              variant="accent"
            />
            <StatCard
              value={stats.avgScore.toFixed(1)}
              label="Pontuação Média"
              description="Média de todos os deputados"
              icon={<BarChart3 className="w-6 h-6" />}
              variant="default"
            />
            <StatCard
              value={stats.gradeDistribution.A || 0}
              label="Deputados com Nota A"
              description="Melhor desempenho"
              icon={<TrendingUp className="w-6 h-6" />}
              variant="success"
            />
          </div>
        </Section>
      )}

      <Section variant="muted" size="md">
        <div className="max-w-4xl mx-auto">

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-neutral-1 rounded-2xl p-6 mb-6 border border-neutral-5 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="party-filter"
                    className="block text-sm font-semibold text-neutral-12 mb-2"
                  >
                    Partido
                  </label>
                  <select
                    id="party-filter"
                    value={selectedParty || ''}
                    onChange={(e) => setSelectedParty(e.target.value || null)}
                    className="w-full h-12 px-4 bg-neutral-2 border border-neutral-6 rounded-full text-neutral-12 focus:ring-2 focus:ring-accent-7 focus:border-accent-7 transition-all"
                  >
                    <option value="">Todos os partidos</option>
                    {parties.map((party) => (
                      <option key={party.id} value={party.id}>
                        {party.acronym} - {party.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="district-filter"
                    className="block text-sm font-semibold text-neutral-12 mb-2"
                  >
                    Distrito
                  </label>
                  <select
                    id="district-filter"
                    value={selectedDistrict || ''}
                    onChange={(e) => setSelectedDistrict(e.target.value || null)}
                    className="w-full h-12 px-4 bg-neutral-2 border border-neutral-6 rounded-full text-neutral-12 focus:ring-2 focus:ring-accent-7 focus:border-accent-7 transition-all"
                  >
                    <option value="">Todos os distritos</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <fieldset className="border-0 p-0 m-0">
                  <legend className="block text-sm font-semibold text-neutral-12 mb-2">
                    Classificacao
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => setSelectedGrade(selectedGrade === grade ? null : grade)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                          selectedGrade === grade
                            ? `${gradeColors[grade]} ring-2 ring-accent-9`
                            : 'bg-neutral-2 text-neutral-11 border-neutral-6 hover:bg-neutral-3 hover:border-neutral-7'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-9 hover:text-accent-10 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          <FullRankings
            partyId={selectedParty}
            districtId={selectedDistrict}
            grade={selectedGrade}
          />
        </div>
      </Section>

      <Footer />
    </div>
  );
}

export default FullRankingsPage;

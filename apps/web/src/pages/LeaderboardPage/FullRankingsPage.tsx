import Footer from '@/components/Footer';
import { FullRankings } from '@/components/Leaderboard/FullRankings';
import MainNav from '@/components/MainNav';
import { type District, type Party, supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Filter } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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

export function FullRankingsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const { data: parties = [] } = useQuery({
    queryKey: ['parties'],
    queryFn: fetchParties,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const { data: districts = [] } = useQuery({
    queryKey: ['districts'],
    queryFn: fetchDistricts,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const clearFilters = () => {
    setSelectedParty(null);
    setSelectedDistrict(null);
  };

  const hasFilters = selectedParty || selectedDistrict;

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <Link
          to="/ranking"
          className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-12 mb-2">Ranking Completo</h1>
            <p className="text-neutral-11">Todos os 230 deputados ordenados por desempenho</p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilters || hasFilters
                ? 'bg-accent-9 text-monochrome-white'
                : 'bg-neutral-3 text-neutral-11 hover:bg-neutral-4'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {hasFilters && (
              <span className="bg-monochrome-white text-accent-9 text-xs px-1.5 py-0.5 rounded-full">
                {[selectedParty, selectedDistrict].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-neutral-1 rounded-xl p-4 mb-6 border border-neutral-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-11 mb-2">Partido</label>
                <select
                  value={selectedParty || ''}
                  onChange={(e) => setSelectedParty(e.target.value || null)}
                  className="w-full px-3 py-2 bg-neutral-2 border border-neutral-5 rounded-lg text-neutral-12 focus:ring-2 focus:ring-accent-9 focus:border-accent-9"
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
                <label className="block text-sm font-medium text-neutral-11 mb-2">Distrito</label>
                <select
                  value={selectedDistrict || ''}
                  onChange={(e) => setSelectedDistrict(e.target.value || null)}
                  className="w-full px-3 py-2 bg-neutral-2 border border-neutral-5 rounded-lg text-neutral-12 focus:ring-2 focus:ring-accent-9 focus:border-accent-9"
                >
                  <option value="">Todos os distritos</option>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-accent-9 hover:text-accent-10"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        <FullRankings partyId={selectedParty} districtId={selectedDistrict} />
      </main>

      <Footer />
    </div>
  );
}

export default FullRankingsPage;

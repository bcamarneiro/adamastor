import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { PartyCard } from '@/components/Parties';
import { SEO, SEO_CONFIGS } from '@/components/SEO';
import { usePartyStats } from '@/services/parties';
import { ArrowLeft, Scale, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PartiesPage() {
  const { data: parties, isLoading, error } = usePartyStats();

  const totalDeputies = parties?.reduce((sum, p) => sum + p.deputy_count, 0) ?? 0;
  const avgScore =
    parties && parties.length > 0
      ? parties.reduce((sum, p) => sum + (p.avg_work_score ?? 0), 0) / parties.length
      : 0;

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO {...SEO_CONFIGS.parties} url="/partidos" />
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-12 mb-2">Partidos</h1>
          <p className="text-neutral-11">Compara o desempenho dos partidos politicos portugueses</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            to="/partidos/comparar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 transition-colors font-medium"
          >
            <Scale className="w-4 h-4" />
            Comparar Partidos
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center">
            <div className="text-2xl font-bold text-neutral-12">{parties?.length ?? 0}</div>
            <div className="text-sm text-neutral-11">Partidos</div>
          </div>
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-accent-9" />
            <div className="text-2xl font-bold text-neutral-12">{totalDeputies}</div>
            <div className="text-sm text-neutral-11">Deputados</div>
          </div>
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center col-span-2 md:col-span-1">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-warning-9" />
            <div className="text-2xl font-bold text-neutral-12">{avgScore.toFixed(1)}</div>
            <div className="text-sm text-neutral-11">Media Global</div>
          </div>
        </div>

        {/* Party List */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-9" />
          </div>
        )}

        {error && (
          <div className="bg-danger-3 text-danger-11 p-4 rounded-xl text-center">
            Erro ao carregar partidos. Tenta novamente mais tarde.
          </div>
        )}

        {parties && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-12 mb-4">
              Ranking por Pontuacao Media
            </h2>
            {parties.map((party, index) => (
              <PartyCard key={party.id} party={party} rank={index + 1} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default PartiesPage;

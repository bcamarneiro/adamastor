import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { DistrictCard, PortugalMap } from '@/components/Districts';
import { SEO } from '@/components/SEO';
import { HELP_TEXTS, HelpTooltip } from '@/components/ui/HelpTooltip';
import { useDistrictStats } from '@/services/districts';
import { ArrowLeft, MapPin, Scale, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DistrictsPage() {
  const { data: districts, isLoading, error } = useDistrictStats();

  const totalDeputies = districts?.reduce((sum, d) => sum + d.active_deputies, 0) ?? 0;
  const avgScore =
    districts && districts.length > 0
      ? districts.reduce((sum, d) => sum + (d.avg_work_score ?? 0), 0) / districts.length
      : 0;

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO
        title="Distritos"
        description="Compara o desempenho dos circulos eleitorais portugueses. Ve qual distrito tem os deputados mais trabalhadores."
        url="/distritos"
      />
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
          <h1 className="text-3xl font-bold text-neutral-12 mb-2">Distritos</h1>
          <p className="text-neutral-11">
            Compara o desempenho dos circulos eleitorais portugueses
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            to="/distritos/comparar"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 transition-colors font-medium"
          >
            <Scale className="w-4 h-4" />
            Comparar Distritos
          </Link>
        </div>

        {/* Map */}
        {districts && (
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 mb-8">
            <h2 className="text-lg font-semibold text-neutral-12 mb-4 text-center">
              Mapa de Portugal
            </h2>
            <PortugalMap districts={districts} className="max-w-md mx-auto" />
            <p className="text-xs text-neutral-10 text-center mt-2">
              Clica num distrito para ver os seus deputados
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center">
            <MapPin className="w-5 h-5 mx-auto mb-1 text-accent-9" />
            <div className="text-2xl font-bold text-neutral-12">{districts?.length ?? 0}</div>
            <div className="text-sm text-neutral-11">Distritos</div>
          </div>
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-success-9" />
            <div className="text-2xl font-bold text-neutral-12">{totalDeputies}</div>
            <div className="text-sm text-neutral-11">Deputados</div>
          </div>
          <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5 text-center col-span-2 md:col-span-1">
            <div className="text-2xl font-bold text-neutral-12">{avgScore.toFixed(1)}</div>
            <div className="text-sm text-neutral-11">Media Global</div>
          </div>
        </div>

        {/* District List */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-9" />
          </div>
        )}

        {error && (
          <div className="bg-danger-3 text-danger-11 p-4 rounded-xl text-center">
            Erro ao carregar distritos. Tenta novamente mais tarde.
          </div>
        )}

        {districts && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-12 mb-4 flex items-center gap-1">
              Ranking por Pontuacao Media
              <HelpTooltip content={HELP_TEXTS.districtRanking} />
            </h2>
            {districts.map((district, index) => (
              <DistrictCard key={district.id} district={district} rank={index + 1} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default DistrictsPage;

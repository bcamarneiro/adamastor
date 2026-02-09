import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { ReportCardDetail } from '@/components/ReportCard/ReportCardDetail';
import { ShareButton } from '@/components/ReportCard/ShareButton';
import { SEO, getDeputySchema } from '@/components/SEO';
import { useDeputyDetail } from '@/services/reportCard/useDeputyDetail';
import { useDeputyExtendedInfo } from '@/services/reportCard/useDeputyExtendedInfo';
import { useNationalAverages } from '@/services/reportCard/useNationalAverages';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export function DeputyPage() {
  const { deputyId } = useParams<{ deputyId: string }>();
  const navigate = useNavigate();

  const {
    data: deputy,
    isLoading: deputyLoading,
    error: deputyError,
  } = useDeputyDetail(deputyId || null);
  const { data: averages } = useNationalAverages();
  const { data: extendedInfo } = useDeputyExtendedInfo(deputy?.id || null);

  if (deputyLoading) {
    return (
      <div className="min-h-screen bg-neutral-2 flex flex-col">
        <MainNav scrollY={0} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-neutral-9">A carregar...</div>
        </main>
      </div>
    );
  }

  if (deputyError || !deputy) {
    return (
      <div className="min-h-screen bg-neutral-2 flex flex-col">
        <MainNav scrollY={0} />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-neutral-12 mb-4">Deputado nao encontrado</h1>
          <button onClick={() => navigate(-1)} className="text-accent-9 hover:underline">
            Voltar ao inicio
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const deputySchema = getDeputySchema({
    name: deputy.name,
    party: deputy.party_acronym,
    district: deputy.district_name,
    photoUrl: deputy.photo_url,
  });

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO
        title={deputy.name}
        description={`Perfil do deputado ${deputy.name} (${deputy.party_acronym || 'Independente'}). Nota: ${deputy.grade || 'N/A'}. Vê a assiduidade, propostas e intervenções.`}
        url={`/deputado/${deputyId}`}
        type="profile"
        structuredData={deputySchema}
      />
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <ShareButton deputy={deputy} />
        </div>

        <ReportCardDetail deputy={deputy} averages={averages || null} extendedInfo={extendedInfo} />

        {/* Cross-links Section */}
        <div className="mt-8 bg-neutral-1 rounded-xl p-6 border border-neutral-5">
          <h2 className="text-lg font-semibold text-neutral-12 mb-4">Ver também</h2>
          <div className="space-y-3">
            {deputy.party_acronym && (
              <Link
                to={`/partidos/${deputy.party_acronym.toLowerCase()}`}
                className="flex items-center justify-between p-3 bg-neutral-2 hover:bg-neutral-3 rounded-lg transition-colors group"
              >
                <span className="text-neutral-12">
                  Partido <strong>{deputy.party_acronym}</strong>
                </span>
                <ExternalLink className="w-4 h-4 text-neutral-11 group-hover:text-accent-9 transition-colors" />
              </Link>
            )}
            {deputy.district_name && (
              <Link
                to={`/distrito/${deputy.district_name.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center justify-between p-3 bg-neutral-2 hover:bg-neutral-3 rounded-lg transition-colors group"
              >
                <span className="text-neutral-12">
                  Deputados de <strong>{deputy.district_name}</strong>
                </span>
                <ExternalLink className="w-4 h-4 text-neutral-11 group-hover:text-accent-9 transition-colors" />
              </Link>
            )}
            <Link
              to="/initiatives"
              className="flex items-center justify-between p-3 bg-neutral-2 hover:bg-neutral-3 rounded-lg transition-colors group"
            >
              <span className="text-neutral-12">
                Todas as <strong>Iniciativas Legislativas</strong>
              </span>
              <ExternalLink className="w-4 h-4 text-neutral-11 group-hover:text-accent-9 transition-colors" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default DeputyPage;

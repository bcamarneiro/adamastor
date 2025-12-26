import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { ReportCardDetail } from '@/components/ReportCard/ReportCardDetail';
import { ShareButton } from '@/components/ReportCard/ShareButton';
import { useDeputyDetail } from '@/services/reportCard/useDeputyDetail';
import { useDeputyExtendedInfo } from '@/services/reportCard/useDeputyExtendedInfo';
import { useNationalAverages } from '@/services/reportCard/useNationalAverages';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export function DeputyPage() {
  const { deputyId } = useParams<{ deputyId: string }>();

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
          <Link to="/report-card" className="text-accent-9 hover:underline">
            Voltar ao inicio
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            to={deputy.district_slug ? `/distrito/${deputy.district_slug}` : '/report-card'}
            className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Link>

          <ShareButton deputy={deputy} />
        </div>

        <ReportCardDetail deputy={deputy} averages={averages || null} extendedInfo={extendedInfo} />
      </main>

      <Footer />
    </div>
  );
}

export default DeputyPage;

import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { PartyComparison } from '@/components/Parties';
import { SEO } from '@/components/SEO';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PartyComparisonPage() {
  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO
        title="Comparar Partidos"
        description="Compara dois partidos politicos portugueses e descobre qual tem melhor desempenho parlamentar."
        url="/partidos/comparar"
      />
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          to="/partidos"
          className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ver todos os partidos</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-12 mb-2">Comparar Partidos</h1>
          <p className="text-neutral-11">
            Seleciona dois partidos para comparar o seu desempenho parlamentar
          </p>
        </div>

        <PartyComparison />
      </main>

      <Footer />
    </div>
  );
}

export default PartyComparisonPage;

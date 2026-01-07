import Footer from '@/components/Footer';
import { Leaderboard } from '@/components/Leaderboard';
import { LegislatureBadge } from '@/components/LegislatureBadge';
import MainNav from '@/components/MainNav';
import { SEO, SEO_CONFIGS } from '@/components/SEO';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LeaderboardPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO {...SEO_CONFIGS.leaderboard} url="/ranking" />
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-neutral-12">Ranking de Atividade</h1>
            <LegislatureBadge />
          </div>
          <p className="text-neutral-11">
            Compara a atividade parlamentar registada de todos os deputados
          </p>
        </div>

        <Leaderboard />
      </main>

      <Footer />
    </div>
  );
}

export default LeaderboardPage;

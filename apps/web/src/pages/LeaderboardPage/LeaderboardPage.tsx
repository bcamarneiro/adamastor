import Footer from '@/components/Footer';
import { Leaderboard } from '@/components/Leaderboard';
import MainNav from '@/components/MainNav';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <MainNav scrollY={0} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          to="/report-card"
          className="inline-flex items-center gap-2 text-neutral-11 hover:text-neutral-12 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-12 mb-2">Ranking de Trabalho</h1>
          <p className="text-neutral-11">
            Descobre quem trabalha mais (e menos) na Assembleia da Republica
          </p>
        </div>

        <Leaderboard />
      </main>

      <Footer />
    </div>
  );
}

export default LeaderboardPage;

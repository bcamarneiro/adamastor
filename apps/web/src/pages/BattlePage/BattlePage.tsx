import { BattleRoyale } from '@/components/BattleRoyale';
import Footer from '@/components/Footer';
import MainNav from '@/components/MainNav';
import { SEO, SEO_CONFIGS } from '@/components/SEO';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BattlePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-2 flex flex-col">
      <SEO {...SEO_CONFIGS.battle} url="/batalha" />
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
          <h1 className="text-3xl font-bold text-neutral-12 mb-2">Battle Royale</h1>
          <p className="text-neutral-11">
            Compara a atividade parlamentar de dois deputados lado a lado
          </p>
        </div>

        <BattleRoyale />
      </main>

      <Footer />
    </div>
  );
}

export default BattlePage;

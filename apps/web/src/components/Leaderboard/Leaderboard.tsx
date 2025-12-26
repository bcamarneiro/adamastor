import { AlertTriangle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBottomWorkers } from '../../services/leaderboard/useBottomWorkers';
import { useTopWorkers } from '../../services/leaderboard/useTopWorkers';
import { LeaderboardCard } from './LeaderboardCard';

export function Leaderboard() {
  const { data: topWorkers = [], isLoading: topLoading } = useTopWorkers(3);
  const { data: bottomWorkers = [], isLoading: bottomLoading } = useBottomWorkers(3);

  const isLoading = topLoading || bottomLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-4 rounded w-48 mx-auto mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-neutral-4 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top Workers Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-6 h-6 text-success-9" />
          <h2 className="text-xl font-bold text-neutral-12">Top Trabalhadores</h2>
        </div>
        <p className="text-neutral-11 mb-4">Os deputados mais ativos na Assembleia da Republica</p>
        <div className="space-y-3">
          {topWorkers.map((deputy, index) => (
            <LeaderboardCard key={deputy.id} deputy={deputy} position={index + 1} isTop={true} />
          ))}
        </div>
      </section>

      {/* Bottom Workers Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-danger-9" />
          <h2 className="text-xl font-bold text-neutral-12">Ranking de Preguica</h2>
        </div>
        <p className="text-neutral-11 mb-4">
          Os deputados menos ativos - sera que merecem o salario?
        </p>
        <div className="space-y-3">
          {bottomWorkers.map((deputy, index) => (
            <LeaderboardCard key={deputy.id} deputy={deputy} position={index + 1} isTop={false} />
          ))}
        </div>
      </section>

      {/* Link to Full Rankings */}
      <div className="text-center pt-4">
        <Link
          to="/ranking/completo"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent-9 text-monochrome-white rounded-lg hover:bg-accent-10 transition-colors font-medium"
        >
          Ver Ranking Completo
        </Link>
      </div>
    </div>
  );
}

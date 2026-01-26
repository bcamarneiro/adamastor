import { ArrowRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DeputyDetail } from '../../lib/supabase';
import { GradeCircle } from '../ReportCard/GradeCircle';

interface BattleResultsProps {
  deputyA: DeputyDetail;
  deputyB: DeputyDetail;
  winsA: number;
  winsB: number;
  winner: 'A' | 'B' | 'tie';
}

export function BattleResults({ deputyA, deputyB, winsA, winsB, winner }: BattleResultsProps) {
  const isWinnerA = winner === 'A';
  const isWinnerB = winner === 'B';
  const isTie = winner === 'tie';

  const DeputyCard = ({ deputy, isWinner }: { deputy: DeputyDetail; isWinner: boolean }) => (
    <div
      className={`flex-1 rounded-xl p-6 border-2 transition-all ${
        isWinner
          ? 'bg-success-2 border-success-6'
          : isTie
            ? 'bg-warning-2 border-warning-6'
            : 'bg-neutral-2 border-neutral-5'
      }`}
    >
      {/* Winner Badge */}
      {isWinner && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-success-9" />
          <span className="text-sm font-bold text-success-11 uppercase">Vencedor</span>
        </div>
      )}

      {/* Photo */}
      <div className="flex justify-center mb-4">
        {deputy.photo_url ? (
          <img
            src={deputy.photo_url}
            alt={deputy.short_name}
            className={`w-24 h-24 rounded-full object-cover shadow-lg bg-neutral-4 ${
              isWinner
                ? 'ring-4 ring-success-9'
                : isTie
                  ? 'ring-4 ring-warning-9'
                  : 'ring-2 ring-neutral-6'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
            }}
          />
        ) : (
          <div
            className={`w-24 h-24 rounded-full bg-neutral-5 flex items-center justify-center ${
              isWinner
                ? 'ring-4 ring-success-9'
                : isTie
                  ? 'ring-4 ring-warning-9'
                  : 'ring-2 ring-neutral-6'
            }`}
          >
            <span className="text-neutral-9 text-2xl">?</span>
          </div>
        )}
      </div>

      {/* Grade */}
      <div className="flex justify-center mb-4">
        <GradeCircle grade={deputy.grade} score={deputy.work_score} size="md" />
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-neutral-12 text-center mb-1">{deputy.short_name}</h3>

      {/* Party */}
      <p className="text-sm text-neutral-11 text-center mb-4">
        {deputy.party_acronym || 'Independente'}
      </p>

      {/* Stats */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-11">Pontuação:</span>
          <span className="font-semibold text-neutral-12">{deputy.work_score ?? 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-11">Classificação:</span>
          <span className="font-semibold text-neutral-12">#{deputy.national_rank ?? 'N/A'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-11">Presença:</span>
          <span className="font-semibold text-neutral-12">
            {deputy.attendance_rate != null ? `${deputy.attendance_rate}%` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-11">Propostas:</span>
          <span className="font-semibold text-neutral-12">{deputy.proposal_count ?? 'N/A'}</span>
        </div>
      </div>

      {/* Profile Link */}
      <Link
        to={`/deputado/${deputy.id}`}
        className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-medium transition-colors ${
          isWinner
            ? 'bg-success-9 text-monochrome-white hover:bg-success-10'
            : isTie
              ? 'bg-warning-9 text-monochrome-white hover:bg-warning-10'
              : 'bg-neutral-9 text-monochrome-white hover:bg-neutral-10'
        }`}
      >
        Ver perfil
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Result Header */}
      <div className="bg-neutral-3 rounded-xl p-4 text-center">
        <div className="text-sm text-neutral-11 mb-1">Resultado final</div>
        <div className="text-lg font-bold text-neutral-12">
          {isTie ? (
            <>
              <span className="text-warning-11">🤝 Empate!</span>
              <div className="text-sm font-normal text-neutral-11 mt-1">
                {deputyA.short_name} e {deputyB.short_name} empataram
              </div>
            </>
          ) : (
            <>
              {deputyA.short_name}: {winsA} vitoria{winsA !== 1 ? 's' : ''}
              <span className="text-neutral-9 mx-2">|</span>
              {deputyB.short_name}: {winsB} vitoria{winsB !== 1 ? 's' : ''}
            </>
          )}
        </div>
      </div>

      {/* Side-by-side Deputy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DeputyCard deputy={deputyA} isWinner={isWinnerA} />
        <DeputyCard deputy={deputyB} isWinner={isWinnerB} />
      </div>
    </div>
  );
}

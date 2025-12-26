import { Share2, Trophy } from 'lucide-react';
import type { DeputyDetail } from '../../lib/supabase';
import { GradeCircle } from '../ReportCard/GradeCircle';

interface WinnerDeclarationProps {
  winner: DeputyDetail;
  loser: DeputyDetail;
  winsCount: number;
  isTie?: boolean;
}

export function WinnerDeclaration({
  winner,
  loser,
  winsCount,
  isTie = false,
}: WinnerDeclarationProps) {
  const handleShare = async () => {
    const text = isTie
      ? `Batalha empatada! ${winner.short_name} vs ${loser.short_name} - descobre mais em govperf.pt/batalha`
      : `${winner.short_name} venceu ${loser.short_name} por ${winsCount} categorias! Descobre mais em govperf.pt/batalha`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Battle Royale - Deputados',
          text,
          url: window.location.href,
        });
      } catch (_err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      alert('Texto copiado!');
    }
  };

  if (isTie) {
    return (
      <div className="bg-warning-3 rounded-xl p-6 text-center border border-warning-6">
        <div className="text-4xl mb-2">🤝</div>
        <h3 className="text-xl font-bold text-warning-12 mb-2">Empate!</h3>
        <p className="text-warning-11">
          {winner.short_name} e {loser.short_name} estao empatados
        </p>
        <button
          onClick={handleShare}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-warning-9 text-monochrome-white rounded-lg hover:bg-warning-10 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Partilhar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-success-3 rounded-xl p-6 border border-success-6">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Trophy className="w-8 h-8 text-success-9" />
        <span className="text-2xl font-bold text-success-12">Vencedor!</span>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        {winner.photo_url ? (
          <img
            src={winner.photo_url}
            alt={winner.short_name}
            className="w-20 h-20 rounded-full object-cover border-4 border-success-9 shadow-lg bg-neutral-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
            }}
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-neutral-5 border-4 border-success-9 flex items-center justify-center">
            <span className="text-neutral-9 text-2xl">?</span>
          </div>
        )}
        <GradeCircle grade={winner.grade} score={winner.work_score} size="lg" />
      </div>

      <h3 className="text-xl font-bold text-success-12 text-center mb-1">{winner.short_name}</h3>
      <p className="text-success-11 text-center mb-4">Venceu em {winsCount} de 5 categorias</p>

      <div className="text-center">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-6 py-3 bg-success-9 text-monochrome-white rounded-lg hover:bg-success-10 transition-colors font-medium"
        >
          <Share2 className="w-5 h-5" />
          Partilhar resultado
        </button>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import type { DeputyDetail } from '../../lib/supabase';
import { GradeCircle } from '../ReportCard/GradeCircle';

interface LeaderboardCardProps {
  deputy: DeputyDetail;
  position: number;
  isTop?: boolean; // true for top workers, false for bottom workers
}

const positionBadges: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function LeaderboardCard({ deputy, position, isTop = true }: LeaderboardCardProps) {
  const badge = isTop ? positionBadges[position] : '💤';

  return (
    <Link
      to={`/deputado/${deputy.id}`}
      className={`flex items-center gap-4 p-4 rounded-xl shadow-sm border transition-all hover:shadow-md ${
        isTop
          ? 'bg-neutral-1 border-success-6 hover:border-success-8'
          : 'bg-neutral-1 border-danger-6 hover:border-danger-8'
      }`}
    >
      {/* Position Badge */}
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl">
        {badge}
      </div>

      {/* Photo */}
      <div className="flex-shrink-0">
        {deputy.photo_url ? (
          <img
            src={deputy.photo_url}
            alt={deputy.short_name}
            className="w-14 h-14 rounded-full object-cover bg-neutral-4 border-2 border-neutral-5"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
            }}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-neutral-5 flex items-center justify-center border-2 border-neutral-5">
            <span className="text-neutral-9 text-lg">?</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-neutral-12 truncate">{deputy.short_name}</h3>
        <div className="flex items-center gap-2 text-sm">
          {deputy.party_acronym && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: deputy.party_color
                  ? `${deputy.party_color}20`
                  : 'var(--color-neutral-4)',
                color: deputy.party_color || 'var(--color-neutral-11)',
              }}
            >
              {deputy.party_acronym}
            </span>
          )}
          {deputy.district_name && (
            <span className="text-neutral-9 text-sm">{deputy.district_name}</span>
          )}
        </div>
      </div>

      {/* Grade */}
      <div className="flex-shrink-0">
        <GradeCircle grade={deputy.grade} score={deputy.work_score} size="sm" />
      </div>
    </Link>
  );
}

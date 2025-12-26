import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { DeputyDetail } from '../../lib/supabase';
import { GradeCircle } from './GradeCircle';

interface DeputyCardProps {
  deputy: DeputyDetail;
}

export const DeputyCard = memo(function DeputyCard({ deputy }: DeputyCardProps) {
  return (
    <Link
      to={`/deputado/${deputy.id}`}
      className="flex items-center gap-4 p-4 bg-neutral-1 rounded-lg shadow-sm border border-neutral-5 hover:shadow-md hover:border-accent-7 transition-all"
    >
      {/* Photo */}
      <div className="flex-shrink-0">
        {deputy.photo_url ? (
          <img
            src={deputy.photo_url}
            alt={deputy.short_name}
            loading="lazy"
            className="w-16 h-16 rounded-full object-cover bg-neutral-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-neutral-5 flex items-center justify-center">
            <span className="text-neutral-9 text-xl">?</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-neutral-12 truncate">{deputy.short_name}</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-11">
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
          {deputy.district_name && <span className="text-neutral-9">{deputy.district_name}</span>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-9">
          <span>#{deputy.national_rank} nacional</span>
          <span>#{deputy.district_rank} distrito</span>
        </div>
      </div>

      {/* Grade */}
      <div className="flex-shrink-0">
        <GradeCircle grade={deputy.grade} score={deputy.work_score} size="sm" />
      </div>
    </Link>
  );
});

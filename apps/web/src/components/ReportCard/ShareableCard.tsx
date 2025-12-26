import { QRCodeSVG } from 'qrcode.react';
import { forwardRef } from 'react';
import type { DeputyDetail } from '../../lib/supabase';
import { GradeCircle } from './GradeCircle';

interface ShareableCardProps {
  deputy: DeputyDetail;
}

export const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(({ deputy }, ref) => {
  const profileUrl = `${window.location.origin}/deputado/${deputy.id}`;

  return (
    <div
      ref={ref}
      className="w-[1080px] h-[1080px] bg-neutral-1 p-12 flex flex-col"
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="text-4xl font-bold text-accent-9">Gov-Perf</div>
        <div className="text-xl text-neutral-9">Report Card</div>
      </div>

      {/* Deputy Info */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Photo */}
        <div className="mb-8">
          {deputy.photo_url ? (
            <img
              src={deputy.photo_url}
              alt={deputy.short_name}
              className="w-48 h-48 rounded-full object-cover border-8 border-accent-9 shadow-xl bg-neutral-4"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-48 h-48 rounded-full bg-neutral-5 border-8 border-accent-9 flex items-center justify-center">
              <span className="text-neutral-9 text-6xl">?</span>
            </div>
          )}
        </div>

        {/* Name */}
        <h1 className="text-5xl font-bold text-neutral-12 mb-2 text-center">{deputy.short_name}</h1>
        <p className="text-2xl text-neutral-11 mb-6 text-center">
          {deputy.party_acronym} | {deputy.district_name}
        </p>

        {/* Grade */}
        <div className="mb-10">
          <GradeCircle grade={deputy.grade} score={deputy.work_score} size="lg" />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-8 w-full max-w-2xl mb-10">
          <div className="text-center bg-neutral-2 rounded-xl p-6">
            <div className="text-lg mb-1">Propostas</div>
            <div className="text-4xl font-bold text-neutral-12">{deputy.proposal_count}</div>
          </div>
          <div className="text-center bg-neutral-2 rounded-xl p-6">
            <div className="text-lg mb-1">Intervencoes</div>
            <div className="text-4xl font-bold text-neutral-12">{deputy.intervention_count}</div>
          </div>
          <div className="text-center bg-neutral-2 rounded-xl p-6">
            <div className="text-lg mb-1">Perguntas</div>
            <div className="text-4xl font-bold text-neutral-12">{deputy.question_count}</div>
          </div>
        </div>

        {/* Rankings */}
        <div className="flex items-center gap-8 text-xl text-neutral-11">
          <span>
            <span className="font-bold text-accent-9">#{deputy.national_rank}</span> nacional
          </span>
          <span className="text-neutral-7">|</span>
          <span>
            <span className="font-bold text-accent-9">#{deputy.district_rank}</span> no distrito
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-8 pt-8 border-t border-neutral-5">
        <div className="flex items-center gap-4">
          <QRCodeSVG
            value={profileUrl}
            size={80}
            bgColor="transparent"
            fgColor="var(--color-neutral-12)"
          />
          <div className="text-lg text-neutral-11">Escaneia para ver mais</div>
        </div>
        <div className="text-xl text-neutral-9">govperf.pt</div>
      </div>
    </div>
  );
});

ShareableCard.displayName = 'ShareableCard';

import type { PartyStats } from '@/lib/supabase';
import { FileText, HelpCircle, MessageSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PartyCardProps {
  party: PartyStats;
  rank?: number;
  onClick?: () => void;
  isSelected?: boolean;
}

function getGradeFromScore(score: number | null): string {
  if (score === null) return 'N/A';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'bg-success-3 text-success-11';
    case 'B':
      return 'bg-accent-3 text-accent-11';
    case 'C':
      return 'bg-warning-3 text-warning-11';
    case 'D':
      return 'bg-danger-3 text-danger-11';
    case 'F':
      return 'bg-danger-4 text-danger-12';
    default:
      return 'bg-neutral-3 text-neutral-11';
  }
}

export function PartyCard({ party, rank, onClick, isSelected }: PartyCardProps) {
  const grade = getGradeFromScore(party.avg_work_score);
  const gradeColor = getGradeColor(grade);

  const partySlug = party.acronym.toLowerCase();
  const partyUrl = `/partidos/${partySlug}`;

  const cardClassName = `
    bg-neutral-1 rounded-xl p-4 border transition-all
    ${onClick ? 'cursor-pointer hover:border-accent-7 hover:shadow-md' : 'hover:border-accent-7 hover:shadow-md'}
    ${isSelected ? 'border-accent-9 ring-2 ring-accent-5' : 'border-neutral-5'}
  `;

  const cardContent = (
    <div className="flex items-start gap-4">
      {/* Rank Badge */}
      {rank !== undefined && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-neutral-3 flex items-center justify-center text-sm font-bold text-neutral-11">
          {rank}
        </div>
      )}

      {/* Party Color Indicator */}
      <div
        className="shrink-0 w-2 h-16 rounded-full"
        style={{ backgroundColor: party.color || '#888' }}
      />

      {/* Party Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-lg text-neutral-12">{party.acronym}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${gradeColor}`}>
            {grade}
          </span>
        </div>
        <p className="text-sm text-neutral-11 truncate mb-2">{party.name}</p>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3 text-xs text-neutral-10">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {party.deputy_count} deputados
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {party.total_proposals ?? 0} propostas
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {party.total_interventions ?? 0} intervencoes
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            {party.total_questions ?? 0} perguntas
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <div className="text-2xl font-bold text-neutral-12">
          {party.avg_work_score?.toFixed(1) ?? 'N/A'}
        </div>
        <div className="text-xs text-neutral-10">pontos</div>
      </div>
    </div>
  );

  // If onClick is provided (comparison page), use button with onClick
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {cardContent}
      </button>
    );
  }

  // Otherwise, use Link to party details page
  return (
    <Link to={partyUrl} className={cardClassName}>
      {cardContent}
    </Link>
  );
}

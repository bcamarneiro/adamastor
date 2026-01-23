import type { DistrictStats } from '@/lib/supabase';
import { MapPin, Users } from 'lucide-react';

interface DistrictCardProps {
  district: DistrictStats;
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

export function DistrictCard({ district, rank, onClick, isSelected }: DistrictCardProps) {
  const grade = getGradeFromScore(district.avg_work_score);
  const gradeColor = getGradeColor(grade);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      data-testid="district-card"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        bg-neutral-1 rounded-xl p-4 border transition-all
        ${onClick ? 'cursor-pointer hover:border-accent-7 hover:shadow-md' : ''}
        ${isSelected ? 'border-accent-9 ring-2 ring-accent-5' : 'border-neutral-5'}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        {rank !== undefined && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-3 flex items-center justify-center text-sm font-bold text-neutral-11">
            {rank}
          </div>
        )}

        {/* District Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-3 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-accent-11" />
        </div>

        {/* District Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-lg text-neutral-12">{district.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${gradeColor}`}>
              {grade}
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 text-xs text-neutral-10">
            <span className="flex items-center gap-1" data-testid="deputy-count">
              <Users className="w-3 h-3" />
              {district.active_deputies} deputados ativos
            </span>
            {district.seat_count && (
              <span className="text-neutral-9">({district.seat_count} lugares)</span>
            )}
            {district.avg_attendance_rate !== null && (
              <span data-testid="avg-attendance">
                Assiduidade: {district.avg_attendance_rate?.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-neutral-12" data-testid="avg-grade">
            {district.avg_work_score?.toFixed(1) ?? 'N/A'}
          </div>
          <div className="text-xs text-neutral-10">pontos</div>
        </div>
      </div>
    </div>
  );
}

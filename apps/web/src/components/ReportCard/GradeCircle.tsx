interface GradeCircleProps {
  grade: string;
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

// Using design system tokens: success (green), warning (yellow/orange), danger (red)
const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-success-3', text: 'text-success-11', border: 'border-success-8' },
  B: { bg: 'bg-success-2', text: 'text-success-10', border: 'border-success-7' },
  C: { bg: 'bg-warning-3', text: 'text-warning-11', border: 'border-warning-8' },
  D: { bg: 'bg-warning-4', text: 'text-warning-12', border: 'border-warning-9' },
  F: { bg: 'bg-danger-3', text: 'text-danger-11', border: 'border-danger-8' },
};

const sizes = {
  sm: { circle: 'w-12 h-12', grade: 'text-xl', score: 'text-xs' },
  md: { circle: 'w-20 h-20', grade: 'text-3xl', score: 'text-sm' },
  lg: { circle: 'w-32 h-32', grade: 'text-5xl', score: 'text-lg' },
};

export function GradeCircle({ grade, score, size = 'md' }: GradeCircleProps) {
  const colors = gradeColors[grade] || gradeColors.F;
  const sizeClasses = sizes[size];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${sizeClasses.circle} ${colors.bg} ${colors.border} border-4 rounded-full flex items-center justify-center`}
      >
        <span className={`${sizeClasses.grade} ${colors.text} font-bold`}>{grade}</span>
      </div>
      <span className={`${sizeClasses.score} text-neutral-11 mt-1`}>{score.toFixed(0)} pts</span>
    </div>
  );
}

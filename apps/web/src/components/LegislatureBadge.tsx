import { Info } from 'lucide-react';
import { CURRENT_LEGISLATURE_LABEL } from 'shared';

interface LegislatureBadgeProps {
  className?: string;
  showTooltip?: boolean;
}

/**
 * Badge component that indicates the current legislature for data context.
 * Helps users understand that rankings and statistics are for the current parliamentary session.
 */
export function LegislatureBadge({ className = '', showTooltip = true }: LegislatureBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent-3 text-accent-11 rounded-full text-xs font-medium ${className}`}
      title={
        showTooltip
          ? `Dados da ${CURRENT_LEGISLATURE_LABEL} (atual). Rankings e estatísticas baseados apenas na legislatura em curso.`
          : undefined
      }
    >
      <span>{CURRENT_LEGISLATURE_LABEL}</span>
      {showTooltip && <Info className="w-3 h-3 opacity-70" />}
    </div>
  );
}

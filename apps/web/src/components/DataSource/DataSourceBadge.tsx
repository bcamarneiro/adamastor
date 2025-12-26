import { Database, ExternalLink, Globe } from 'lucide-react';

interface DataSourceBadgeProps {
  sourceType: 'api' | 'scraper';
  sourceUrl?: string | null;
  lastSynced?: string | null;
  label?: string;
  compact?: boolean;
}

export function DataSourceBadge({
  sourceType,
  sourceUrl,
  lastSynced,
  label,
  compact = false,
}: DataSourceBadgeProps) {
  const Icon = sourceType === 'api' ? Database : Globe;
  const typeLabel = sourceType === 'api' ? 'API' : 'Scraper';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-neutral-9 hover:text-neutral-11 cursor-help"
        title={`Fonte: ${typeLabel}${lastSynced ? ` (atualizado ${formatDate(lastSynced)})` : ''}`}
      >
        <Icon className="w-3 h-3" />
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-2 py-1 bg-neutral-3 rounded text-xs text-neutral-11">
      <Icon className="w-3 h-3" />
      <span>{label || typeLabel}</span>
      {lastSynced && <span className="text-neutral-9">{formatDate(lastSynced)}</span>}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-11 hover:text-accent-10"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

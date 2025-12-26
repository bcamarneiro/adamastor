import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DeputyDetail } from '../../lib/supabase';
import { useDeputySearch } from '../../services/battle/useDeputySearch';

interface DeputySelectorProps {
  label: string;
  selected: DeputyDetail | null;
  onSelect: (deputy: DeputyDetail | null) => void;
  excludeId?: string;
}

export function DeputySelector({ label, selected, onSelect, excludeId }: DeputySelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results = [], isLoading } = useDeputySearch(query);

  // Filter out excluded deputy
  const filteredResults = excludeId ? results.filter((d) => d.id !== excludeId) : results;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (deputy: DeputyDetail) => {
    onSelect(deputy);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
  };

  if (selected) {
    return (
      <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5">
        <div className="text-xs text-neutral-9 mb-2">{label}</div>
        <div className="flex items-center gap-3">
          {selected.photo_url ? (
            <img
              src={selected.photo_url}
              alt={selected.short_name}
              className="w-12 h-12 rounded-full object-cover bg-neutral-4"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-5 flex items-center justify-center">
              <span className="text-neutral-9">?</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-neutral-12 truncate">{selected.short_name}</div>
            <div className="text-sm text-neutral-11">
              {selected.party_acronym} - {selected.district_name}
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 text-neutral-9 hover:text-neutral-12 hover:bg-neutral-3 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5">
        <div className="text-xs text-neutral-9 mb-2">{label}</div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-9" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Procurar deputado..."
            className="w-full pl-10 pr-4 py-2 bg-neutral-2 border border-neutral-5 rounded-lg text-neutral-12 focus:ring-2 focus:ring-accent-9 focus:border-accent-9"
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-neutral-1 rounded-xl shadow-lg border border-neutral-5 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-neutral-9">A procurar...</div>
          ) : filteredResults.length === 0 ? (
            <div className="p-4 text-center text-neutral-9">Nenhum resultado encontrado</div>
          ) : (
            filteredResults.map((deputy) => (
              <button
                key={deputy.id}
                onClick={() => handleSelect(deputy)}
                className="w-full flex items-center gap-3 p-3 hover:bg-neutral-2 transition-colors text-left"
              >
                {deputy.photo_url ? (
                  <img
                    src={deputy.photo_url}
                    alt={deputy.short_name}
                    className="w-10 h-10 rounded-full object-cover bg-neutral-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-5 flex items-center justify-center">
                    <span className="text-neutral-9 text-sm">?</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-12 truncate">{deputy.short_name}</div>
                  <div className="text-xs text-neutral-9">
                    {deputy.party_acronym} - {deputy.district_name}
                  </div>
                </div>
                <div className="text-sm font-medium text-accent-9">{deputy.grade}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

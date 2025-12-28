import type { PartyStats } from '@/lib/supabase';
import { usePartyStats } from '@/services/parties';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface PartySelectorProps {
  label: string;
  selected: PartyStats | null;
  onSelect: (party: PartyStats | null) => void;
  excludeId?: string;
}

export function PartySelector({ label, selected, onSelect, excludeId }: PartySelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data: parties, isLoading } = usePartyStats();

  const filteredParties =
    parties?.filter((p) => {
      if (excludeId && p.id === excludeId) return false;
      if (!search) return true;
      return (
        p.acronym.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }) ?? [];

  const handleSelect = (party: PartyStats) => {
    onSelect(party);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearch('');
  };

  if (selected) {
    return (
      <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-neutral-11">{label}</span>
          <button
            onClick={handleClear}
            className="p-1 hover:bg-neutral-3 rounded-full transition-colors"
            aria-label="Limpar selecao"
          >
            <X className="w-4 h-4 text-neutral-9" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-12 rounded-full"
            style={{ backgroundColor: selected.color || '#888' }}
          />
          <div>
            <div className="font-bold text-neutral-12">{selected.acronym}</div>
            <div className="text-sm text-neutral-11">{selected.name}</div>
          </div>
        </div>
        <div className="mt-2 text-sm">
          <span className="text-neutral-10">Pontuacao media: </span>
          <span className="font-semibold text-neutral-12">
            {selected.avg_work_score?.toFixed(1) ?? 'N/A'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-1 rounded-xl p-4 border border-neutral-5">
      <div className="text-sm text-neutral-11 mb-2">{label}</div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-9" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Procurar partido..."
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-2 border border-neutral-5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-7 focus:border-transparent"
        />
      </div>

      {isOpen && (
        <div className="mt-2 max-h-48 overflow-y-auto bg-neutral-2 rounded-lg border border-neutral-5">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-neutral-11">A carregar...</div>
          ) : filteredParties.length === 0 ? (
            <div className="p-3 text-center text-sm text-neutral-11">
              Nenhum partido encontrado
            </div>
          ) : (
            filteredParties.map((party) => (
              <button
                key={party.id}
                onClick={() => handleSelect(party)}
                className="w-full flex items-center gap-3 p-3 hover:bg-neutral-3 transition-colors text-left"
              >
                <div
                  className="w-2 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: party.color || '#888' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-12">{party.acronym}</div>
                  <div className="text-xs text-neutral-11 truncate">{party.name}</div>
                </div>
                <div className="text-sm font-medium text-neutral-10">
                  {party.avg_work_score?.toFixed(1) ?? 'N/A'}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import type { DistrictStats } from '@/lib/supabase';
import { useDistrictStats } from '@/services/districts';
import { MapPin, Search, X } from 'lucide-react';
import { useState } from 'react';

interface DistrictSelectorProps {
  label: string;
  selected: DistrictStats | null;
  onSelect: (district: DistrictStats | null) => void;
  excludeId?: string;
}

export function DistrictSelector({ label, selected, onSelect, excludeId }: DistrictSelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { data: districts, isLoading } = useDistrictStats();

  const filteredDistricts =
    districts?.filter((d) => {
      if (excludeId && d.id === excludeId) return false;
      if (!search) return true;
      return d.name.toLowerCase().includes(search.toLowerCase());
    }) ?? [];

  const handleSelect = (district: DistrictStats) => {
    onSelect(district);
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
          <div className="w-10 h-10 rounded-full bg-accent-3 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-accent-11" />
          </div>
          <div>
            <div className="font-bold text-neutral-12">{selected.name}</div>
            <div className="text-sm text-neutral-11">{selected.active_deputies} deputados</div>
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
          placeholder="Procurar distrito..."
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-2 border border-neutral-5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-7 focus:border-transparent"
        />
      </div>

      {isOpen && (
        <div className="mt-2 max-h-48 overflow-y-auto bg-neutral-2 rounded-lg border border-neutral-5">
          {isLoading ? (
            <div className="p-3 text-center text-sm text-neutral-11">A carregar...</div>
          ) : filteredDistricts.length === 0 ? (
            <div className="p-3 text-center text-sm text-neutral-11">Nenhum distrito encontrado</div>
          ) : (
            filteredDistricts.map((district) => (
              <button
                key={district.id}
                onClick={() => handleSelect(district)}
                className="w-full flex items-center gap-3 p-3 hover:bg-neutral-3 transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-accent-9 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-12">{district.name}</div>
                  <div className="text-xs text-neutral-11">{district.active_deputies} deputados</div>
                </div>
                <div className="text-sm font-medium text-neutral-10">
                  {district.avg_work_score?.toFixed(1) ?? 'N/A'}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

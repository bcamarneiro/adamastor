import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from '@/components/ui/command';
import { useDeputySearch } from '@/hooks/useDeputySearch';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
  className?: string;
  onClose?: () => void;
}

export function GlobalSearch({ className, onClose }: GlobalSearchProps) {
  const { searchTerm, setSearchTerm, results, isLoading, hasMinChars } = useDeputySearch();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (deputyId: string) => {
    navigate(`/deputado/${deputyId}`);
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    onClose?.();
  };

  const showDropdown = isOpen && hasMinChars;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Command
        shouldFilter={false}
        className="bg-transparent overflow-visible"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            handleClose();
          }
        }}
      >
        <div className="relative">
          <CommandInput
            value={searchTerm}
            onValueChange={(value) => {
              setSearchTerm(value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Pesquisar deputado..."
            className="bg-neutral-2 border border-neutral-5 rounded-lg focus:ring-2 focus:ring-accent-7 h-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-9 animate-spin" />
          )}
        </div>

        {/* Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-1 border border-neutral-5 rounded-lg shadow-lg overflow-hidden z-50">
            <CommandList>
              {isLoading && <CommandLoading>A procurar...</CommandLoading>}
              {!isLoading && results.length === 0 && (
                <CommandEmpty>Nenhum deputado encontrado</CommandEmpty>
              )}
              {results.length > 0 && (
                <CommandGroup>
                  {results.map((deputy) => (
                    <CommandItem
                      key={deputy.id}
                      value={deputy.id}
                      onSelect={() => handleSelect(deputy.id)}
                      className="flex items-center gap-3 px-4 py-2"
                    >
                      {deputy.photo_url ? (
                        <img
                          src={deputy.photo_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover bg-neutral-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-avatar.svg';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-5 flex items-center justify-center">
                          <span className="text-neutral-9 text-sm">?</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-12 truncate">
                          {deputy.short_name}
                        </div>
                        <div className="text-xs text-neutral-10 truncate">
                          {deputy.party_acronym} • {deputy.district_name}
                        </div>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-semibold',
                          deputy.grade === 'A' && 'bg-success-3 text-success-11',
                          deputy.grade === 'B' && 'bg-accent-3 text-accent-11',
                          deputy.grade === 'C' && 'bg-warning-3 text-warning-11',
                          deputy.grade === 'D' && 'bg-danger-3 text-danger-11',
                          deputy.grade === 'F' && 'bg-danger-4 text-danger-12'
                        )}
                      >
                        {deputy.grade}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            {hasMinChars && (
              <div className="px-4 py-2 text-xs text-neutral-9 bg-neutral-2 border-t border-neutral-5">
                <kbd className="px-1 py-0.5 rounded bg-neutral-4 text-neutral-11">↑↓</kbd> navegar •{' '}
                <kbd className="px-1 py-0.5 rounded bg-neutral-4 text-neutral-11">Enter</kbd>{' '}
                selecionar •{' '}
                <kbd className="px-1 py-0.5 rounded bg-neutral-4 text-neutral-11">Esc</kbd> fechar
              </div>
            )}
          </div>
        )}
      </Command>
    </div>
  );
}

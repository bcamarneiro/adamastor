import { useDeputySearch } from '@/hooks/useDeputySearch';
import { cn } from '@/utils/cn';
import { Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface GlobalSearchProps {
  className?: string;
  onClose?: () => void;
}

export function GlobalSearch({ className, onClose }: GlobalSearchProps) {
  const { searchTerm, setSearchTerm, results, isLoading, hasMinChars } = useDeputySearch();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          navigate(`/deputado/${results[selectedIndex].id}`);
          handleClose();
        }
        break;
      case 'Escape':
        handleClose();
        break;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    setSelectedIndex(-1);
    onClose?.();
  };

  const showDropdown = isOpen && hasMinChars;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-9" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Pesquisar deputado..."
          className="w-full pl-10 pr-10 py-2 text-sm bg-neutral-2 border border-neutral-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-7 focus:border-transparent placeholder:text-neutral-9"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-9 animate-spin" />
        )}
        {searchTerm && !isLoading && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-9 hover:text-neutral-11"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-1 border border-neutral-5 rounded-lg shadow-lg overflow-hidden z-50">
          {results.length === 0 && !isLoading && (
            <div className="p-4 text-sm text-neutral-10 text-center">
              Nenhum deputado encontrado
            </div>
          )}
          {results.length > 0 && (
            <ul className="py-1">
              {results.map((deputy, index) => (
                <li key={deputy.id}>
                  <Link
                    to={`/deputado/${deputy.id}`}
                    onClick={handleClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 hover:bg-neutral-3 transition-colors',
                      selectedIndex === index && 'bg-neutral-3'
                    )}
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {hasMinChars && (
            <div className="px-4 py-2 text-xs text-neutral-9 bg-neutral-2 border-t border-neutral-5">
              <kbd className="px-1 py-0.5 rounded bg-neutral-4 text-neutral-11">↑↓</kbd> navegar •{' '}
              <kbd className="px-1 py-0.5 rounded bg-neutral-4 text-neutral-11">Enter</kbd> selecionar •{' '}
              <kbd className="px-1 py-0.5 rounded bg-neutral-4 text-neutral-11">Esc</kbd> fechar
            </div>
          )}
        </div>
      )}
    </div>
  );
}

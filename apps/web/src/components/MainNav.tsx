import { Menu, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { type FeatureFlags, useFeatureFlags } from '../store/useFeatureFlags';
import { GlobalSearch } from './Search';
import DebaixoDolhoLogo from './ui/Icons/DebaixoDolhoLogo';

interface MainNavProps {
  scrollY: number;
}

interface NavItem {
  path: string;
  label: string;
  featureFlag?: keyof FeatureFlags;
}

const allNavItems: NavItem[] = [
  { path: '/report-card', label: 'Deputados' },
  { path: '/parliament', label: 'Parlamento' },
  { path: '/partidos', label: 'Partidos' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/initiatives', label: 'Iniciativas' },
  { path: '/desperdicio', label: 'Calculadora', featureFlag: 'wasteCalculator' },
  { path: '/batalha', label: 'Battle Royale' },
  { path: '/about', label: 'Sobre' },
];

const MainNav: React.FC<MainNavProps> = ({ scrollY }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { flags } = useFeatureFlags();

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Filter nav items based on feature flags
  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      if (!item.featureFlag) return true;
      return flags[item.featureFlag];
    });
  }, [flags]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 0 ? 'bg-neutral-1/80 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container px-6 md:px-8">
        <div className="flex items-center justify-between" style={{ height: 'var(--header-height, 4rem)' }}>
          <Link to="/" className="flex items-center gap-2">
            <DebaixoDolhoLogo size="md" className="text-neutral-12" />
            <span className="text-lg font-medium text-neutral-12">Debaixo d'olho</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path) ? 'text-accent-9' : 'text-neutral-11 hover:text-neutral-12'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Search - Only render on desktop */}
          <div className="hidden md:flex items-center gap-2">
            {searchOpen ? (
              <GlobalSearch className="w-64" onClose={() => setSearchOpen(false)} />
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="p-2 text-neutral-11 hover:text-neutral-12 hover:bg-neutral-3 rounded-lg transition-colors"
                aria-label="Pesquisar"
                data-testid="search-toggle"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-neutral-11 hover:text-neutral-12 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-7 rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setMobileMenuOpen(false);
        }}
        aria-label="Fechar menu"
      />

      {/* Mobile Navigation - Only render on mobile when menu is open */}
      <div
        id="mobile-navigation"
        className={`md:hidden fixed left-0 right-0 bottom-0 z-50 bg-neutral-1 transition-transform duration-300 ease-in-out overflow-y-auto ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: 'var(--header-height, 4rem)' }}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="container px-6 py-4">
          {/* Mobile Search - Only visible on mobile */}
          <GlobalSearch className="mb-4" onClose={() => setMobileMenuOpen(false)} />
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 transition-colors ${
                  isActive(item.path) ? 'text-accent-9' : 'text-neutral-11 hover:text-neutral-12'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default MainNav;

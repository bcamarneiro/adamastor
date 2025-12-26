import GovPerfLogo from '@/components/ui/Icons/GovPerfLogo';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MainNavProps {
  scrollY: number;
}

const navItems = [
  { path: '/report-card', label: 'Deputados' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/desperdicio', label: 'Calculadora' },
  { path: '/batalha', label: 'Battle Royale' },
  { path: '/about', label: 'Sobre' },
];

const MainNav: React.FC<MainNavProps> = ({ scrollY }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 0 ? 'bg-neutral-1/80 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="container px-6 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GovPerfLogo className="h-8 w-8" />
            <span className="text-lg font-medium text-neutral-12">Gov Perf</span>
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

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-neutral-11 hover:text-neutral-12"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-1 border-t border-neutral-5">
          <nav className="container px-6 py-4 flex flex-col gap-3">
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
      )}
    </header>
  );
};

export default MainNav;

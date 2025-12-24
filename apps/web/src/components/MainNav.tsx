import GovPerfLogo from '@/components/ui/Icons/GovPerfLogo';
import { Link } from 'react-router-dom';

interface MainNavProps {
  scrollY: number;
}

const MainNav: React.FC<MainNavProps> = ({ scrollY }) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrollY > 0
          ? 'bg-white/80 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container px-6 md:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GovPerfLogo className="h-8 w-8" />
            <span className="text-lg font-medium">Gov Perf</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/about"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              About
            </Link>
            <Link
              to="/initiatives"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Initiatives
            </Link>
            <Link
              to="/parliament"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Parliament
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default MainNav;

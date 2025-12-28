import DebaixoDolhoLogo from '@/components/ui/Icons/DebaixoDolhoLogo';
import Sidebar from '@/components/ui/Sidebar/Sidebar';
import { useAppSettingsStore } from '@store/useAppSettingsStore';
import { Link, useLocation } from 'react-router-dom';

const CommonSidebar = () => {
  const { leftSidebarExpanded } = useAppSettingsStore();
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Início' },
    { path: '/report-card', label: 'Deputados' },
    { path: '/ranking', label: 'Ranking' },
    { path: '/desperdicio', label: 'Calculadora' },
    { path: '/batalha', label: 'Battle Royale' },
    { path: '/about', label: 'Sobre' },
  ];

  return (
    <Sidebar position="left" isExpanded={leftSidebarExpanded}>
      <div
        data-testid="sidebar-header"
        className="flex flex-row items-center justify-between bg-neutral-1 border-b border-b-neutral-4 pb-2-5 font-sans"
      >
        <div className="flex flex-row gap-1.5 h-full items-center w-full justify-base">
          <DebaixoDolhoLogo size="sm" />
          <Link to="/" className="text-lg">
            Debaixo d'olho
          </Link>
        </div>
      </div>

      <nav className="mt-4">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 my-1 text-sm rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-neutral-3 text-neutral-12'
                : 'text-neutral-11 hover:bg-neutral-2 hover:text-neutral-12'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </Sidebar>
  );
};

export default CommonSidebar;

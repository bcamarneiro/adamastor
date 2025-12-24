import Button from '@/components/ui/Button/Button';
import ChevronBack from '@/components/ui/Icons/ChevronBack';
import CommonSidebar from '@/components/ui/Sidebar/CommonSidebar';
import { useAppSettingsStore } from '@store/useAppSettingsStore';
import { Link } from 'react-router-dom';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  path: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title, path }) => {
  const { leftSidebarExpanded, setLeftSidebarExpanded } = useAppSettingsStore();

  return (
    <div className="flex flex-row w-full h-full">
      <CommonSidebar />

      <div className="w-full flex flex-col">
        <nav className="flex flex-row gap-2 py-2-5 px-3 justify-between">
          <Button
            variant="neutral"
            onClick={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
          >
            <span className={`${!leftSidebarExpanded && 'rotate-180'}`}>
              <ChevronBack />
            </span>
          </Button>

          <div className="h-[32px] grow flex flex-row items-center gap-3">
            <Link to={path}>{title}</Link>
          </div>
        </nav>

        <main className="w-full h-full overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;

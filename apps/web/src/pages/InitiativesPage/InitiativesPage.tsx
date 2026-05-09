import { SEO, SEO_CONFIGS } from '@/components/SEO';
import PageLayout from '@/components/ui/Layout/PageLayout';
import { Outlet } from 'react-router-dom';
import './InitiativesPage.css';

const InitiativesPage: React.FC = () => {
  return (
    <>
      <SEO {...SEO_CONFIGS.initiatives} url="/initiatives" />
      <PageLayout title="Initiatives" path="/initiatives">
        <Outlet />
      </PageLayout>
    </>
  );
};

export default InitiativesPage;

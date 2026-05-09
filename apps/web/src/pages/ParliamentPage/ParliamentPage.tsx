import { SEO, SEO_CONFIGS } from '@/components/SEO';
import PageLayout from '@/components/ui/Layout/PageLayout';
import { Outlet } from 'react-router-dom';

const ParliamentPage: React.FC = () => {
  return (
    <>
      <SEO {...SEO_CONFIGS.parliament} url="/parliament" />
      <PageLayout title="Parlamento" path="/parliament">
        <Outlet />
      </PageLayout>
    </>
  );
};

export default ParliamentPage;

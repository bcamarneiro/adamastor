import { Outlet } from 'react-router-dom';
import PageLayout from '@/components/ui/Layout/PageLayout';

const ParliamentPage: React.FC = () => {
  return (
    <PageLayout title="Parlamento" path="/parliament">
      <Outlet />
    </PageLayout>
  );
};

export default ParliamentPage;

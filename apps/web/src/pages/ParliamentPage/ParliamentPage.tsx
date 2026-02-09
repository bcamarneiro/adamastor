import PageLayout from '@/components/ui/Layout/PageLayout';
import { Outlet } from 'react-router-dom';

const ParliamentPage: React.FC = () => {
  return (
    <PageLayout title="Parlamento" path="/parliament">
      <Outlet />
    </PageLayout>
  );
};

export default ParliamentPage;

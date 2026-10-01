import { Outlet } from 'react-router-dom';
import PageLayout from '@/components/ui/Layout/PageLayout';
import './InitiativesPage.css';

const InitiativesPage: React.FC = () => {
  return (
    <PageLayout title="Initiatives" path="/initiatives">
      <Outlet />
    </PageLayout>
  );
};

export default InitiativesPage;

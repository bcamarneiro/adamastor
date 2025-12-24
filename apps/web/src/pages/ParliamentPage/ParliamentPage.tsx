import PageLayout from '@/components/ui/Layout/PageLayout';
import { Outlet } from 'react-router-dom';
import './ParliamentPage.css';

const ParliamentPage: React.FC = () => {
  return (
    <PageLayout title="Parliament" path="/parliament">
      <Outlet />
    </PageLayout>
  );
};

export default ParliamentPage;

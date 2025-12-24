import PageLayout from '@/components/ui/Layout/PageLayout';
import { Outlet } from 'react-router-dom';
import './WhatHappenedPage.css';

const WhatHappenedPage: React.FC = () => {
  return (
    <PageLayout title="What Happened" path="/what-happened">
      <Outlet />
    </PageLayout>
  );
};

export default WhatHappenedPage;

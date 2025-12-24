import { Route, Routes } from 'react-router-dom';

import { useAppSettingsStore } from '@store/useAppSettingsStore';
import { cn } from '@utils/cn';

import FourOFour from './components/FourOFour/FourOFour';
import AboutPage from './pages/AboutPage/AboutPage';
import InitiativeDetails from './pages/InitiativesPage/InitiativeDetails/InitiativeDetails';
import InitiativeList from './pages/InitiativesPage/InitiativeList/InitiativeList';
import InitiativesPage from './pages/InitiativesPage/InitiativesPage';
import LandingPage from './pages/LandingPage/LandingPage';
import ParliamentList from './pages/ParliamentPage/ParliamentList/ParliamentList';
import ParliamentPage from './pages/ParliamentPage/ParliamentPage';
import WhatHappened from './pages/WhatHappenedPage/WhatHappened';
import WhatHappenedPage from './pages/WhatHappenedPage/WhatHappenedPage';

const App = () => {
  const { theme } = useAppSettingsStore();

  return (
    <div
      className={cn(
        'flex flex-col h-[100vh] w-[100vw] bg-neutral-1 text-neutral-12 font-serif',
        theme === 'dark' && 'dark',
      )}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="what-happened" element={<WhatHappenedPage />}>
          <Route index element={<WhatHappened />} />
        </Route>

        <Route path="initiatives" element={<InitiativesPage />}>
          <Route index element={<InitiativeList />} />
          <Route
            path=":selectedInitiativeId/details"
            element={<InitiativeDetails />}
          />
        </Route>

        <Route path="parliament" element={<ParliamentPage />}>
          <Route index element={<ParliamentList />} />
        </Route>

        <Route path="about" element={<AboutPage />} />

        <Route path="*" element={<FourOFour />} />
      </Routes>
    </div>
  );
};

export default App;

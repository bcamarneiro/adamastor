import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { useAppSettingsStore } from '@store/useAppSettingsStore';
import { cn } from '@utils/cn';

import { ErrorBoundary } from './components/ErrorBoundary';
import FourOFour from './components/FourOFour/FourOFour';

// Core pages - loaded eagerly
import LandingPage from './pages/LandingPage/LandingPage';

// Lazy-loaded pages for code splitting
const AboutPage = lazy(() => import('./pages/AboutPage/AboutPage'));
const InitiativeDetails = lazy(
  () => import('./pages/InitiativesPage/InitiativeDetails/InitiativeDetails')
);
const InitiativeList = lazy(() => import('./pages/InitiativesPage/InitiativeList/InitiativeList'));
const InitiativesPage = lazy(() => import('./pages/InitiativesPage/InitiativesPage'));
const ParliamentList = lazy(() => import('./pages/ParliamentPage/ParliamentList/ParliamentList'));
const ParliamentPage = lazy(() => import('./pages/ParliamentPage/ParliamentPage'));
const WhatHappened = lazy(() => import('./pages/WhatHappenedPage/WhatHappened'));
const WhatHappenedPage = lazy(() => import('./pages/WhatHappenedPage/WhatHappenedPage'));
const HomePage = lazy(() => import('./pages/HomePage/HomePage'));
const DistrictPage = lazy(() => import('./pages/DistrictPage/DistrictPage'));
const DeputyPage = lazy(() => import('./pages/DeputyPage/DeputyPage'));
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage }))
);
const FullRankingsPage = lazy(() =>
  import('./pages/LeaderboardPage').then((m) => ({ default: m.FullRankingsPage }))
);
const WasteCalculatorPage = lazy(() =>
  import('./pages/WasteCalculatorPage').then((m) => ({ default: m.WasteCalculatorPage }))
);
const BattlePage = lazy(() =>
  import('./pages/BattlePage').then((m) => ({ default: m.BattlePage }))
);

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-9" />
    </div>
  );
}

const App = () => {
  const { theme } = useAppSettingsStore();

  return (
    <ErrorBoundary>
      <div
        className={cn(
          'flex flex-col h-[100vh] w-[100vw] bg-neutral-1 text-neutral-12 font-serif',
          theme === 'dark' && 'dark'
        )}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="what-happened" element={<WhatHappenedPage />}>
              <Route index element={<WhatHappened />} />
            </Route>

            <Route path="initiatives" element={<InitiativesPage />}>
              <Route index element={<InitiativeList />} />
              <Route path=":selectedInitiativeId/details" element={<InitiativeDetails />} />
            </Route>

            <Route path="parliament" element={<ParliamentPage />}>
              <Route index element={<ParliamentList />} />
            </Route>

            <Route path="about" element={<AboutPage />} />

            {/* Report Card Feature */}
            <Route path="report-card" element={<HomePage />} />
            <Route path="distrito/:districtSlug" element={<DistrictPage />} />
            <Route path="deputado/:deputyId" element={<DeputyPage />} />

            {/* Leaderboard Feature */}
            <Route path="ranking" element={<LeaderboardPage />} />
            <Route path="ranking/completo" element={<FullRankingsPage />} />

            {/* Waste Calculator Feature */}
            <Route path="desperdicio" element={<WasteCalculatorPage />} />

            {/* Battle Royale Feature */}
            <Route path="batalha" element={<BattlePage />} />

            <Route path="*" element={<FourOFour />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default App;

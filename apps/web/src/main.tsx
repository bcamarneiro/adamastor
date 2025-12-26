import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@styles/index.css';
import App from '@/App.tsx';
import { initSentry } from '@/lib/sentry';
import { Theme } from '@radix-ui/themes';
// import AuthProvider from '@services/auth/AuthProvider.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import '@radix-ui/themes/styles.css';

// Initialize Sentry before rendering
initSentry();

const root = document.getElementById('root');

if (root) {
  const queryClient = new QueryClient();

  createRoot(root).render(
    <StrictMode>
      <Theme>
        <QueryClientProvider client={queryClient}>
          {/* <AuthProvider> */}
          <BrowserRouter>
            <App />
          </BrowserRouter>
          {/* </AuthProvider> */}
        </QueryClientProvider>
        <Analytics />
        <SpeedInsights />
      </Theme>
    </StrictMode>
  );
}

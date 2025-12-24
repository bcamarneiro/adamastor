import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import '@styles/index.css';
import App from '@/App.tsx';
import { Theme } from '@radix-ui/themes';
// import AuthProvider from '@services/auth/AuthProvider.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@radix-ui/themes/styles.css';

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
      </Theme>
    </StrictMode>,
  );
}

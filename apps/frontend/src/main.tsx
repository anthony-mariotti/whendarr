import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';

import './styles/globals.css';
import { i18nReady } from './i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 3,
      retryDelay: (attempt) => Math.max(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true
    }
  }
});

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

void i18nReady.then(() => {
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
});

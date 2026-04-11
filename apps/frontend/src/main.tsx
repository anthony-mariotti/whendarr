import '@/styles/globals.css';
import '@/lib/dayjs.js';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from '@/App';

import { i18nReady } from '@/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from '@/components/ui/tooltip';

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
        <TooltipProvider>
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>
  );
});

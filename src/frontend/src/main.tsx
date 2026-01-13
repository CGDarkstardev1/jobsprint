import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, ToastViewport } from '@/components/ui/toast';
import { storageService } from '@/lib/services/storage';

// Initialize services on app startup
storageService
  .initialize()
  .then(() => {
    console.log('[JobSprint] Storage service initialized');
  })
  .catch((err) => {
    console.error('[JobSprint] Failed to initialize storage:', err);
  });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
        <ToastViewport />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

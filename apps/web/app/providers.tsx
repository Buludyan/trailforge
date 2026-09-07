'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { getQueryClient } from '@/lib/queryClient';
import { getStore } from '@/store';

export function Providers({ children }: { children: ReactNode }) {
  const store = getStore();
  const queryClient = getQueryClient();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}

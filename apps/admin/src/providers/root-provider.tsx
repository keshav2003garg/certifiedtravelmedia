import React from 'react';

import { QueryClientProvider } from '@tanstack/react-query';

import type { QueryClient } from '@tanstack/react-query';

interface ProviderProps {
  children: React.ReactNode;
  queryClient: QueryClient;
}

export default function RootProvider(props: ProviderProps) {
  const { children, queryClient } = props;

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

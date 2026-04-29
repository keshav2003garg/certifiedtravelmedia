import React from 'react';

import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import CatchBoundary from '@/components/core/catch-boundary';
import NotFound from '@/components/core/not-found';

import { createQueryClient } from '@/lib/query-client';

import { routeTree } from './routeTree.gen';

import type { FileRouteTypes } from './routeTree.gen';

import RootProvider from '@/providers/root-provider';

export function getRouter() {
  const queryClient = createQueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <RootProvider queryClient={queryClient}>{props.children}</RootProvider>
      );
    },
    defaultErrorComponent: CatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

export type AppRoute = FileRouteTypes['to'];

import React from 'react';

import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router';

import { NuqsAdapter } from '@repo/hooks/nuqs-adapter';
import { Toaster } from '@repo/ui/lib/sonner';

import Devtools from '@/components/core/devtools';

import type { QueryClient } from '@tanstack/react-query';

import appCss from '@/styles/globals.css?url';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Certified Travel Media | Admin' },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '90x90',
        href: '/favicon.png',
      },
    ],
  }),
  shellComponent: RootDocument,
});

interface RootDocumentProps {
  children: React.ReactNode;
}

function RootDocument({ children }: RootDocumentProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sofia">
        <NuqsAdapter>
          {children}
          <Devtools />
          <Scripts />
          <Toaster richColors />
        </NuqsAdapter>
      </body>
    </html>
  );
}

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import {
  SidebarInset,
  SidebarProvider,
} from '@repo/ui/components/base/sidebar';

import Sidebar from '@/components/dashboard/sidebar';
import TopBar from '@/components/dashboard/topbar';

import { getMetadata } from '@/utils/metadata.util';

import { getUser } from '@/functions/get-user-details';

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  component: RouteComponent,
  head: () => getMetadata('/dashboard'),
  loader: async function () {
    const data = await getUser();

    if (!data) {
      throw redirect({ to: '/login' });
    }

    return {
      user: data.user,
      session: data.session,
    };
  },
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
        >
          Skip to main content
        </a>
        <TopBar />
        <div
          id="main-content"
          className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6"
        >
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import AuthMobileHeader from '@/components/auth/mobile-header';
import AuthSidebar from '@/components/auth/sidebar';

import { getUser } from '@/functions/get-user-details';

export const Route = createFileRoute('/(auth)')({
  component: RouteComponent,
  beforeLoad: async function () {
    const user = await getUser();

    if (user) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

function RouteComponent() {
  return (
    <div className="flex h-screen w-full flex-col lg:flex-row">
      <AuthMobileHeader />
      <AuthSidebar />
      <Outlet />
    </div>
  );
}

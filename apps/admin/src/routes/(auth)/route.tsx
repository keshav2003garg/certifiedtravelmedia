// Node Modules
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

// Functions
import { getUser } from '@/functions/get-user-details';

// Components
import AuthSidebar from '@/components/auth/sidebar';
import AuthMobileHeader from '@/components/auth/mobile-header';

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

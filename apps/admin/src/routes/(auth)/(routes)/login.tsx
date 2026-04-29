import { createFileRoute } from '@tanstack/react-router';

import LoginForm from '@/components/auth/login/login-form';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/(auth)/(routes)/login')({
  component: RouteComponent,
  head: () => getMetadata('/login'),
});

function RouteComponent() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-gray-50 lg:w-1/2">
      <LoginForm />
    </div>
  );
}

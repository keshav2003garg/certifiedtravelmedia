import { createFileRoute } from '@tanstack/react-router';

import ForgotPasswordForm from '@/components/auth/forgot-password/forgot-password-form';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/(auth)/(routes)/forgot-password')({
  component: RouteComponent,
  head: () => getMetadata('/forgot-password'),
});

function RouteComponent() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-white lg:w-1/2">
      <ForgotPasswordForm />
    </div>
  );
}

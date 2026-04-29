import { createFileRoute } from '@tanstack/react-router';

import { z } from '@repo/utils/zod';

import ResetPasswordForm from '@/components/auth/reset-password/reset-password-form';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/(auth)/(routes)/reset-password')({
  component: RouteComponent,
  validateSearch: z.object({
    token: z.string().optional(),
  }),
  head: () => getMetadata('/reset-password'),
});

function RouteComponent() {
  const { token } = Route.useSearch();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center bg-white lg:w-1/2">
      <ResetPasswordForm token={token} />
    </div>
  );
}

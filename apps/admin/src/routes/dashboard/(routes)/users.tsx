import { createFileRoute } from '@tanstack/react-router';

import UsersPage from '@/components/dashboard/users/users-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/users')({
  component: UsersPage,
  head: () => getMetadata('/dashboard/users'),
});

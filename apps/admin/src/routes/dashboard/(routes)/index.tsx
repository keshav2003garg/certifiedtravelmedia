import { createFileRoute, redirect } from '@tanstack/react-router';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/')({
  beforeLoad: function () {
    throw redirect({ to: '/dashboard/charts' });
  },
  component: function () {
    return null;
  },
  head: () => getMetadata('/dashboard'),
});

import { createFileRoute } from '@tanstack/react-router';

import NewInventoryIntakePage from '@/components/dashboard/inventory/requests/new-intake-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute(
  '/dashboard/(routes)/inventory/new-intake',
)({
  component: NewInventoryIntakePage,
  head: () => getMetadata('/dashboard/inventory/new-intake'),
});

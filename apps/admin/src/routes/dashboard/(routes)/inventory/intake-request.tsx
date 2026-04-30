import { createFileRoute } from '@tanstack/react-router';

import NewInventoryIntakePage from '@/components/dashboard/inventory/intake-request/new-intake-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute(
  '/dashboard/(routes)/inventory/intake-request',
)({
  component: NewInventoryIntakePage,
  head: () => getMetadata('/dashboard/inventory/intake-request'),
});

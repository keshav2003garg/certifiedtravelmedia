import { createFileRoute } from '@tanstack/react-router';

import InventoryRequestsQueuePage from '@/components/dashboard/inventory/request-queue/inventory-requests-queue-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute(
  '/dashboard/(routes)/inventory/request-queue',
)({
  component: InventoryRequestsQueuePage,
  head: () => getMetadata('/dashboard/inventory/request-queue'),
});

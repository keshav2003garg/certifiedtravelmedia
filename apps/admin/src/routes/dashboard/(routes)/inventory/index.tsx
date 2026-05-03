import { createFileRoute } from '@tanstack/react-router';

import InventoryItemsPage from '@/components/dashboard/inventory/items/inventory-items-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/inventory/')({
  component: InventoryItemsPage,
  head: () => getMetadata('/dashboard/inventory'),
});
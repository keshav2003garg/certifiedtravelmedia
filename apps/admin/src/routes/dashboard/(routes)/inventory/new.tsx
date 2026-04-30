import { createFileRoute } from '@tanstack/react-router';

import NewInventoryPage from '@/components/dashboard/inventory/new/new-inventory-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/inventory/new')({
  component: NewInventoryPage,
  head: () => getMetadata('/dashboard/inventory/new'),
});

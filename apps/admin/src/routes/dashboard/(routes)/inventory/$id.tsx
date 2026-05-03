import { createFileRoute } from '@tanstack/react-router';

import InventoryDetailPage from '@/components/dashboard/inventory/items/detail/inventory-detail-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/inventory/$id')({
  component: RouteComponent,
  head: () => getMetadata('/dashboard/inventory/$id'),
});

function RouteComponent() {
  const { id } = Route.useParams();

  return <InventoryDetailPage inventoryId={id} />;
}

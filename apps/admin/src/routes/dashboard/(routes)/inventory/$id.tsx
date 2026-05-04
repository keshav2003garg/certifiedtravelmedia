import { createFileRoute, redirect } from '@tanstack/react-router';

import InventoryDetailPage from '@/components/dashboard/inventory/items/detail/inventory-detail-page';

import { getMetadata } from '@/utils/metadata.util';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const Route = createFileRoute('/dashboard/(routes)/inventory/$id')({
  beforeLoad: ({ params }) => {
    if (!UUID_PATTERN.test(params.id)) {
      throw redirect({ to: '/dashboard/inventory' });
    }
  },
  component: RouteComponent,
  head: () => getMetadata('/dashboard/inventory/$id'),
});

function RouteComponent() {
  const { id } = Route.useParams();

  return <InventoryDetailPage inventoryId={id} />;
}

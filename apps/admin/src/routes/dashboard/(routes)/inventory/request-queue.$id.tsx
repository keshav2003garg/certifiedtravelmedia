import { createFileRoute } from '@tanstack/react-router';

import InventoryRequestReviewPage from '@/components/dashboard/inventory/request-queue/review-form/inventory-request-review-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute(
  '/dashboard/(routes)/inventory/request-queue/$id',
)({
  component: RouteComponent,
  head: () => getMetadata('/dashboard/inventory/request-queue/$id'),
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <InventoryRequestReviewPage requestId={id} />;
}

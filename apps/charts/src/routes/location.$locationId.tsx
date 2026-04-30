import { createFileRoute } from '@tanstack/react-router';

import { ChartPage } from '@/components/chart/chart-page';
import { ChartPageError } from '@/components/chart/chart-page-error';
import { ChartPageSkeleton } from '@/components/chart/chart-page-skeleton';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/location/$locationId')({
  component: RouteComponent,
  pendingComponent: ChartPageSkeleton,
  errorComponent: ChartPageError,
  head: () => getMetadata('/location/$locationId'),
});

function RouteComponent() {
  const { locationId } = Route.useParams();

  return <ChartPage locationId={locationId} />;
}

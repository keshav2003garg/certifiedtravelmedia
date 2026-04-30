import { createFileRoute } from '@tanstack/react-router';

import ChartsPage from '@/components/dashboard/charts/charts-list/charts-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/charts/')({
  component: ChartsPage,
  head: () => getMetadata('/dashboard/charts'),
});

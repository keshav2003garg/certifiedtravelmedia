import { createFileRoute } from '@tanstack/react-router';

import MonthEndCountsPage from '@/components/dashboard/inventory/month-end-counts/month-end-counts-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute(
  '/dashboard/(routes)/inventory/month-end-counts',
)({
  component: MonthEndCountsPage,
  head: () => getMetadata('/dashboard/inventory/month-end-counts'),
});

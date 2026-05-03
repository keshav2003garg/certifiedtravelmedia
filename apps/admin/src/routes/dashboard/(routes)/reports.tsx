import { createFileRoute } from '@tanstack/react-router';

import ReportsPage from '@/components/dashboard/reports/reports-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/reports')({
  component: ReportsPage,
  head: () => getMetadata('/dashboard/reports'),
});

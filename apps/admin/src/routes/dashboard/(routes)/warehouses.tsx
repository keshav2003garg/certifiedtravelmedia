import { createFileRoute } from '@tanstack/react-router';

import WarehousesPage from '@/components/dashboard/configs/warehouses/warehouses-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/warehouses')({
  component: WarehousesPage,
  head: () => getMetadata('/dashboard/warehouses'),
});

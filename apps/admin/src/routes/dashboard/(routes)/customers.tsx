import { createFileRoute } from '@tanstack/react-router';

import CustomersPage from '@/components/dashboard/configs/customers/customers-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/customers')({
  component: CustomersPage,
  head: () => getMetadata('/dashboard/customers'),
});

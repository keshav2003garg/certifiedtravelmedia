import { createFileRoute } from '@tanstack/react-router';

import LocationsPage from '@/components/dashboard/locations/locations-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/locations')({
  component: LocationsPage,
  head: () => getMetadata('/dashboard/locations'),
});

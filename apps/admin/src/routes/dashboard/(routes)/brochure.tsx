import { createFileRoute } from '@tanstack/react-router';

import BrochurePage from '@/components/dashboard/configs/brochure/brochure-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/brochure')({
  component: BrochurePage,
  head: () => getMetadata('/dashboard/brochure'),
});

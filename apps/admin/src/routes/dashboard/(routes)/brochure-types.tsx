import { createFileRoute } from '@tanstack/react-router';

import BrochureTypesPage from '@/components/dashboard/configs/brochure-types/brochure-types-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/brochure-types')({
  component: BrochureTypesPage,
  head: () => getMetadata('/dashboard/brochure-types'),
});

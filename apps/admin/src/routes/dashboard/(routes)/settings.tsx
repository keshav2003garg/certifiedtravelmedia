import { createFileRoute } from '@tanstack/react-router';

import SettingsPage from '@/components/dashboard/settings/settings-page';

import { getMetadata } from '@/utils/metadata.util';

export const Route = createFileRoute('/dashboard/(routes)/settings')({
  component: SettingsPage,
  head: () => getMetadata('/dashboard/settings'),
});

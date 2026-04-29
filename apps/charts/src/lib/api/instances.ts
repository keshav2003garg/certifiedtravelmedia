import { env } from '@repo/env/client';

import { createApiClient } from './client';

export const api = createApiClient(`${env.VITE_API_URL}/api`);

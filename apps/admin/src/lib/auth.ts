import { env } from '@repo/env/client';

import { adminClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import type { BetterAuth } from '@services/betterauth';

export const auth = createAuthClient({
  baseURL: env.VITE_API_URL,
  plugins: [inferAdditionalFields<BetterAuth>(), adminClient()],
});

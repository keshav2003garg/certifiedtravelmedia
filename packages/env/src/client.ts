import { createEnv } from '@t3-oss/env-core';

import { z } from '@repo/utils/zod';

export const env = createEnv({
  clientPrefix: 'VITE_',

  client: {
    VITE_API_URL: z.url(),
    VITE_ADMIN_APP_URL: z.url(),
    VITE_CHARTS_APP_URL: z.url(),
  },

  runtimeEnv: import.meta.env,
});

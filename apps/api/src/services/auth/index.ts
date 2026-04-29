import { env } from '@repo/env/server';
import db from '@/db';

import createBetterAuth from '@services/betterauth';
import { emailService } from '@/services/email';

const auth = createBetterAuth({
  db,
  emailService,
  env: {
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,

    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    COOKIE_DOMAIN: env.COOKIE_DOMAIN,
  },
});

export default auth;

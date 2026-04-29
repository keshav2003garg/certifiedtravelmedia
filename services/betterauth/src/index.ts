import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';

import {
  accountSchema,
  sessionSchema,
  userSchema,
  verificationSchema,
} from '@services/database/schemas';

import {
  createCookieConfig,
  createEmailPasswordConfig,
  createEmailVerificationConfig,
} from './configs';
import {
  accountConfig,
  sessionConfig,
  userConfig,
  verificationConfig,
} from './configs/schema';
import { createSignupHook } from './hooks';
import { adminPlugin } from './plugins';

import type { Database } from '@services/database';
import type EmailService from '@services/email';

interface CreateBetterAuthProps {
  db: Database;
  emailService: EmailService;
  env: {
    ALLOWED_ORIGINS: string[];

    BETTER_AUTH_URL: string;
    BETTER_AUTH_SECRET: string;
    COOKIE_DOMAIN: string;
  };
}

export default function createBetterAuth({
  db,
  emailService,
  env,
}: CreateBetterAuthProps) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: env.ALLOWED_ORIGINS,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: userSchema,
        session: sessionSchema,
        account: accountSchema,
        verification: verificationSchema,
      },
    }),
    user: userConfig,
    session: sessionConfig,
    verification: verificationConfig,
    account: accountConfig,

    plugins: [openAPI(), adminPlugin()],
    emailAndPassword: createEmailPasswordConfig(emailService),
    emailVerification: createEmailVerificationConfig(emailService),
    hooks: {
      before: createSignupHook(),
    },
    advanced: {
      useSecureCookies: true,
      cookies: createCookieConfig(env.COOKIE_DOMAIN),
    },
  });
}

export type BetterAuth = ReturnType<typeof createBetterAuth>;

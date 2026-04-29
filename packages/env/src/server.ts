import { createEnv } from '@t3-oss/env-core';

import { z } from '@repo/utils/zod';

export const env = createEnv({
  server: {
    // Environment
    ENVIRONMENT: z.enum(['development', 'staging', 'production']),

    // Database
    DATABASE_URL: z.url(),

    // Email
    SMTP_HOST: z.string(),
    SMTP_PORT: z.string().transform((val) => parseInt(val, 10)),
    SMTP_USERNAME: z.string(),
    SMTP_PASSWORD: z.string(),
    SMTP_NAME: z.string(),
    SMTP_MAIL: z.string(),
    SMTP_REPLY_TO: z.string(),

    // API
    /** Auth */
    ALLOWED_ORIGINS: z
      .string()
      .transform((val) => val.split(',').map((origin) => origin.trim())),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string(),
    COOKIE_DOMAIN: z.string(),
    /** App URLs */
    API_URL: z.url(),
    ADMIN_APP_URL: z.url(),
    CHARTS_APP_URL: z.url(),
    /** Supabase Storage */
    SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_KEY: z.string().min(1),
    /** Route4Me */
    ROUTE4ME_API_KEY: z.string().min(1),
    /** Airtable */
    AIRTABLE_API_KEY: z.string().min(1),
    AIRTABLE_BASE_ID: z.string().min(1),
    AIRTABLE_TABLE_ID: z.string().min(1),
    AIRTABLE_VIEW_ID: z.string().min(1),
    /** Acumatica */
    ACUMATICA_BASE_URL: z.url(),
    ACUMATICA_TENANT: z.string().min(1),
    ACUMATICA_USERNAME: z.string().min(1),
    ACUMATICA_PASSWORD: z.string().min(1),
  },

  runtimeEnv: process.env,
});

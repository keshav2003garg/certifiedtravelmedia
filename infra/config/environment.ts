/// <reference path="../../env.d.ts" />
/// <reference path="../../.sst/platform/config.d.ts" />

type ServerEnvironment = sst.aws.FunctionArgs['environment'];
type ClientEnvironment = sst.aws.TanStackStartArgs['environment'];

export const serverEnvironment = {
  // Environment
  ENVIRONMENT: process.env.ENVIRONMENT,

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Email
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_NAME: process.env.SMTP_NAME,
  SMTP_MAIL: process.env.SMTP_MAIL,
  SMTP_REPLY_TO: process.env.SMTP_REPLY_TO,

  // API
  /** Auth */
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  /** App URLs */
  API_URL: process.env.API_URL,
  ADMIN_APP_URL: process.env.ADMIN_APP_URL,
  CHARTS_APP_URL: process.env.CHARTS_APP_URL,
  /** Supabase Storage */
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  /** Route4Me */
  ROUTE4ME_API_KEY: process.env.ROUTE4ME_API_KEY,
  /** Airtable */
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_ID: process.env.AIRTABLE_TABLE_ID,
  AIRTABLE_VIEW_ID: process.env.AIRTABLE_VIEW_ID,
  /** Acumatica */
  ACUMATICA_BASE_URL: process.env.ACUMATICA_BASE_URL,
  ACUMATICA_TENANT: process.env.ACUMATICA_TENANT,
  ACUMATICA_USERNAME: process.env.ACUMATICA_USERNAME,
  ACUMATICA_PASSWORD: process.env.ACUMATICA_PASSWORD,
} satisfies ServerEnvironment;

export const clientEnvironment = {
  // Admin & Charts App
  VITE_API_URL: process.env.VITE_API_URL,
  VITE_ADMIN_APP_URL: process.env.VITE_ADMIN_APP_URL,
  VITE_CHARTS_APP_URL: process.env.VITE_CHARTS_APP_URL,
} satisfies ClientEnvironment;

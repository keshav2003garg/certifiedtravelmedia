declare namespace NodeJS {
  interface ProcessEnv {
    // Environment
    ENVIRONMENT: 'staging' | 'production';

    // Database
    DATABASE_URL: string;

    // Email
    SMTP_HOST: string;
    SMTP_PORT: string;
    SMTP_USERNAME: string;
    SMTP_PASSWORD: string;
    SMTP_NAME: string;
    SMTP_MAIL: string;
    SMTP_REPLY_TO: string;

    // API
    /** Auth */
    ALLOWED_ORIGINS: string;
    BETTER_AUTH_URL: string;
    BETTER_AUTH_SECRET: string;
    COOKIE_DOMAIN: string;
    /** App URLs */
    API_URL: string;
    ADMIN_APP_URL: string;
    CHARTS_APP_URL: string;
    /** Supabase Storage */
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;
    /** Route4Me */
    ROUTE4ME_API_KEY: string;
    /** Airtable */
    AIRTABLE_API_KEY: string;
    AIRTABLE_BASE_ID: string;
    AIRTABLE_TABLE_ID: string;
    AIRTABLE_VIEW_ID: string;
    /** Acumatica */
    ACUMATICA_BASE_URL: string;
    ACUMATICA_TENANT: string;
    ACUMATICA_USERNAME: string;
    ACUMATICA_PASSWORD: string;

    // Admin & Charts App
    VITE_API_URL: string;
    VITE_ADMIN_APP_URL: string;
    VITE_CHARTS_APP_URL: string;

    // AWS
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;

    // Cloudflare
    CLOUDFLARE_API_TOKEN: string;
    CLOUDFLARE_DEFAULT_ACCOUNT_ID: string;
  }
}

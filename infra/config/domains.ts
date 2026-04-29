/// <reference path="../../env.d.ts" />

type AppDomains = {
  charts: string;
  api: string;
  admin: string;
};

type Environment = 'production' | 'staging';

const domains: Record<Environment, AppDomains> = {
  production: {
    charts: 'certifiedtravelmedia.net',
    api: 'api.certifiedtravelmedia.net',
    admin: 'admin.certifiedtravelmedia.net',
  },
  staging: {
    charts: 'staging.certifiedtravelmedia.net',
    api: 'staging.api.certifiedtravelmedia.net',
    admin: 'staging.admin.certifiedtravelmedia.net',
  },
};

export const appDomains: AppDomains =
  domains[process.env.ENVIRONMENT ?? 'production'];

export function wwwRedirect(domain: string) {
  return `www.${domain}`;
}

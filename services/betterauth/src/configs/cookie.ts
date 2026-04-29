import type { BetterAuthOptions } from 'better-auth';

export function createCookieConfig(
  cookieDomain: string,
): NonNullable<BetterAuthOptions['advanced']>['cookies'] {
  return {
    session_token: {
      name: 'session_token',
      attributes: {
        secure: true,
        httpOnly: true,
        domain: cookieDomain,
      },
    },
    session_data: {
      name: 'session_data',
      attributes: {
        secure: true,
        httpOnly: true,
        domain: cookieDomain,
      },
    },
  };
}

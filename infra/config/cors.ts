/// <reference path="../../env.d.ts" />
/// <reference path="../../.sst/platform/config.d.ts" />

type Cors = sst.aws.ApiGatewayV2Args['cors'];

const shared = {
  maxAge: '600 seconds',
  allowCredentials: true,
  exposeHeaders: ['Content-Length'],
} satisfies Cors;

export const corsConfig: Record<'api', Cors> = {
  api: {
    ...shared,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowOrigins: process.env.ALLOWED_ORIGINS.split(','),
  },
};

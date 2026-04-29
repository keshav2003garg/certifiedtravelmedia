/// <reference path="../.sst/platform/config.d.ts" />

import { appDomains, corsConfig, serverEnvironment } from './config';

export const api = new sst.aws.ApiGatewayV2('CertifiedTravelMediaApi', {
  domain: {
    name: appDomains.api,
    dns: sst.cloudflare.dns(),
  },
  cors: corsConfig.api,
});

api.route('ANY /{proxy+}', {
  handler: 'apps/api/src/lambda.handler',
  timeout: '300 seconds',
  environment: serverEnvironment,
});

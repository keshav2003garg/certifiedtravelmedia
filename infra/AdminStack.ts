/// <reference path="../.sst/platform/config.d.ts" />

import { appDomains, clientEnvironment, wwwRedirect } from './config';

export const adminApp = new sst.aws.TanStackStart('CertifiedTravelMediaAdmin', {
  path: 'apps/admin',
  domain: {
    name: appDomains.admin,
    redirects: [wwwRedirect(appDomains.admin)],
    dns: sst.cloudflare.dns(),
  },
  environment: clientEnvironment,
  buildCommand: 'pnpm build',
});

new awsnative.lambda.Permission('CertifiedTravelMediaAdmin:InvokePermission', {
  action: 'lambda:InvokeFunction',
  functionName: adminApp.nodes.server!.name,
  principal: '*',
  invokedViaFunctionUrl: true,
});

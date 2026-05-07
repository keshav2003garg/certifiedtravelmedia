/// <reference path="../.sst/platform/config.d.ts" />

import { appDomains, clientEnvironment, wwwRedirect } from './config';

export const adminApp = new sst.aws.TanStackStart('CTMAdmin', {
  path: 'apps/admin',
  domain: {
    name: appDomains.admin,
    redirects: [wwwRedirect(appDomains.admin)],
    dns: sst.cloudflare.dns(),
  },
  environment: clientEnvironment,
  buildCommand: 'pnpm build',
});

new awsnative.lambda.Permission('CTMAdmin:InvokePermission', {
  action: 'lambda:InvokeFunction',
  functionName: adminApp.nodes.server!.name,
  principal: '*',
  invokedViaFunctionUrl: true,
});

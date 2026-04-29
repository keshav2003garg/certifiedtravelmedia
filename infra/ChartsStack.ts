/// <reference path="../.sst/platform/config.d.ts" />

import { appDomains, clientEnvironment, wwwRedirect } from './config';

export const chartsApp = new sst.aws.TanStackStart(
  'CertifiedTravelMediaCharts',
  {
    path: 'apps/charts',
    domain: {
      name: appDomains.charts,
      redirects: [wwwRedirect(appDomains.charts)],
      dns: sst.cloudflare.dns(),
    },
    environment: clientEnvironment,
    buildCommand: 'pnpm build',
  },
);

new awsnative.lambda.Permission('CertifiedTravelMediaCharts:InvokePermission', {
  action: 'lambda:InvokeFunction',
  functionName: chartsApp.nodes.server!.name,
  principal: '*',
  invokedViaFunctionUrl: true,
});

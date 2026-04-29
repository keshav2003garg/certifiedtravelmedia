/// <reference path="../../env.d.ts" />
/// <reference path="../../.sst/platform/config.d.ts" />

type AwsRegion = (typeof aws)['Region'][keyof (typeof aws)['Region']];

type Environment = 'production' | 'staging';

const regions: Record<Environment, AwsRegion> = {
  production: 'us-east-1',
  staging: 'ap-south-1',
};

export const region: AwsRegion =
  regions[process.env.ENVIRONMENT ?? 'production'];

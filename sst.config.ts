/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  async app() {
    const { region } = await import('./infra/config');

    return {
      home: 'aws',
      name: 'certifiedtravelmedia',
      providers: {
        aws: { region },
        'aws-native': {
          region,
          version: '1.56.0',
        },
      },
    };
  },
  async run() {
    await import('./infra/ApiStack');

    await import('./infra/ChartsStack');
    await import('./infra/AdminStack');
  },
});

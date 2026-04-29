import config from '@repo/esconfig/react';

export default [
	{
		ignores: ['.nitro/**', '.output/**', 'dist/**'],
	},
	...config,
];

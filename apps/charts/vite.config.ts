import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    nitroV2Plugin({ preset: 'aws-lambda' }),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  envDir: '../../',
  build: { chunkSizeWarningLimit: 1000 },
  css: { devSourcemap: true },
});

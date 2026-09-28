import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { runtimeAssets } from './build/runtimeAssets.ts';
import { dependencyNotices } from './build/dependencyNotices.ts';

export default defineConfig({
  resolve: { alias: { 'tower-presentation': fileURLToPath(new URL('../tools/asset-presentation/digital-resolve.js', import.meta.url)) } },
  plugins: [react(), runtimeAssets(fileURLToPath(new URL('..', import.meta.url))), dependencyNotices()],
  publicDir: false,
  base: './',
  build: { outDir: 'dist' },
});

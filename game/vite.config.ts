import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { runtimeAssets } from './build/runtimeAssets.ts';
import { dependencyNotices } from './build/dependencyNotices.ts';
import { performanceBuild } from './build/performanceBuild.ts';

export function stressMapEnabled(mode: string, environment: Record<string, string | undefined>): boolean {
  return environment.VITE_ENABLE_STRESS_MAP === 'true' || (mode !== 'release' && environment.VITE_ENABLE_STRESS_MAP !== 'false');
}

export default defineConfig(({ mode }) => ({
  define: { __STRESS_MAP_ENABLED__: JSON.stringify(stressMapEnabled(mode, { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env })) },
  resolve: { alias: { 'tower-presentation': fileURLToPath(new URL('../tools/asset-presentation/digital-resolve.js', import.meta.url)) } },
  plugins: [react(), runtimeAssets(fileURLToPath(new URL('..', import.meta.url))), dependencyNotices(), performanceBuild()],
  publicDir: false,
  base: './',
  build: { outDir: 'dist' },
}));

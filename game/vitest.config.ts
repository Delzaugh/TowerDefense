import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: { alias: { 'tower-presentation': fileURLToPath(new URL('../tools/asset-presentation/digital-resolve.js', import.meta.url)) } },
  test: { environment: 'node', include: ['tests/**/*.test.ts'], restoreMocks: true },
});

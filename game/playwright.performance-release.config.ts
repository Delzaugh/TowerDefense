import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance', testMatch: 'release.spec.ts', workers: 1,
  outputDir: './test-results/performance-release',
  use: { baseURL: 'http://127.0.0.1:5186', channel: process.env.CI ? 'chromium' : 'msedge' },
  webServer: {
    command: 'npx vite build --mode release --outDir=test-results/performance-release-build && npx vite preview --outDir=test-results/performance-release-build --host 127.0.0.1 --port 5186 --strictPort',
    url: 'http://127.0.0.1:5186', reuseExistingServer: false,
  },
});

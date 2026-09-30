import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance', testMatch: 'baseline.spec.ts', fullyParallel: false, workers: 1,
  outputDir: './test-results/performance', timeout: 120_000,
  use: { baseURL: 'http://127.0.0.1:5185', trace: 'retain-on-failure', headless: !process.env.TOWER_PERF_HEADED },
  webServer: { command: 'npm run preview -- --port 5185', url: 'http://127.0.0.1:5185', reuseExistingServer: false },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Edge'], channel: process.env.CI ? 'chromium' : 'msedge' } },
    { name: 'phone-emulated', use: { ...devices['Pixel 7'], channel: process.env.CI ? 'chromium' : 'msedge' } },
  ],
});

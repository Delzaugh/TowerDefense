import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // Bound browser CPU contention: the app intentionally hard-pauses on large frame gaps.
  workers: 4,
  use: { baseURL: 'http://127.0.0.1:5183', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview -- --port 5183',
    url: 'http://127.0.0.1:5183',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'desktop-edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    { name: 'touch-edge', use: { ...devices['Pixel 7'], channel: 'msedge' } },
  ],
});

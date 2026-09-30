import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://127.0.0.1:6007',
    channel: process.env.CI ? 'chromium' : 'msedge',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview:storybook',
    url: 'http://127.0.0.1:6007',
    reuseExistingServer: false,
  },
});

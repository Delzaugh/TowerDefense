import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/deployment',
  outputDir: './test-results/deployment',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5184/TowerDefense/', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview -- --port 5184 --base /TowerDefense/ --outDir test-results/subpath-build',
    url: 'http://127.0.0.1:5184/TowerDefense/', reuseExistingServer: false,
  },
  projects: [{ name: 'landscape-edge', use: { ...devices['Desktop Edge'], channel: process.env.CI ? 'chromium' : 'msedge', viewport: { width: 844, height: 390 }, hasTouch: true } }],
});

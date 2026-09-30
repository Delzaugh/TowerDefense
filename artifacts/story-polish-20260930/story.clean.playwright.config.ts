import base from '../../game/playwright.config';
export default {
  ...base,
  testDir: '../../game/tests/e2e',
  outputDir: './clean',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5187' },
  webServer: undefined,
};

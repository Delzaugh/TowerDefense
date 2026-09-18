import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/simulation/**/*.ts', 'src/content/**/*.ts', 'src/session/fixedStepClock.ts'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'indexedDB', 'performance', 'Date', 'setTimeout', 'setInterval'],
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Simulation randomness must be explicit and reproducible.' }],
    },
  },
);

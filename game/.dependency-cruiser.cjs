module.exports = {
  forbidden: [
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    { name: 'production-not-tests', severity: 'error', from: { path: '^src/' }, to: { path: '^tests/' } },
    { name: 'production-not-workshop', severity: 'error', from: { path: '^src/' }, to: { path: '^(stories/|\\.storybook/|node_modules/(storybook|@storybook)/)' } },
    {
      name: 'ui-toolkit-independent', severity: 'error',
      from: { path: '^src/ui/toolkit/' },
      to: { path: '^src/(app|rendering|session|simulation|content|progression|persistence)/' },
    },
    {
      name: 'pure-core-only', severity: 'error',
      from: { path: '^src/(simulation|content|progression)/' },
      to: { pathNot: '^(src/(simulation|content|progression)/|node_modules/zod/)' },
    },
    { name: 'content-does-not-import-rules', severity: 'error', from: { path: '^src/content/' }, to: { path: '^src/(simulation|progression)/' } },
    { name: 'simulation-does-not-import-progression', severity: 'error', from: { path: '^src/simulation/' }, to: { path: '^src/progression/' } },
    { name: 'browser-not-build-tools', severity: 'error', from: { path: '^src/' }, to: { path: '(^build/|^\.\./tools/(?!asset-presentation/digital-resolve\\.js$))', dependencyTypes: ['local', 'localmodule'] } },
    { name: 'browser-not-node', severity: 'error', from: { path: '^src/' }, to: { dependencyTypes: ['core'] } },
    { name: 'app-not-prototypes', severity: 'error', from: { path: '^src/' }, to: { path: '(^|/)prototypes/' } },
    { name: 'assets-through-catalog', severity: 'error', from: { path: '^src/' }, to: { path: '(^|/)(blender|assets/runtime|assets/third_party)/' } },
  ],
  options: { doNotFollow: { path: 'node_modules' }, tsConfig: { fileName: 'tsconfig.app.json' }, tsPreCompilationDeps: true },
};

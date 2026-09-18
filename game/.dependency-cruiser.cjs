module.exports = {
  forbidden: [
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    { name: 'production-not-tests', severity: 'error', from: { path: '^src/' }, to: { path: '^tests/' } },
    {
      name: 'pure-core-only', severity: 'error',
      from: { path: '^src/(simulation|content|progression)/' },
      to: { pathNot: '^(src/(simulation|content|progression)/|node_modules/zod/)' },
    },
    { name: 'content-does-not-import-rules', severity: 'error', from: { path: '^src/content/' }, to: { path: '^src/(simulation|progression)/' } },
    { name: 'simulation-does-not-import-progression', severity: 'error', from: { path: '^src/simulation/' }, to: { path: '^src/progression/' } },
    { name: 'browser-not-build-tools', severity: 'error', from: { path: '^src/' }, to: { path: '(^build/|^\.\./tools/)', dependencyTypes: ['local', 'localmodule'] } },
    { name: 'browser-not-node', severity: 'error', from: { path: '^src/' }, to: { dependencyTypes: ['core'] } },
  ],
  options: { doNotFollow: { path: 'node_modules' }, tsConfig: { fileName: 'tsconfig.app.json' }, tsPreCompilationDeps: true },
};

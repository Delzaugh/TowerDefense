import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/** Build content, rather than a possibly dirty Git revision, identifies measured code and assets. */
export function performanceBuild(): Plugin {
  return {
    name: 'tower-performance-build',
    generateBundle(_, bundle) {
      const files = Object.values(bundle).map(item => {
        const source = item.type === 'chunk' ? item.code : item.source;
        const bytes = typeof source === 'string' ? Buffer.from(source) : Buffer.from(source);
        return { path: item.fileName, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
      }).sort((a, b) => a.path.localeCompare(b.path));
      this.emitFile({ type: 'asset', fileName: 'performance-build.json', source: JSON.stringify({
        schemaVersion: 1, release: createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 16), files,
      }) });
    },
  };
}

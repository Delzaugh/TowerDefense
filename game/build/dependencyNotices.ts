import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

/** Notices for the renderer, interface icons and bundled font. */
export function dependencyNotices(): Plugin {
  return {
    name: 'tower-dependency-notices',
    async generateBundle() {
      for (const [dependency, name] of [['three', 'three'], ['@primer/octicons-react', 'octicons'], ['@fontsource-variable/mona-sans', 'mona-sans']] as const) {
        const source = await readFile(fileURLToPath(new URL(`../node_modules/${dependency}/LICENSE`, import.meta.url)), 'utf8');
        this.emitFile({ type: 'asset', fileName: `licenses/${name}.txt`, source });
      }
    },
  };
}

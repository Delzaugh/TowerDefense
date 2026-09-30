import { fileURLToPath } from 'node:url';
import { runtimeAssets } from '../../game/build/runtimeAssets.ts';
const root = fileURLToPath(new URL('.', import.meta.url));
const repository = fileURLToPath(new URL('../..', import.meta.url));
export default {
  root, base: './', publicDir: false,
  plugins: [runtimeAssets(repository)],
  resolve: { alias: [
    { find: 'three/addons', replacement: fileURLToPath(new URL('../../game/node_modules/three/examples/jsm', import.meta.url)) },
    { find: /^three$/, replacement: fileURLToPath(new URL('../../game/node_modules/three/build/three.module.js', import.meta.url)) },
  ] },
  server: { fs: { allow: [repository] } },
  build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0 },
};

import { createServer } from '../../../game/node_modules/vite/dist/node/index.js';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)), optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true } });
try {
  const { verifyDraftController } = await server.ssrLoadModule('/src/draft.verify.ts');
  const result = verifyDraftController();
  await writeFile(new URL('./native-evidence.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally { await server.close(); }

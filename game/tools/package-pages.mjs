import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const output = fileURLToPath(new URL('../dist/', import.meta.url));
const index = await readFile(path.join(output, 'index.html'), 'utf8');
if (!index.includes('/TowerDefense/assets/')) throw new Error('Build with the /TowerDefense/ base before packaging Pages.');

await writeFile(path.join(output, '.nojekyll'), '');
await mkdir(path.join(output, 'simulation'), { recursive: true });
await writeFile(path.join(output, 'simulation/index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Copilot Hub</title><meta http-equiv="refresh" content="0;url=/TowerDefense/">
<link rel="canonical" href="https://delzaugh.github.io/TowerDefense/"></head>
<body><p>The simulation preview has moved to <a href="/TowerDefense/">Copilot Hub</a>.</p></body></html>
`);

const files = [];
async function inventory(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) await inventory(path.join(directory, entry.name), relative + '/');
    else if (relative !== 'build-info.json') {
      const bytes = await readFile(path.join(directory, entry.name));
      files.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
  }
}
await inventory(output);
files.sort((a, b) => a.path.localeCompare(b.path));
const release = createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0, 16);
await writeFile(path.join(output, 'build-info.json'), JSON.stringify({
  application: 'copilot-hub', base: '/TowerDefense/', builtAt: new Date().toISOString(), release,
  sourceRevision: process.env.GITHUB_SHA ?? null,
  manifest: files,
  files: files.length + 1,
}, null, 2) + '\n');
console.log(JSON.stringify({ output, release, files: files.length + 1, bytes: files.reduce((sum, file) => sum + file.bytes, 0) }));

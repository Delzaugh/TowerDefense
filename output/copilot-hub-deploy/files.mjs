import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = path.join(root, 'game/dist');
const files = [];
async function scan(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) await scan(path.join(dir, entry.name), prefix + entry.name + '/');
    else files.push({ path: prefix + entry.name, local: path.join(dir, entry.name) });
  }
}
await scan(directory);
files.sort((a,b) => a.path.localeCompare(b.path));
files.push({ path: '.github/workflows/campus-pages.yml', local: path.join(root, '.github/workflows/campus-pages.yml') });
const mode = process.argv[2];
if (mode === 'read') {
  const index = Number(process.argv[3]);
  const bytes = await readFile(files[index].local);
  const offset = Number(process.argv[4] ?? 0), length = Number(process.argv[5] ?? bytes.length);
  console.log(JSON.stringify({ index, bytes: bytes.length, content: bytes.subarray(offset, offset + length).toString('base64') }));
} else {
  const inventory = await Promise.all(files.map(async (file, index) => {
    const bytes = await readFile(file.local);
    return { index, ...file, bytes: bytes.length,
      sha: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') };
  }));
  console.log(JSON.stringify(inventory));
}

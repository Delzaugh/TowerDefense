import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';
import { resolveRuntimeAsset, runtimeAssets } from '../../build/runtimeAssets';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) {
    if (path.dirname(root) !== tmpdir() || !path.basename(root).startsWith('tower-build-')) throw new Error('Unexpected test directory.');
    await rm(root, { recursive: true, force: true });
  }
});

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'tower-build-'));
  roots.push(root);
  const json = Buffer.from(JSON.stringify({ asset: { version: '2.0' } }).padEnd(32, ' '));
  const bytes = Buffer.alloc(20 + json.length);
  bytes.write('glTF'); bytes.writeUInt32LE(2, 4); bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(json.length, 12); bytes.writeUInt32LE(0x4e4f534a, 16); json.copy(bytes, 20);
  const manifest = {
    schemaVersion: 1, id: 'test_tower', version: 'v01', category: 'towers', revision: 1,
    runtime: 'assets/runtime/towers/test_tower_v01.glb',
    source: { path: 'private-authoring.blend', authoritativeHash: 'authoring-hash' },
    decisions: 'private-decisions.md', references: ['private-reference.png'],
    contract: { root: 'root', up: '+Y', forward: '+Z', metres: true, rootMotion: false, anchors: ['anchor_ui'], groundTolerance: 0.002 },
    clips: [{ name: 'idle', playback: 'loop', fps: 24, meaning: 'private-authoring-notes' }],
    delivery: { sha256: createHash('sha256').update(bytes).digest('hex'), report: 'private-report.json' },
  };
  const catalog = { schemaVersion: 1, assets: [
    { id: 'test_tower', version: 'v01', manifest: 'blender/towers/test_tower/v01/asset.json' },
    { id: 'unrelated_draft', version: 'v01', manifest: 'blender/towers/unrelated_draft/v01/asset.json' },
  ] };
  async function put(relative: string, content: string | Buffer) {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  await put('assets/asset_catalog.json', JSON.stringify(catalog));
  await put(catalog.assets[0]!.manifest, JSON.stringify(manifest));
  await put(manifest.runtime, bytes);
  await put('game/index.html', '<html><body><script type="module" src="/entry.ts"></script></body></html>');
  await put('game/entry.ts', 'import asset from "tower-asset:test_tower@v01"; console.log(asset);');
  return { root, manifest, catalog, bytes, put,
    saveManifest: () => put(catalog.assets[0]!.manifest, JSON.stringify(manifest)),
    saveCatalog: () => put('assets/asset_catalog.json', JSON.stringify(catalog)),
  };
}

describe('runtime asset delivery', () => {
  it('projects only browser metadata and ignores unused drafts', async () => {
    const { root, bytes } = await fixture();
    const asset = await resolveRuntimeAsset(root, 'test_tower@v01');
    expect(asset.bytes).toEqual(bytes);
    expect(asset.metadata.clips).toEqual([{ name: 'idle', playback: 'loop', fps: 24 }]);
    expect(asset.metadata.contract.anchors).toEqual(['anchor_ui']);
    expect(JSON.stringify(asset.metadata)).not.toMatch(/private-|source|decisions|references|report|groundTolerance/);
  });

  it.each(['test_tower', 'test_tower@latest', '../test_tower@v01', 'missing@v01', 'test_tower@v02', 'unrelated_draft@v01'])('rejects unavailable or unpinned reference %s', async reference => {
    const { root } = await fixture();
    await expect(resolveRuntimeAsset(root, reference)).rejects.toThrow();
  });

  it('rejects duplicate registrations', async () => {
    const f = await fixture(); f.catalog.assets.push(f.catalog.assets[0]!); await f.saveCatalog();
    await expect(resolveRuntimeAsset(f.root, 'test_tower@v01')).rejects.toThrow('found 2');
  });

  it('rejects identity and canonical-path mismatches', async () => {
    const f = await fixture(); f.manifest.id = 'other'; await f.saveManifest();
    await expect(resolveRuntimeAsset(f.root, 'test_tower@v01')).rejects.toThrow('identity mismatch');
    f.manifest.id = 'test_tower'; f.manifest.runtime = '../private.glb'; await f.saveManifest();
    await expect(resolveRuntimeAsset(f.root, 'test_tower@v01')).rejects.toThrow('Noncanonical runtime');
    f.catalog.assets[0]!.manifest = '../private.json'; await f.saveCatalog();
    await expect(resolveRuntimeAsset(f.root, 'test_tower@v01')).rejects.toThrow('Noncanonical manifest');
  });

  it('rejects missing delivery, missing exports, changed bytes and invalid GLB headers', async () => {
    const f = await fixture();
    await f.put(f.catalog.assets[0]!.manifest, JSON.stringify({ ...f.manifest, delivery: undefined }));
    await expect(resolveRuntimeAsset(f.root, 'test_tower@v01')).rejects.toThrow();
    await f.saveManifest(); await rm(path.join(f.root, f.manifest.runtime));
    await expect(resolveRuntimeAsset(f.root, 'test_tower@v01')).rejects.toThrow();
    await f.put(f.manifest.runtime, Buffer.from('changed'));
    await expect(resolveRuntimeAsset(f.root, 'test_tower@v01')).rejects.toThrow('changed runtime');
    f.manifest.delivery.sha256 = createHash('sha256').update('changed').digest('hex'); await f.saveManifest();
    await expect(resolveRuntimeAsset(f.root, 'test_tower@v01')).rejects.toThrow('Invalid GLB header');
  });

  it.each(['/', '/TowerDefense/', './'])('builds selected assets with deployment base %s', async base => {
    const f = await fixture();
    const result = await build({ configFile: false, root: path.join(f.root, 'game'), base,
      publicDir: false, logLevel: 'silent', plugins: [runtimeAssets(f.root)], build: { write: false, minify: false } });
    if (Array.isArray(result) || !('output' in result)) throw new Error('Expected one build.');
    const glbs = result.output.filter(item => item.fileName.endsWith('.glb'));
    expect(glbs).toHaveLength(1);
    const glb = glbs[0]!;
    expect(glb.type === 'asset' && Buffer.from(glb.source)).toEqual(f.bytes);
    const code = result.output.filter(item => item.type === 'chunk').map(item => item.code).join('\n');
    expect(code).not.toMatch(/private-|blender\/|\.blend|unrelated_draft|authoring-hash/);
    expect(code).not.toMatch(/ROLLDOWN_FILE_URL/);
    if (base === './') {
      expect(code).toContain('import.meta.url');
      expect(code).toContain(glb.fileName.replace(/^assets\//, ''));
    } else expect(code).toContain(base + glb.fileName);
  });

  it('ships no models when the entry imports none', async () => {
    const f = await fixture(); await f.put('game/entry.ts', 'console.log("no renderer yet");');
    const result = await build({ configFile: false, root: path.join(f.root, 'game'), logLevel: 'silent',
      plugins: [runtimeAssets(f.root)], build: { write: false } });
    if (Array.isArray(result) || !('output' in result)) throw new Error('Expected one build.');
    expect(result.output.some(item => item.fileName.endsWith('.glb'))).toBe(false);
  });

  it.each(['/', '/TowerDefense/'])('serves imported bytes only, with dev base %s', async base => {
    const f = await fixture();
    const server = await createServer({ configFile: false, root: path.join(f.root, 'game'), base, publicDir: false,
      logLevel: 'silent', plugins: [runtimeAssets(f.root)], server: { host: '127.0.0.1', port: 0 } });
    try {
      await server.listen();
      const address = server.httpServer!.address();
      if (!address || typeof address === 'string') throw new Error('Expected HTTP listener.');
      const origin = `http://127.0.0.1:${address.port}`;
      const asset = await resolveRuntimeAsset(f.root, 'test_tower@v01');
      const url = `${base}@tower-assets/${asset.fileName}`;
      expect((await fetch(origin + url)).status).toBe(404);
      const module = await server.transformRequest('\0tower-asset:test_tower@v01');
      expect(module!.code).toContain(url);
      const response = await fetch(origin + url);
      expect(response.headers.get('content-type')).toBe('model/gltf-binary');
      expect(Buffer.from(await response.arrayBuffer())).toEqual(f.bytes);
      expect((await fetch(origin + url, { method: 'HEAD' })).status).toBe(200);
      expect((await fetch(origin + url, { method: 'POST' })).status).toBe(405);
      expect((await fetch(origin + `${base}@tower-assets/unregistered.glb`)).status).toBe(404);
    } finally { await server.close(); }
  });

  it('resolves the actual delivered Copilot without shipping it in the diagnostic app', async () => {
    const root = fileURLToPath(new URL('../../..', import.meta.url));
    const asset = await resolveRuntimeAsset(root, 'copilot_base@v02');
    expect(asset.metadata.clips.some(clip => clip.name === 'idle')).toBe(true);
    expect(asset.bytes).toEqual(await readFile(path.join(root, 'assets/runtime/towers/copilot_base_v02.glb')));
  });
});

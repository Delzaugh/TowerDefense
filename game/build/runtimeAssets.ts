import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { Plugin, ResolvedConfig } from 'vite';
import type { RuntimeAsset } from '../src/rendering/runtimeAsset.ts';

const prefix = 'tower-asset:';
const category = z.enum(['towers', 'work', 'enemies', 'product', 'environment']);
const identity = { id: z.string().regex(/^[a-z][a-z0-9_]*$/), version: z.string().regex(/^v\d{2}$/) };
const catalogSchema = z.object({ schemaVersion: z.literal(1), assets: z.array(z.object({ ...identity, manifest: z.string() })) });
// z.object deliberately strips authoring-only keys instead of publishing the manifest.
const manifestSchema = z.object({
  schemaVersion: z.literal(1), ...identity, category, revision: z.number().int().positive(), runtime: z.string(),
  contract: z.object({
    root: z.string().min(1), up: z.literal('+Y'), forward: z.literal('+Z'),
    metres: z.literal(true), rootMotion: z.literal(false), anchors: z.array(z.string().min(1)),
  }),
  clips: z.array(z.object({ name: z.string().min(1), playback: z.enum(['loop', 'once']), fps: z.number().positive() })),
  delivery: z.object({ sha256: z.string().regex(/^[a-f0-9]{64}$/) }),
});

async function containedFile(root: string, relative: string) {
  const canonicalRoot = await realpath(root);
  const file = await realpath(path.resolve(root, relative));
  const location = path.relative(canonicalRoot, file);
  if (location === '..' || location.startsWith(`..${path.sep}`) || path.isAbsolute(location)) {
    throw new Error(`Runtime asset path escapes the repository: ${relative}`);
  }
  return file;
}

/** Resolve only the requested identity; unrelated undelivered drafts are allowed. */
export async function resolveRuntimeAsset(repositoryRoot: string, reference: string) {
  const match = /^([a-z][a-z0-9_]*)@(v\d{2})$/.exec(reference);
  if (!match) throw new Error(`Use an explicit asset version: ${prefix}copilot_base@v02 (received ${reference}).`);
  const [, id, version] = match;
  const catalogPath = await containedFile(repositoryRoot, 'assets/asset_catalog.json');
  const catalog = catalogSchema.parse(JSON.parse(await readFile(catalogPath, 'utf8')));
  const entries = catalog.assets.filter(entry => entry.id === id && entry.version === version);
  if (entries.length !== 1) throw new Error(`Expected one registered asset for ${reference}; found ${entries.length}.`);
  const entry = entries[0]!;
  const manifestPattern = new RegExp(`^blender/(towers|work|enemies|product|environment)/${id}/${version}/asset\\.json$`);
  if (!manifestPattern.test(entry.manifest)) throw new Error(`Noncanonical manifest for ${reference}.`);
  const manifestPath = await containedFile(repositoryRoot, entry.manifest);
  const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
  if (manifest.id !== id || manifest.version !== version || entry.manifest !== `blender/${manifest.category}/${id}/${version}/asset.json`) {
    throw new Error(`Catalog/manifest identity mismatch for ${reference}.`);
  }
  const runtime = `assets/runtime/${manifest.category}/${id}_${version}.glb`;
  if (manifest.runtime !== runtime) throw new Error(`Noncanonical runtime for ${reference}.`);
  const runtimePath = await containedFile(repositoryRoot, runtime);
  const bytes = await readFile(runtimePath);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== manifest.delivery.sha256) throw new Error(`Undelivered or changed runtime for ${reference}; use the guarded asset pipeline.`);
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) {
    throw new Error(`Invalid GLB header for ${reference}.`);
  }
  const metadata: Omit<RuntimeAsset, 'url'> = {
    id: manifest.id, version: manifest.version, revision: manifest.revision, category: manifest.category,
    sha256, bytes: bytes.length, contract: manifest.contract, clips: manifest.clips,
  };
  return { metadata, bytes, files: [catalogPath, manifestPath, runtimePath],
    fileName: `assets/runtime/${manifest.category}/${id}_${version}.${sha256.slice(0, 16)}.glb` };
}

/** Import-driven allowlist: no app import means no GLB in the app build. */
export function runtimeAssets(repositoryRoot: string): Plugin {
  let config: ResolvedConfig;
  const served = new Map<string, Buffer>();
  const watched = new Set<string>();
  return {
    name: 'tower-runtime-assets',
    enforce: 'pre',
    configResolved(value) { config = value; },
    buildStart() { served.clear(); watched.clear(); },
    resolveId(source) {
      if (source.startsWith(prefix)) return `\0${source}`;
    },
    async load(id) {
      if (!id.startsWith(`\0${prefix}`)) return;
      const asset = await resolveRuntimeAsset(repositoryRoot, id.slice(prefix.length + 1));
      for (const file of asset.files) { this.addWatchFile(file); watched.add(file.replaceAll('\\', '/')); }
      let url: string;
      if (config.command === 'build') {
        const reference = this.emitFile({ type: 'asset', fileName: asset.fileName, source: asset.bytes });
        // Vite 8 resolves this through its asset hook for root, relative and subpath bases.
        url = `import.meta.ROLLDOWN_FILE_URL_${reference}`;
      } else {
        const pathname = `${config.base === './' ? '/' : config.base}@tower-assets/${asset.fileName}`;
        served.set(pathname, asset.bytes);
        url = JSON.stringify(pathname);
      }
      return `export default { ...${JSON.stringify(asset.metadata)}, url: ${url} };`;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = request.url?.split('?')[0] ?? '';
        if (!pathname.startsWith(`${config.base === './' ? '/' : config.base}@tower-assets/`)) return next();
        const bytes = served.get(pathname);
        if (!bytes) { response.statusCode = 404; response.end('Asset has not been imported.'); return; }
        if (request.method !== 'GET' && request.method !== 'HEAD') { response.statusCode = 405; response.end(); return; }
        response.setHeader('Content-Type', 'model/gltf-binary');
        response.setHeader('Content-Length', bytes.length);
        response.setHeader('Cache-Control', 'no-cache');
        response.end(request.method === 'HEAD' ? undefined : bytes);
      });
    },
    handleHotUpdate(context) {
      if (!watched.has(context.file.replaceAll('\\', '/'))) return;
      served.clear();
      for (const module of context.server.moduleGraph.idToModuleMap.values()) {
        if (module.id?.startsWith(`\0${prefix}`)) context.server.moduleGraph.invalidateModule(module);
      }
      context.server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}

import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const vocabulary = { idle:'loop', move:'loop', work:'loop', active:'loop', spawn:'once', place:'once', hit:'once', resolve:'once', complete:'once', heal:'once', defeat:'once' };
export const hash = data => createHash('sha256').update(data).digest('hex');
export const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
export function resolvePath(relative, root = projectRoot) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') || path.isAbsolute(relative) || /^[a-z]:/i.test(relative)) throw Error('Expected a project-relative forward-slash path');
  const result = path.resolve(root, relative);
  if (!result.startsWith(path.resolve(root) + path.sep)) throw Error('Path escapes project: ' + relative);
  return result;
}
export async function existingPath(relative) {
  const result = await realpath(resolvePath(relative));
  const root = await realpath(projectRoot);
  if (!result.startsWith(root + path.sep)) throw Error('Linked path escapes project: ' + relative);
  return result;
}
export function validateManifest(m) {
  const errors = [], check = (ok, message) => { if (!ok) errors.push(message); };
  check(m.schemaVersion === 1, 'schemaVersion must be 1');
  check(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(m.id || ''), 'id must be lowercase snake_case');
  check(/^v\d{2,}$/.test(m.version || ''), 'version must be v01, v02, …');
  check(Number.isInteger(m.revision) && m.revision >= 1, 'revision must be positive');
  check(typeof m.displayName === 'string' && !!m.displayName.trim(), 'displayName required');
  check(['enemies','towers','work','product','environment'].includes(m.category), 'Unknown category');
  check(['manual','procedural','hybrid'].includes(m.source?.mode), 'source.mode required');
  for (const p of [m.source?.path, m.runtime, ...(m.source?.recipe ? [m.source.recipe] : [])]) {
    try { resolvePath(p); } catch (e) { errors.push(e.message); }
  }
  check(m.source?.path?.startsWith('blender/') && m.source.path.endsWith('.blend'), 'source must be a Blender file under blender/');
  check(m.runtime?.startsWith('assets/runtime/') && m.runtime.endsWith('.glb'), 'runtime must be a GLB under assets/runtime/');
  const folder=`blender/${m.category}/${m.id}/${m.version}`,base=`${m.id}_${m.version}`;
  check(m.source?.path===`${folder}/${base}.blend`, 'Source path must match category, asset ID and version');
  check(m.runtime===`assets/runtime/${m.category}/${base}.glb`, 'Runtime path must match category, asset ID and version');
  check(!m.source?.recipe || m.source.recipe===`${folder}/build.py`, 'Procedural recipe belongs beside its manifest as build.py');
  check(!m.decisions || m.decisions===`${folder}/decisions.md`, 'Decision record belongs beside its manifest');
  for(const snapshot of m.milestones||[])for(const key of ['source','export'])check(typeof snapshot[key]==='string' && snapshot[key].startsWith(folder+'/revisions/') && !snapshot[key].split('/').includes('..'), 'Snapshot '+key+' must remain in this asset version’s revisions folder');
  for (const name of ['triangles','materials','textures','bones','meshes','textureSize']) check(Number.isInteger(m.budgets?.[name]) && m.budgets[name] >= 0, 'Missing/non-integer budget: ' + name);
  check(m.contract?.root === 'root' && m.contract?.up === '+Y' && m.contract?.forward === '+Z' && m.contract?.metres === true, 'Contract must declare root, +Y up, +Z forward and metres');
  check(typeof m.contract?.grounded === 'boolean' && m.contract?.rootMotion === false, 'Declare grounding and disable root motion');
  check(Number.isFinite(m.contract?.groundTolerance) && m.contract.groundTolerance >= 0, 'groundTolerance required');
  check(Array.isArray(m.contract?.anchors) && m.contract.anchors.every(n => /^anchor_[a-z_]+$/.test(n)), 'Anchor list required');
  check(Array.isArray(m.clips), 'clips must be an explicit list (empty for static assets)');
  const names = new Set();
  for (const c of m.clips || []) {
    check(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(c.name || '') && !names.has(c.name), 'Invalid/duplicate clip: ' + c.name); names.add(c.name);
    check(['loop','once'].includes(c.playback), 'Invalid playback: ' + c.name);
    check(!vocabulary[c.name] || vocabulary[c.name] === c.playback, 'Shared clip playback mismatch: ' + c.name);
    check(typeof c.meaning === 'string' && c.meaning.length > 0, 'Clip meaning required: ' + c.name);
    check([24,30].includes(c.fps), 'Author at 24 or 30 fps: ' + c.name);
  }
  if (m.contract?.dimensions) for (const key of ['min','max']) check(Array.isArray(m.contract.dimensions[key]) && m.contract.dimensions[key].length === 3 && m.contract.dimensions[key].every(v => Number.isFinite(v) && v >= 0), 'dimensions.' + key + ' must contain W,H,D');
  check(Array.isArray(m.references) && Array.isArray(m.overrides), 'references and overrides must be explicit lists');
  if(m.palette)check(m.palette.colors && Object.values(m.palette.colors).every(v=>/^#[a-f0-9]{6}$/i.test(v)), 'Palette colors must be explicit sRGB hex values');
  if(m.palette?.storage!==undefined)check(['vertex','texture'].includes(m.palette.storage),'Unknown palette storage');
  if(m.palette?.storage==='texture')check(Array.isArray(m.texturePalettes)&&m.texturePalettes.length>0,'Texture palette storage requires texturePalettes bindings');
  if(m.texturePalettes!==undefined){
    check(Array.isArray(m.texturePalettes),'texturePalettes must be an array');
    const named=new Set();
    for(const p of Array.isArray(m.texturePalettes)?m.texturePalettes:[]){
      if(!p||typeof p!=='object'){check(false,'Texture palette must be an object');continue;}
      check(typeof p.material==='string'&&p.material.length>0&&!named.has(p.material),'Texture palette materials must be named and unique');named.add(p.material);
      const size=Array.isArray(p.size)&&p.size.length===2&&p.size.every(v=>Number.isInteger(v)&&v>0&&v<=m.budgets.textureSize);
      check(size,'Texture palette size must fit textureSize budget');
      check(p.roles&&typeof p.roles==='object'&&!Array.isArray(p.roles)&&Object.keys(p.roles).length>0,'Texture palette requires named roles');
      const rectangles=[];
      for(const [name,role] of Object.entries(p.roles||{})){
        check(/^[a-z][a-z0-9_]*$/.test(name),'Invalid texture palette role: '+name);
        check(/^#[a-f0-9]{6}$/i.test(role?.color),'Texture palette role needs an sRGB hex color: '+name);
        const r=role?.rect,valid=Array.isArray(r)&&r.length===4&&r.every(Number.isInteger)&&r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0&&size&&r[0]+r[2]<=p.size[0]&&r[1]+r[3]<=p.size[1];
        check(valid,'Texture palette rectangle outside image: '+name);
        if(valid){check(!rectangles.some(q=>r[0]<q[0]+q[2]&&r[0]+r[2]>q[0]&&r[1]<q[1]+q[3]&&r[1]+r[3]>q[1]),'Texture palette roles overlap: '+name);rectangles.push(r);}
      }
    }
  }
  if (errors.length) throw Error('Invalid asset manifest:\n' + errors.join('\n'));
  return m;
}
export async function catalog() {
  const c = await readJson(resolvePath('assets/asset_catalog.json'));
  const seen = new Set();
  return Promise.all(c.assets.map(async item => {
    const key = item.id + '@' + item.version;
    if (seen.has(key)) throw Error('Duplicate catalog identity: ' + key); seen.add(key);
    const manifest = validateManifest(await readJson(await existingPath(item.manifest)));
    if (manifest.id !== item.id || manifest.version !== item.version) throw Error('Catalog identity mismatch: ' + key);
    if(item.manifest!==`blender/${manifest.category}/${manifest.id}/${manifest.version}/asset.json`)throw Error('Manifest location does not match asset identity: '+key);
    return { ...item, data: manifest };
  }));
}
export async function findAsset(id, version = 'v01') {
  const item = (await catalog()).find(a => a.id === id && a.version === version);
  if (!item) throw Error('Unknown asset: ' + id + '@' + version);
  return item;
}

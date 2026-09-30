// Read-only baseline inventory. Coverage is not artistic approval or consent.
import {readFile} from 'node:fs/promises';
import {catalog, resolvePath, hash} from './contracts.mjs';
import {checkContainer} from './validate.mjs';

const baseline = ['idle','work','move','place','hit','resolve'];
const assets = [];
for (const item of await catalog()) {
  const m = item.data;
  if (!['towers','enemies'].includes(m.category)) continue;
  const declared = m.clips.map(c=>c.name);
  let exported = [], sha256 = null, error = null;
  try {
    const bytes = await readFile(resolvePath(m.runtime));
    const g = checkContainer(bytes);
    exported = (g.animations || []).map(c=>c.name);
    sha256 = hash(bytes);
  } catch (e) { error = e.message; }
  const arrivalClip = m.category==='enemies' && declared.includes('spawn') ? 'spawn' : 'place';
  const missing = baseline.filter(n=>{
    const required=n==='place'?arrivalClip:n;
    return !declared.includes(required) || !exported.includes(required);
  });
  assets.push({id:m.id, version:m.version, category:m.category, revision:m.revision,
    sha256, declared, exported, arrivalClip, missing, error,
    coverage:!error && !missing.length ? 'complete' : 'pending'});
}
console.log(JSON.stringify({checkedAt:new Date().toISOString(), baseline,
  restPose:'Unanimated model/bind state; not a clip. Must be visually reviewed.',
  arrival:'Enemies may fulfill the Place/arrival slot with spawn; no duplicate aliases are required.',
  meaning:'Read-only name coverage. Does not prove moving channels, visual quality, user acceptance or authorization to animate the backlog.',
  summary:{assets:assets.length, complete:assets.filter(a=>a.coverage==='complete').length,
    pending:assets.filter(a=>a.coverage==='pending').length}, assets},null,2));

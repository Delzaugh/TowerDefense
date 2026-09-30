// Read-only review of registered runtime assets. No Blender/GLB writes.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { createInspectorServer } from './server.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve('game/node_modules/playwright'));
const out = path.resolve('docs/design/reviews/palette-2026-09-26');
await fs.mkdir(out, { recursive: true });
const policy = JSON.parse(await fs.readFile('docs/design/Shared_Palette.json'));
const server = createInspectorServer();
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const groups = [
  ['Copilot family', ['copilot_developer', 'copilot_linter', 'copilot_security', 'copilot_base']],
  ['Problems', ['problem_bug', 'problem_lag_spike', 'problem_vague_spec', 'problem_missing_details', 'problem_dead_code', 'problem_spaghetti_code']],
  ['Work and character towers', ['work_coding_task', 'copilot_human_developer', 'copilot_golden_compiler', 'copilot_commit_halo', 'copilot_bert_breugelmans']],
  ['Campus references', ['campus_lab', 'campus_tree_round', 'campus_walk_straight', 'campus_coffee_kiosk', 'campus_utility_decor', 'kaykit_basemodule_a']]
];
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${origin}/?asset=problem_bug&version=v01`);
  await page.waitForFunction(() => window.inspectorState?.().entries.length === 1 && !window.inspectorState().loading);
  // Use the registered catalog, shared loader, tone mapping and palette editor.
  const inventory = await page.evaluate(async () => await (await fetch('/api/models')).json());
  const beforeChanges = {};
  const problemsBaseline = JSON.parse(await fs.readFile('docs/design/reviews/problems-palette-2026-09-27/baseline.json'));
  for (const model of problemsBaseline) beforeChanges[model.contract.id] = Object.fromEntries(Object.entries(model.contract.texturePalettes[0].roles).map(([role, swatch]) => [role, swatch.color]));
  const beforeEmission = Object.fromEntries(Object.entries(policy.materialRefinements ?? {}).map(([id, spec]) => [id, spec.beforeEmission]));
  for (const [id, roles] of Object.entries(policy.pilot)) {
    const model = inventory.find(m => m.contract.id === id);
    const milestone = model.contract.milestones?.find(m => m.label === 'before_shared_palette');
    if (!milestone) throw Error('Missing before-palette milestone: ' + id);
    const before = JSON.parse(await fs.readFile(path.join(path.dirname(milestone.source), 'asset.json')));
    beforeChanges[id] = Object.fromEntries(Object.keys(roles).map(role => [role, before.texturePalettes[0].roles[role].color]));
  }
  const audit = [];
  for (const m of inventory) {
    const c = m.contract;
    const bytes = await fs.readFile(c.runtime);
    const jsonLength = bytes.readUInt32LE(12);
    const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
    audit.push({ id: c.id, version: c.version, category: c.category, revision: c.revision,
      source: c.source.path, sourceHash: crypto.createHash('sha256').update(await fs.readFile(c.source.path)).digest('hex'),
      runtime: c.runtime, sha256: m.sha256,
      roles: c.texturePalettes ?? [], materials: gltf.materials, images: gltf.images?.length ?? 0 });
  }
  await fs.writeFile(path.join(out, 'inventory.json'), JSON.stringify({ at: new Date().toISOString(), count: audit.length, assets: audit }, null, 2));
  await page.evaluate(async () => {
    const THREE = await import('/vendor/three.module.js');
    const { GLTFLoader } = await import('/vendor/GLTFLoader.js');
    const review = await import('/review.js');
    window.rosterRender = async ({ models, changes, emissionChanges = {}, span = 6, width = 360, height = 300, background = '#354B64', front = false, placements = null }) => {
      const scene = new THREE.Scene(); scene.background = new THREE.Color(background);
      scene.add(new THREE.HemisphereLight(0xd5edff, 0x23323c, 2.5));
      const key = new THREE.DirectionalLight(0xffffff, 3.5); key.position.set(5, 8, 4); scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 1.25); fill.position.set(-5, 3, -4); scene.add(fill);
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(width, height); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
      const palettes = [], loaded = [];
      for (const [i, model] of models.entries()) {
        const gltf = await new GLTFLoader().loadAsync('/runtime/' + model.path);
        const root = gltf.scene;
        if (emissionChanges[model.contract.id]) root.traverse(o => {
          if (o.isMesh) for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            m.emissive.setRGB(...emissionChanges[model.contract.id]); m.emissiveIntensity = 1;
          }
        });
        for (const p of review.inspectTexturePalettes(THREE, root, model.contract.texturePalettes ?? [])) {
          for (const [role, color] of Object.entries(changes?.[model.contract.id] ?? {})) review.setTexturePaletteColor(THREE, p, role, color);
          palettes.push(p);
        }
        // Translations only. Never scale or deform the authored model.
        const b = new THREE.Box3().setFromObject(root), center = b.getCenter(new THREE.Vector3());
        root.position.x += (placements?.[i]?.[0] ?? (i - (models.length - 1) / 2) * 3.6) - center.x;
        root.position.z += (placements?.[i]?.[1] ?? 0) - center.z;
        scene.add(root); loaded.push(root);
      }
      const camera = new THREE.OrthographicCamera(-span * width / height / 2, span * width / height / 2, span / 2, -span / 2, .01, 1000);
      const aim = new THREE.Vector3(0, placements ? 3 : models.length > 1 ? 1.1 : span * .23, placements ? -2 : 0);
      camera.position.copy(aim).add(front ? new THREE.Vector3(0, 0, 30) : placements ? new THREE.Vector3(8, 18, 28) : new THREE.Vector3(14, 12, 22)); camera.lookAt(aim);
      renderer.render(scene, camera);
      const image = renderer.domElement.toDataURL('image/png');
      for (const p of palettes) review.resetTexturePalette(p);
      scene.traverse(o => { o.geometry?.dispose(); if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) { m.map?.dispose(); m.dispose(); } });
      renderer.dispose(); renderer.forceContextLoss();
      return image;
    };
  });
  const images = {};
  const resolve = id => inventory.filter(m => m.contract.id === id).sort((a, b) => b.contract.version.localeCompare(a.contract.version))[0];
  for (const [group, ids] of groups) for (const id of ids) {
    const model = resolve(id); if (!model) throw Error('Missing registered model: ' + id);
    const span = group === 'Campus references' ? (id === 'campus_utility_decor' ? 30 : 16) : 6;
    for (const mode of ['current', 'candidate']) {
      const data = await page.evaluate(opts => window.rosterRender(opts), { models: [model], changes: mode === 'current' ? beforeChanges : {}, emissionChanges: mode === 'current' ? beforeEmission : {}, span });
      const name = `${id}-${mode}.png`; images[name] = data;
      await fs.writeFile(path.join(out, name), Buffer.from(data.split(',')[1], 'base64'));
    }
  }
  const sceneModels = ['copilot_developer', 'copilot_linter', 'copilot_security', 'problem_bug', 'work_coding_task'].map(resolve);
  for (const background of ['slate', 'light']) for (const mode of ['current', 'candidate']) {
    const data = await page.evaluate(opts => window.rosterRender(opts), { models: sceneModels, changes: mode === 'current' ? beforeChanges : {}, emissionChanges: mode === 'current' ? beforeEmission : {}, width: 1200, height: 360, span: 7, background: background === 'slate' ? '#354B64' : '#D2E1E5', front: true });
    const name = `lineup-${background}-${mode}.png`; images[name] = data;
    await fs.writeFile(path.join(out, name), Buffer.from(data.split(',')[1], 'base64'));
  }
  for (const mode of ['current','candidate']) {
    const models = ['campus_lab','campus_tree_round','campus_tree_round','copilot_developer','copilot_linter','copilot_security','problem_bug','work_coding_task'].map(resolve);
    const data = await page.evaluate(opts => window.rosterRender(opts), {models, changes:mode === 'current' ? beforeChanges : {}, emissionChanges:mode === 'current' ? beforeEmission : {}, placements:[[0,-10],[-8,-6],[8,-6],[-7.2,3],[-3.6,3],[0,3],[3.6,3],[7.2,3]],width:1200,height:550,span:21});
    const name = `lineup-campus-${mode}.png`;images[name]=data;
    await fs.writeFile(path.join(out,name),Buffer.from(data.split(',')[1],'base64'));
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const thumb = (id, alt) => `<img class="asset-image" data-id="${id}" src="${images[id + '-current.png']}" alt="${esc(alt)}" width="360" height="300">`;
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tower · Colour consistency</title>
  <style>*{box-sizing:border-box}body{margin:0;background:#101d29;color:#e2edf0;font:16px/1.5 system-ui}main{max-width:1280px;margin:auto;padding:32px}h1{font-size:38px;line-height:1.1}h2{margin-top:42px}p{max-width:880px;color:#b5c8d5}.eyebrow{color:#82dadd;letter-spacing:.13em;font-size:12px;text-transform:uppercase}nav{position:sticky;top:0;z-index:2;background:#101d29ef;padding:12px 0;display:flex;gap:12px;flex-wrap:wrap}button,select{background:#25384f;color:#fff;border:1px solid #65859d;border-radius:8px;padding:10px 16px;font:inherit;cursor:pointer}button[aria-pressed=true]{background:#82dadd;color:#101d29}section.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}article{background:#1b2c3c;border:1px solid #354b64;border-radius:12px;overflow:hidden}article h3,article p,article .swatches{margin:12px 18px}.asset-image{display:block;width:100%;height:auto;background:#354b64}small{color:#adc5d2}.swatches{display:flex;gap:5px;flex-wrap:wrap}.swatches span{width:19px;height:19px;border:1px solid #ffffff44;border-radius:4px}.tokens{display:flex;gap:12px;flex-wrap:wrap}.token{padding:12px;background:#1b2c3c;border-radius:10px;min-width:145px}.token i{display:block;height:38px;border-radius:5px;margin-bottom:8px}code{font-size:13px}.wide{width:100%;height:auto;border-radius:12px}.gray .asset-image,.gray .wide{filter:grayscale(1)}.note{border-left:3px solid #82dadd;padding-left:16px}a{color:#82dadd}@media(max-width:600px){main{padding:20px}h1{font-size:30px}section.grid{grid-template-columns:1fr 1fr;gap:8px}article h3,article p,article .swatches{margin:8px;font-size:12px}.swatches span{width:12px;height:12px}.lineup{overflow-x:auto}.lineup .wide{width:900px;max-width:none}}</style>
  <main><div class="eyebrow">Tower / Art direction / 26 September 2026</div><h1>One world. Distinct characters.</h1><p>Working palette review using the actual registered GLBs. Keep character identities; unify supporting neutrals and small accents. The candidate changes five swatches across three Copilot towers. Character shells, Security navy, campus colours and separate emission maps are preserved.</p>
  <nav><button id="current" aria-pressed="true">Current exports</button><button id="candidate" aria-pressed="false">Shared-neutral candidate</button><button id="gray" aria-pressed="false">Grayscale check</button></nav>
  <p class="note" id="state">Current exports. Candidate colours are temporary review previews, not delivered asset revisions.</p>
  <h2>Shared references</h2><div class="tokens">${Object.entries(policy.tokens).map(([n,t])=>`<div class="token" title="${esc(t.use)}"><i style="background:${t.color}"></i>${esc(n.replaceAll('_',' '))}<br><code>${t.color}</code></div>`).join('')}</div>
  <h2>Same scale, same light</h2><p>Developer · Linter · Security · Bug · Coding Task. Authored metre scale, orthographic front view. Light and slate grounds expose dark-contour differences. This is a review fixture, not the final gameplay camera. On phones, scroll this row to preserve viewing size.</p><div class="lineup">${thumb('lineup-slate','Five characters at authored scale on slate')}${thumb('lineup-light','Five characters at authored scale on a light ground')}</div>
  ${groups.map(([group,ids])=>`<h2>${group}</h2><p>${group==='Campus references'?'16 m vertical frame for larger scenery.':'6 m vertical frame shared by every character, without individual fitting.'} Rest pose, shared Inspector studio lighting. Swatches below show exported base colours.</p><section class="grid">${ids.map(id=>{const m=resolve(id),roles=Object.assign({},...(m.contract.texturePalettes??[]).map(p=>p.roles));return `<article>${thumb(id,m.contract.displayName??id)}<h3>${esc(m.contract.displayName??id)}</h3><p><small>${m.contract.version} · r${m.contract.revision}${policy.pilot[id]?' · pilot candidate':''}</small></p><div class="swatches">${Object.entries(roles).filter(([r,v],i,all)=>all.findIndex(([,w])=>w.color===v.color)===i).map(([r,v])=>`<span title="${esc(r+' '+v.color)}" style="background:${v.color}"></span>`).join('')}</div></article>`;}).join('')}</section>`).join('')}
  <h2>Review findings</h2><p><b>Keep:</b> muted campus scenery and vivid character focal colours. Warm and cool whites serve different materials. Avoid treating every role called “shell” or “ink” as the same colour.</p><p><b>Align:</b> Developer graphite to Linter’s #333E48. Linter and Security screens to Developer’s #041D2A; their cyan marks to #00E5EF. Preserve Security’s navy casing and the three lens treatments.</p><p><b>Watch:</b> Lag Spike uses cyan, Spaghetti uses lime/orange, and Security shares blue with Bug. Colour alone cannot label allegiance. Grayscale is a luminance check, not a colour-vision-deficiency certification.</p><p>Catalog audit: ${audit.length} registered versions. This visual sample contains ${groups.reduce((n,g)=>n+g[1].length,0)} representative assets; legacy variants and every imported module are inventoried, not individually visually approved. No Product asset is registered. Rest-pose review excludes lifecycle effects.</p>
  </main><script>const images=${JSON.stringify(images)};let mode='candidate';function show(){document.querySelectorAll('.asset-image').forEach(i=>{i.src=images[i.dataset.id+'-'+mode+'.png'];if(i.dataset.id.startsWith('lineup'))i.classList.add('wide')});for(const id of ['current','candidate'])document.getElementById(id).setAttribute('aria-pressed',String(id===mode));document.getElementById('state').textContent=mode==='current'?'Current exports. Candidate colours are temporary review previews, not delivered asset revisions.':'Shared-neutral candidate. Five swatches change; the adjustment is deliberately subtle. Saved Blender and GLB files are unchanged by this board.'}for(const id of ['current','candidate'])document.getElementById(id).onclick=()=>{mode=id;show()};document.getElementById('gray').onclick=e=>{document.body.classList.toggle('gray');e.target.setAttribute('aria-pressed',String(document.body.classList.contains('gray')))};show();</script></html>`;
  const contextSection = `<h2>Characters with campus scenery</h2><p>The same five characters with the registered lab and two trees. Every model remains at authored metre scale; only placement changes. This is a controlled isometric scene for colour hierarchy, not a gameplay layout.</p><div class="lineup">${thumb('lineup-campus','Characters and campus architecture together at authored metre scale')}</div>`;
  const finalHtml = html.replace('<h2>Copilot family</h2>',contextSection+'<h2>Copilot family</h2>')
    .replaceAll('Shared-neutral candidate', 'Refined exports')
    .replaceAll('Current exports', 'Before refinement')
    .replaceAll('The candidate changes five swatches across three Copilot towers.', 'Five swatches were refined across three Copilot towers. Bug’s uniform white emission was removed in the follow-up; its cobalt/red swatches are unchanged. Problems now share 22 family colours, with at most eight per enemy. Geometry and animations are preserved.')
    .replaceAll('Candidate colours are temporary review previews, not delivered asset revisions.', 'Before view restores original swatches and Bug’s former emission on identical current geometry. Refined view shows the delivered GLBs.')
    .replaceAll('Refined exports. Five swatches change; the adjustment is deliberately subtle. Saved Blender and GLB files are unchanged by this board.', 'Refined exports. Tower swatches changed subtly; Bug now has clearer colour and shading without uniform self-emission. This board is read-only.')
    .replaceAll('16 m vertical frame for larger scenery.', '16 m vertical frame for scenery; the larger Utility Yard uses 30 m to avoid clipping.')
    .replaceAll('pilot candidate', 'refined pilot');
  await fs.writeFile(path.join(out, 'index.html'), finalHtml);
  await fs.writeFile(path.join(out, 'render-report.json'), JSON.stringify({ date:new Date().toISOString(), errors, inventoryCount:audit.length, visualSample:groups, policy, lighting:'Shared Inspector studio', effects:'off', scale:'Authored metres; no model scaling', images:Object.keys(images) },null,2));
  if(errors.length)throw Error(errors.join('\n'));
  console.log(JSON.stringify({ board:path.join(out,'index.html'), count:audit.length, images:Object.keys(images).length }));
} finally { await browser.close(); await new Promise(r => server.close(r)); }

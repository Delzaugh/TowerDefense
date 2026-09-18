import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { installReview, createPresentationEffect } from './review.js';
import { installBambuExport } from './export-bambu.js';

const $ = id => document.getElementById(id);
const canvas = $('viewport');
const library = $('library'), libraryResizer = $('library-resizer');
const libraryStorageKey = 'tower-asset-inspector.library-width';
const libraryMinWidth = 220, libraryMaxWidth = 640, libraryMainMinWidth = 420;
let preferredLibraryWidth = null, libraryResizePointer = null;
function libraryWidthLimit() {
  return Math.max(libraryMinWidth, Math.min(libraryMaxWidth, Math.floor(innerWidth * .55), innerWidth - libraryMainMinWidth));
}
function setLibraryWidth(width, persist = false) {
  preferredLibraryWidth = Math.round(Math.max(libraryMinWidth, Math.min(libraryWidthLimit(), width)));
  document.body.style.setProperty('--library-width', preferredLibraryWidth + 'px');
  libraryResizer.setAttribute('aria-valuemax', String(libraryWidthLimit()));
  libraryResizer.setAttribute('aria-valuenow', String(preferredLibraryWidth));
  if (persist) try { localStorage.setItem(libraryStorageKey, String(preferredLibraryWidth)); } catch {}
}
function resetLibraryWidth() {
  preferredLibraryWidth = null;
  document.body.style.removeProperty('--library-width');
  try { localStorage.removeItem(libraryStorageKey); } catch {}
  requestAnimationFrame(syncLibraryResizer);
}
function syncLibraryResizer() {
  if (preferredLibraryWidth !== null && innerWidth > 700) setLibraryWidth(preferredLibraryWidth);
  else {
    libraryResizer.setAttribute('aria-valuemax', String(libraryWidthLimit()));
    libraryResizer.setAttribute('aria-valuenow', String(Math.round(library.getBoundingClientRect().width)));
  }
}
try {
  const storedLibraryWidth = Number(localStorage.getItem(libraryStorageKey));
  if (Number.isFinite(storedLibraryWidth) && storedLibraryWidth >= libraryMinWidth) setLibraryWidth(storedLibraryWidth);
} catch {}
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#172631');
scene.add(new THREE.HemisphereLight(0xd5edff, 0x23323c, 2.5));
const key = new THREE.DirectionalLight(0xfff1dd, 3.5); key.position.set(5, 8, 4); scene.add(key);
const fill = new THREE.DirectionalLight(0x75c7ff, 1.25); fill.position.set(-5, 3, -4); scene.add(fill);
const grid = new THREE.GridHelper(20, 20, 0x4a8590, 0x31515a); scene.add(grid);
const perspective = new THREE.PerspectiveCamera(45, 1, .001, 1000);
const orthographic = new THREE.OrthographicCamera(-2, 2, 2, -2, .001, 1000);
let camera = orthographic, aspect = 1;
const target = new THREE.Vector3(0, 1, 0);
let azimuth = .65, polar = 1.03, distance = 8, currentView = 'iso', framed = false;
let models = [], entries = [], desiredPaths = [], activePath = '', generation = 0, loading = false, wireframe = false;
const openFolders = new Set(['enemies', 'towers']);
const loader = new GLTFLoader();
const tanFov = Math.tan(THREE.MathUtils.degToRad(45 / 2));
const viewAngles = { iso: [.65, 1.03], front: [0, Math.PI / 2], rear: [Math.PI, Math.PI / 2], left: [-Math.PI / 2, Math.PI / 2], right: [Math.PI / 2, Math.PI / 2], top: [0, .0001], bottom: [0, Math.PI - .0001] };

function activeEntry() { return entries.find(e => e.model.path === activePath); }
function currentClip(e) { return e?.clips[e.state.clipIndex]; }
function updateCamera() {
  const half = distance * tanFov;
  orthographic.left = -half * aspect; orthographic.right = half * aspect;
  orthographic.top = half; orthographic.bottom = -half;
  perspective.aspect = aspect;
  for (const c of [orthographic, perspective]) {
    c.near = Math.max(.0001, distance / 1000); c.far = Math.max(1000, distance * 100);
    c.position.set(target.x + distance * Math.sin(polar) * Math.sin(azimuth), target.y + distance * Math.cos(polar), target.z + distance * Math.sin(polar) * Math.cos(azimuth));
    c.lookAt(target); c.updateProjectionMatrix(); c.updateMatrixWorld();
  }
}
function setSize() {
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const next = width / height;
  if (framed) distance *= Math.min(1, aspect) / Math.min(1, next);
  aspect = next; renderer.setSize(width, height, false); updateCamera();
}
function combinedBounds() {
  const box = new THREE.Box3();
  entries.forEach(e => { e.wrapper.updateMatrixWorld(true); box.union(e.stats.bounds.clone().applyMatrix4(e.wrapper.matrixWorld)); if(e.effect?.mesh.visible)box.union(e.effect.bounds.clone().applyMatrix4(e.wrapper.matrixWorld)); });
  return box;
}
function frameView() {
  const box = combinedBounds(); if (box.isEmpty()) return;
  box.getCenter(target); updateCamera();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const back = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
  let width = 0, height = 0, depth = 0;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const d = new THREE.Vector3(x,y,z).sub(target);
    width = Math.max(width, Math.abs(d.dot(right))); height = Math.max(height, Math.abs(d.dot(up))); depth = Math.max(depth, Math.abs(d.dot(back)));
  }
  distance = Math.max(.1, Math.max(height, width / aspect) / tanFov * 1.3 + (camera.isPerspectiveCamera ? depth : 0));
  framed = true; updateCamera();
}
function markView(name) {
  currentView = name;
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
}
function setView(name) {
  [azimuth, polar] = viewAngles[name] || viewAngles.iso; markView(name);
  $('rotate-toggle').checked = false; updateCamera(); frameView();
}
function zoom(factor) { distance = THREE.MathUtils.clamp(distance * factor, .02, 10000); updateCamera(); }
function pan(dx, dy) {
  const scale = 2 * distance * tanFov / Math.max(canvas.clientHeight, 1);
  target.add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(-dx * scale));
  target.add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(dy * scale));
  updateCamera();
}
function status(message = '', error = false) {
  $('load-status').textContent = message; $('load-status').hidden = !message; $('load-status').classList.toggle('error', error);
}
function measure(root) {
  root.updateMatrixWorld(true);
  let meshes = 0, triangles = 0;
  const materials = new Set();
  root.traverse(o => { if (!o.isMesh) return; meshes++; triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
  const bounds = new THREE.Box3().setFromObject(root, true);
  return { meshes, triangles: Math.round(triangles), materials: materials.size, bounds, dimensions: bounds.getSize(new THREE.Vector3()) };
}
function disposeEntry(e) {
  e.effect?.dispose();
  review.dispose(e);
  e.mixer.stopAllAction(); e.mixer.uncacheRoot(e.root);
  scene.remove(e.wrapper);
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set();
  e.root.traverse(o => { if (!o.isMesh) return; geometries.add(o.geometry); if (o.skeleton) skeletons.add(o.skeleton); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
  materials.forEach(m => { Object.values(m).forEach(v => { if (v?.isTexture) textures.add(v); }); m.dispose(); });
  geometries.forEach(g => g.dispose()); skeletons.forEach(s => s.dispose());
  textures.forEach(t => { t.dispose(); t.source?.data?.close?.(); });
}
function applyWireframe(root) {
  root.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.wireframe = wireframe; }); });
}
function snapshot(e) {
  const clip = currentClip(e);
  return { name: clip?.name, clipIndex: e.state.clipIndex, progress: clip?.duration ? (e.action?.time || 0) / clip.duration : 0, speed: e.state.speed, loop: e.state.loop, playing: e.state.playing };
}
function configureLoop(e) { e.action?.setLoop(e.state.loop ? THREE.LoopRepeat : THREE.LoopOnce, e.state.loop ? Infinity : 1); }
function setClip(e, index, progress = 0, playing = false) {
  if(index!==e.state.clipIndex && index>=0){const name=e.clips[index]?.name;e.state.loop=(e.model.contract?.clips.find(c=>c.name===name)?.playback || (['idle','move','work','active'].includes(name)?'loop':'once'))==='loop';}
  e.mixer.stopAllAction(); e.state.clipIndex = index; e.state.playing = false; e.action = null;
  const clip = currentClip(e);
  if (clip) {
    e.action = e.mixer.clipAction(clip); e.action.reset(); configureLoop(e);
    e.action.clampWhenFinished = true; e.action.play();
    // One-shot state clips may change on the exact final frame. Looping clips
    // retain the endpoint offset so scrubbing to the end does not wrap to zero.
    e.action.time = THREE.MathUtils.clamp(progress, 0, 1) * Math.max(0, clip.duration - (e.state.loop ? 1e-7 : 0));
    e.mixer.update(0); e.state.playing = playing;
  }
  e.root.updateMatrixWorld(true);
}
async function loadEntry(model, saved) {
  const url = './runtime/' + model.path.split('/').map(encodeURIComponent).join('/') + '?v=' + encodeURIComponent(model.revision);
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene, wrapper = new THREE.Group(); wrapper.add(root);
  const e = { model, root, wrapper, stats: measure(root), clips: gltf.animations, mixer: new THREE.AnimationMixer(root), action: null, state: { clipIndex: -1, playing: false, speed: saved?.speed ?? 1, loop: saved?.loop ?? true } };
  e.effect=createPresentationEffect(THREE,root);
  if(e.effect){wrapper.add(e.effect.mesh);e.effect.setEnabled($('effects-toggle').checked);}
  applyWireframe(root);
  root.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
  e.mixer.addEventListener('finished', () => { e.state.playing = false; if (activeEntry() === e) syncAnimation(); });
  if (saved?.clipIndex >= 0) {
    const index = e.clips.findIndex(c => c.name === saved.name);
    if (index >= 0) {setClip(e, index, saved.progress, saved.playing);e.state.loop=saved.loop;configureLoop(e);}
  }
  return e;
}
function layoutComparison() {
  entries.forEach(e => e.wrapper.position.set(0,0,0));
  if (entries.length < 2) return;
  const total = entries.reduce((n,e) => n + e.stats.dimensions.x, 0) + .8 * (entries.length - 1);
  let cursor = -total / 2;
  entries.forEach(e => { const center = e.stats.bounds.getCenter(new THREE.Vector3()); e.wrapper.position.x = cursor + e.stats.dimensions.x / 2 - center.x; cursor += e.stats.dimensions.x + .8; });
  // Never move the imported root or auto-ground/rescale an asset.
}
async function loadSelection(paths, selectedPath, fit = false) {
  const request = ++generation;
  desiredPaths = [...new Set(paths)]; const requestedPaths = [...desiredPaths];
  const saved = new Map(entries.map(e => [e.model.path, snapshot(e)]));
  loading = true; status('Loading models…');
  bambuExport.sync();
  const results = await Promise.allSettled(requestedPaths.map(p => {
    const m = models.find(m => m.path === p);
    return m ? loadEntry(m, saved.get(p)) : Promise.reject(new Error('Model not found: ' + p));
  }));
  const loaded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
  if (request !== generation) { loaded.forEach(disposeEntry); return; }
  const failed = results.find(r => r.status === 'rejected');
  loading = false;
  if (failed) {
    loaded.forEach(disposeEntry); desiredPaths = entries.map(e => e.model.path);
    status('Could not load model. ' + failed.reason.message, true); syncUi(); return;
  }
  entries.forEach(disposeEntry); entries = loaded;
  activePath = entries.some(e => e.model.path === selectedPath) ? selectedPath : entries[0]?.model.path || '';
  entries.forEach(e => scene.add(e.wrapper)); layoutComparison();
  if (!framed || fit) frameView();
  status(); syncUi(); setLibrary(false);
}
function choose(model, add = false) {
  if (!add && desiredPaths.length === 1 && desiredPaths[0] === model.path && activeEntry()) return;
  return loadSelection(add ? [...desiredPaths, model.path] : [model.path], model.path, add || !framed);
}
function setLibrary(open) {
  document.body.classList.toggle('library-open', open);
  $('open-library').setAttribute('aria-expanded', String(open));
}
function modelRow(model) {
  const row = document.createElement('div'); row.className = 'model-row';
  const button = document.createElement('button'); button.className = 'model-button';
  button.textContent = model.path.split('/').at(-1); button.title = model.path;
  button.setAttribute('aria-selected', String(model.path === activePath)); button.onclick = () => choose(model);
  const add = document.createElement('button'); add.className = 'add-model-button'; add.textContent = '+';
  add.setAttribute('aria-label', 'Add ' + model.path + ' to comparison'); add.disabled = entries.some(e => e.model.path === model.path); add.onclick = () => choose(model, true);
  row.append(button, add); return row;
}
function renderList() {
  const root = { files: [], folders: new Map() }, term = $('search').value.trim().toLowerCase();
  for (const m of models.filter(m => m.path.toLowerCase().includes(term))) {
    const parts = m.path.split('/'); let node = root;
    for (const folder of parts.slice(0,-1)) { if (!node.folders.has(folder)) node.folders.set(folder, { files: [], folders: new Map() }); node = node.folders.get(folder); }
    node.files.push(m);
  }
  function count(n) { return n.files.length + [...n.folders.values()].reduce((s,v) => s + count(v), 0); }
  function tree(n, prefix = '') {
    const fragment = document.createDocumentFragment();
    n.files.forEach(m => fragment.append(modelRow(m)));
    for (const [name, child] of n.folders) {
      const key = prefix + name, details = document.createElement('details'); details.className = 'folder'; details.open = !!term || openFolders.has(key);
      const summary = document.createElement('summary'), label = document.createElement('span'), badge = document.createElement('span');
      label.textContent = name; badge.textContent = count(child); badge.className = 'folder-count'; summary.append(label,badge);
      details.append(summary,tree(child,key + '/'));
      details.addEventListener('toggle', () => { if (!details.isConnected || term) return; if (details.open) openFolders.add(key); else openFolders.delete(key); });
      fragment.append(details);
    }
    return fragment;
  }
  $('model-list').replaceChildren(tree(root)); $('empty-list').hidden = models.length > 0;
}
function syncAnimation() {
  const e = activeEntry(), hasClips = !!e?.clips.length, clip = currentClip(e);
  $('clip-select').replaceChildren(new Option('Rest pose', '-1'), ...(e?.clips || []).map((c,i) => new Option(c.name || 'Clip ' + (i+1), String(i))));
  $('clip-select').value = String(e?.state.clipIndex ?? -1);
  for (const id of ['clip-select','play-button','restart-button','rest-button','step-button','speed-select','loop-toggle']) $(id).disabled = !hasClips;
  $('timeline').disabled = !clip || !clip.duration;
  $('speed-select').value = String(e?.state.speed ?? 1); $('loop-toggle').checked = e?.state.loop ?? true;
  $('play-button').textContent = e?.state.playing ? 'Pause' : 'Play';
  $('step-button').title='Advance one authoring frame ('+(e?.model.contract?.clips.find(c=>c.name===(clip||e?.clips[0])?.name)?.fps||30)+' fps)';
  $('animation-status').textContent = !e ? 'Select a model' : !hasClips ? 'No animation clips' : !clip ? e.clips.length + ' clips · rest pose' : (e.state.playing ? 'Playing' : 'Paused') + ' · ' + clip.name;
  updateTimeline();
}
function updateTimeline() {
  const e = activeEntry(), clip = currentClip(e), time = e?.action?.time || 0, duration = clip?.duration || 0;
  $('timeline').max = String(duration || 1); $('timeline').value = String(time);
  $('time-display').textContent = time.toFixed(2) + ' / ' + duration.toFixed(2) + ' s';
}
function syncUi() {
  renderList();
  $('active-model').replaceChildren(...entries.map(e => new Option(e.model.path.split('/').at(-1), e.model.path)));
  $('active-model').value = activePath; $('active-model').disabled = !entries.length;
  $('comparison-count').textContent = entries.length + (entries.length === 1 ? ' model' : ' models') + ' in view';
  $('clear-comparison-button').disabled = entries.length < 2;
  const e = activeEntry(); $('model-name').textContent = e?.model.path || 'Select a model';
  $('effects-toggle').disabled=!e?.effect;
  $('effect-status').textContent=e?.effect?`Aura: +${e.effect.triangles} triangles · total ${e.stats.triangles+e.effect.triangles} triangles / ${e.stats.meshes+e.effect.meshes} meshes / ${e.stats.materials+e.effect.materials} materials`:'';
  const values = e ? { size: Math.ceil(e.model.bytes / 1024) + ' KB', dimensions: e.stats.dimensions.toArray().map(v => v.toFixed(2)).join(' × ') + ' m', meshes: e.stats.meshes, materials: e.stats.materials, triangles: e.stats.triangles.toLocaleString() } : {};
  for (const k of ['size','dimensions','meshes','materials','triangles']) $('stat-' + k).textContent = values[k] ?? '—';
  syncAnimation();
  review.sync();
  bambuExport.sync();
  if (activePath) { const url = new URL(location.href); url.searchParams.set('asset', e.model.contract.id);url.searchParams.set('version',e.model.contract.version);history.replaceState(null, '', url); }
}
async function refreshModels(initial = false) {
  $('refresh-models').disabled = true; $('refresh-models').textContent = 'Refreshing…';
  try {
    const response = await fetch('./api/models', { cache: 'no-store' }); if (!response.ok) throw new Error('Asset list unavailable');
    models = await response.json(); renderList();
    const params=new URL(location.href).searchParams, raw=params.get('asset');
    const requested = models.find(m=>m.contract.id===raw && m.contract.version===(params.get('version')||'v01'))?.path || raw;
    if (initial) {
      if (requested || models.length) await loadSelection([requested || models[0].path], requested || models[0].path);
    } else if (desiredPaths.length) await loadSelection(desiredPaths, activePath);
  } catch (error) { status('Could not refresh models: ' + error.message, true); }
  finally { $('refresh-models').disabled = false; $('refresh-models').textContent = 'Refresh'; }
}

$('active-model').onchange = () => { activePath = $('active-model').value; syncUi(); };
$('clip-select').onchange = () => { const e=activeEntry(),index=Number($('clip-select').value),name=e.clips[index]?.name;e.state.loop=(e.model.contract?.clips.find(c=>c.name===name)?.playback || (['idle','move','work','active'].includes(name)?'loop':'once'))==='loop';setClip(e,index,0,index>=0);syncAnimation(); };
$('play-button').onclick = () => {
  const e = activeEntry(); if (!e?.clips.length) return;
  if (!currentClip(e) || e.action.time >= currentClip(e).duration - 1e-6) setClip(e, Math.max(0,e.state.clipIndex));
  e.state.playing = !e.state.playing; syncAnimation();
};
$('restart-button').onclick = () => { const e = activeEntry(); setClip(e, Math.max(0,e.state.clipIndex), 0, true); syncAnimation(); };
$('rest-button').onclick = () => { setClip(activeEntry(), -1); syncAnimation(); };
function scrub(seconds) {
  const e = activeEntry(); if (!e?.clips.length) return;
  if (!currentClip(e)) setClip(e,0);
  const duration = currentClip(e).duration;
  setClip(e,e.state.clipIndex,duration ? seconds / duration : 0,false); syncAnimation();
}
$('timeline').oninput = () => scrub(Number($('timeline').value));
$('step-button').onclick = () => {const e=activeEntry(),clip=currentClip(e)||e?.clips[0];scrub((e?.action?.time||0)+1/(e?.model.contract?.clips.find(c=>c.name===clip?.name)?.fps||30));};
$('speed-select').onchange = () => { activeEntry().state.speed = Number($('speed-select').value); };
$('loop-toggle').onchange = () => { const e = activeEntry(); e.state.loop = $('loop-toggle').checked; configureLoop(e); };
$('refresh-models').onclick = () => refreshModels();
$('search').oninput = renderList;
$('frame-button').onclick = frameView;
$('zoom-in-button').onclick = () => zoom(.8);
$('zoom-out-button').onclick = () => zoom(1.25);
$('reset-view-button').onclick = () => setView('iso');
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
$('projection').onchange = () => { camera = $('projection').value === 'perspective' ? perspective : orthographic; updateCamera(); };
$('wireframe-button').onclick = () => { wireframe = !wireframe; $('wireframe-button').setAttribute('aria-pressed',String(wireframe)); entries.forEach(e => applyWireframe(e.root)); };
$('grid-button').onclick = () => { grid.visible = !grid.visible; $('grid-button').setAttribute('aria-pressed',String(grid.visible)); };
$('effects-toggle').onchange=()=>{entries.forEach(e=>e.effect?.setEnabled($('effects-toggle').checked));frameView();};
$('clear-comparison-button').onclick = () => {
  const keep = activeEntry(); ++generation; loading = false;
  entries.filter(e => e !== keep).forEach(disposeEntry); entries = keep ? [keep] : [];
  desiredPaths = entries.map(e => e.model.path); layoutComparison(); status(); frameView(); syncUi();
};
$('open-library').onclick = () => setLibrary(!document.body.classList.contains('library-open'));
$('close-library').onclick = () => setLibrary(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape') setLibrary(false); });
libraryResizer.addEventListener('pointerdown', e => {
  if (innerWidth <= 700 || e.button !== 0) return;
  libraryResizePointer = e.pointerId;
  libraryResizer.setPointerCapture(e.pointerId);
  document.body.classList.add('library-resizing');
  e.preventDefault();
});
libraryResizer.addEventListener('pointermove', e => {
  if (e.pointerId !== libraryResizePointer) return;
  setLibraryWidth(e.clientX);
});
function finishLibraryResize(e) {
  if (e.pointerId !== libraryResizePointer) return;
  libraryResizePointer = null;
  document.body.classList.remove('library-resizing');
  if (preferredLibraryWidth !== null) setLibraryWidth(preferredLibraryWidth, true);
}
for (const event of ['pointerup','pointercancel','lostpointercapture']) libraryResizer.addEventListener(event, finishLibraryResize);
libraryResizer.addEventListener('keydown', e => {
  const current = Math.round(library.getBoundingClientRect().width);
  const next = e.key === 'ArrowLeft' ? current - 16 : e.key === 'ArrowRight' ? current + 16 : e.key === 'Home' ? libraryMinWidth : e.key === 'End' ? libraryWidthLimit() : null;
  if (next === null) return;
  e.preventDefault(); setLibraryWidth(next, true);
});
libraryResizer.addEventListener('dblclick', resetLibraryWidth);
window.addEventListener('resize', syncLibraryResizer);
const pointers = new Map();
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => { pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:e.button===2}); canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  const old = pointers.get(e.pointerId), before = [...pointers.values()];
  pointers.set(e.pointerId,{...old,x:e.clientX,y:e.clientY});
  $('rotate-toggle').checked = false;
  if (pointers.size === 2) {
    const after = [...pointers.values()];
    const oldGap = Math.hypot(before[0].x-before[1].x,before[0].y-before[1].y), newGap = Math.hypot(after[0].x-after[1].x,after[0].y-after[1].y);
    if (oldGap > 0 && newGap > 0) zoom(oldGap/newGap);
    pan((after[0].x+after[1].x-before[0].x-before[1].x)/2,(after[0].y+after[1].y-before[0].y-before[1].y)/2);
  } else if (pointers.size === 1) {
    const dx=e.clientX-old.x,dy=e.clientY-old.y;
    if (old.pan) pan(dx,dy);
    else { azimuth-=dx*.008; polar=THREE.MathUtils.clamp(polar+dy*.008,.0001,Math.PI-.0001); markView('custom'); updateCamera(); }
  }
});
for (const event of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(event,e => pointers.delete(e.pointerId));
canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(THREE.MathUtils.clamp(e.deltaY,-200,200)*.001)); }, {passive:false});
const clock = new THREE.Clock();let effectTime=0;
const bambuExport = installBambuExport({ active: activeEntry, loading: () => loading });
const review=installReview({THREE,scene,renderer,key,fill,canvas,models:()=>models,entries:()=>entries,active:activeEntry,frame:frameView,zoom,choosePath:p=>choose(models.find(m=>m.path===p),true),context:()=>({view:currentView,projection:camera.type,camera:camera.position.toArray(),target:target.toArray(),distance,clip:currentClip(activeEntry())?.name||null,time:activeEntry()?.action?.time||0,loop:activeEntry()?.state.loop,speed:activeEntry()?.state.speed}),render:()=>renderer.render(scene,camera)});
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(),.1);
  effectTime+=dt;
  entries.forEach(e => { if (e.state.playing) e.mixer.update(dt*e.state.speed); });
  if ($('rotate-toggle').checked) { azimuth += dt*.35; markView('custom'); updateCamera(); }
  entries.forEach(e=>e.effect?.update(camera,effectTime));
  updateTimeline(); review.update(); renderer.render(scene,camera);
});
// Read-only diagnostics used by the local verification suite.
window.inspectorState = () => ({
  loading, activePath, view: currentView, projection: camera.type, distance, target: target.toArray(), camera: camera.position.toArray(), effects:entries.map(e=>({path:e.model.path,enabled:!!e.effect?.mesh.visible,triangles:e.effect?.triangles||0,meshes:e.effect?.meshes||0,materials:e.effect?.materials||0})),
  entries: entries.map(e => ({ path:e.model.path, revision:e.model.revision, triangles:e.stats.triangles, meshes:e.stats.meshes, materials:e.stats.materials, bounds:[e.stats.bounds.min.toArray(),e.stats.bounds.max.toArray()], root:e.root.position.toArray(), wrapper:e.wrapper.position.toArray(), clips:e.clips.map(c=>({name:c.name,duration:c.duration})), clip:currentClip(e)?.name||null, time:e.action?.time||0, playing:e.state.playing, loop:e.state.loop, speed:e.state.speed, pose:e.root.getObjectByName('body')?.matrixWorld.elements.slice()||[] }))
});
new ResizeObserver(setSize).observe(canvas);
setSize(); updateCamera(); refreshModels(true);

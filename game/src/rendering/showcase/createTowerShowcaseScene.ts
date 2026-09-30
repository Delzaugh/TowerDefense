import * as THREE from 'three';
import { registerRendererDiagnostics, trackRendererPerformance } from '../diagnostics';
import { addPerformanceEvent } from '../../diagnostics/performance';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonSafeClone } from 'three/addons/utils/SkeletonUtils.js';
import { createDigitalResolve, createResolveBudget } from 'tower-presentation';
import { disposeSceneResources } from '../campus/resources';
import { fetchShowcaseModel as fetchModel } from './loadModel';
import { SHOWCASE_TOWERS } from './assets';
import type { RuntimeAsset } from '../runtimeAsset';
import type { AnimationChoice, ShowcaseStatus, TowerShowcaseScene } from './types';

export type { AnimationChoice, ShowcaseStatus, TowerShowcaseScene } from './types';

const CHOICES: readonly AnimationChoice[] = ['rest', 'idle', 'work', 'move', 'place', 'hit', 'resolve'];
const DEFAULT_AZIMUTH = .24;
const DEFAULT_ELEVATION = .32;
const MODEL_GROUND_Y = 0;
const DEFAULT_ZOOM = 1.65;
const PROJECTION_MARGIN = 1.12;
const MIN_ZOOM = .65;
const MAX_ZOOM = 6;
// One projection volume preserves authored metre scale across the collection.
// The orbit pivot follows the selected model's rest centre without scaling it.
const DISPLAY_HEIGHT = 3.5;
const DISPLAY_WIDTH = 2.9;
const DISPLAY_BOUNDS = new THREE.Box3(
  new THREE.Vector3(-1.55, -.2, -DISPLAY_WIDTH / 2),
  new THREE.Vector3(1.55, MODEL_GROUND_Y + DISPLAY_HEIGHT, 2),
);
const MAX_CACHE = 3;
const FRAME_INTERVAL_MS = 1000 / 30;

type PosePart = {
  object: THREE.Object3D;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
  morph: number[] | null;
};

type LiveTower = {
  id: string;
  actor: THREE.Group;
  model: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  clips: ReadonlyMap<AnimationChoice, THREE.AnimationClip>;
  playback: ReadonlyMap<AnimationChoice, 'loop' | 'once'>;
  reference: PosePart[];
  effect: ReturnType<typeof createDigitalResolve>;
  choice: AnimationChoice;
  action: THREE.AnimationAction | null;
  height: number;
  width: number;
};

type SelectionTransition = {
  generation: number;
  targetId: string;
  phase: 'resolving' | 'waiting' | 'placing';
  incoming: 'loading' | 'loaded' | 'missing' | 'error';
  message?: string | undefined;
};

function capturePose(root: THREE.Object3D): PosePart[] {
  const reference: PosePart[] = [];
  root.traverse(object => {
    const morph = object instanceof THREE.Mesh && object.morphTargetInfluences
      ? [...object.morphTargetInfluences] : null;
    reference.push({ object, position: object.position.clone(), quaternion: object.quaternion.clone(),
      scale: object.scale.clone(), visible: object.visible, morph });
  });
  return reference;
}

function restorePose(reference: readonly PosePart[]): void {
  for (const part of reference) {
    part.object.position.copy(part.position);
    part.object.quaternion.copy(part.quaternion);
    part.object.scale.copy(part.scale);
    part.object.visible = part.visible;
    if (part.morph && part.object instanceof THREE.Mesh && part.object.morphTargetInfluences) {
      part.object.morphTargetInfluences.splice(0, part.object.morphTargetInfluences.length, ...part.morph);
    }
  }
}

function availableClips(asset: RuntimeAsset, gltf: GLTF) {
  const clips = new Map<AnimationChoice, THREE.AnimationClip>();
  const playback = new Map<AnimationChoice, 'loop' | 'once'>();
  for (const spec of asset.clips) {
    if (!CHOICES.includes(spec.name as AnimationChoice)) continue;
    const choice = spec.name as AnimationChoice;
    const clip = THREE.AnimationClip.findByName(gltf.animations, choice);
    if (clip) { clips.set(choice, clip); playback.set(choice, spec.playback); }
  }
  return { clips, playback };
}

/** A transparent, clipped model pass sits over the theme-aware inspection field. */
export async function createTowerShowcaseScene(
  canvas: HTMLCanvasElement,
  options: {
    viewport: HTMLElement;
    reducedMotion: boolean;
    onStatus: (status: ShowcaseStatus) => void;
    onAnimationChange: (choice: AnimationChoice) => void;
    onPortrait?: (id: string, dataUrl: string) => void;
  },
): Promise<TowerShowcaseScene> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.info.autoReset = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const previewScene = new THREE.Scene();
  const previewCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 100);
  const modelCentre = new THREE.Vector3(0, DISPLAY_HEIGHT / 2, 0);
  const loader = new GLTFLoader();
  const budget = createResolveBudget(64);
  const cache = new Map<string, GLTF>();
  const portraits = new Set<string>();
  let modelAbort: AbortController | null = null;
  let live: LiveTower | null = null;
  let transition: SelectionTransition | null = null;
  let frame = 0, lastFrame = 0, generation = 0;
  let renderWidth = 0, renderHeight = 0;
  let previewBox = { x: 0, y: 0, w: 1, h: 1 };
  let layoutDirty = true, cameraDirty = true;
  let portraitPendingId: string | null = null;
  let portraitIdle = 0, portraitTimeout = 0;
  let disposed = false, lost = false, reducedMotion = options.reducedMotion;
  let azimuth = DEFAULT_AZIMUTH, elevation = DEFAULT_ELEVATION, zoom = DEFAULT_ZOOM;
  let dirty = true;
  const constructionStarted = performance.now();
  let firstDraw = false;
  const tracking = trackRendererPerformance('showcase', renderer, () => ({ tower: live?.id ?? null,
    animation: live?.choice ?? null, zoom, azimuth, elevation, reducedMotion, paused: !live?.action, lost }));
  tracking.metadata({ targetFPS: 30 });
  const modelLoads: Record<string, unknown>[] = [];
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0;

  previewScene.add(new THREE.HemisphereLight(0xfff3df, 0x34475e, 2.15));
  const previewSun = new THREE.DirectionalLight(0xffebd6, 2.25);
  previewSun.position.set(-5, 9, 7);
  previewSun.castShadow = true;
  previewSun.shadow.mapSize.set(1024, 1024);
  Object.assign(previewSun.shadow.camera, { left: -5, right: 5, top: 6, bottom: -5, near: .1, far: 30 });
  previewSun.shadow.camera.updateProjectionMatrix();
  previewSun.shadow.normalBias = .025;
  previewScene.add(previewSun);
  const previewFill = new THREE.DirectionalLight(0xbddce8, .75);
  previewFill.position.set(5, 5, -5);
  previewScene.add(previewFill);

  function report(status: ShowcaseStatus) {
    if (!disposed) options.onStatus(status);
  }
  function measureLayout() {
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    const canvasRect = canvas.getBoundingClientRect();
    const rect = options.viewport.getBoundingClientRect();
    const x = THREE.MathUtils.clamp(rect.left - canvasRect.left, 0, canvasRect.width);
    const y = THREE.MathUtils.clamp(rect.top - canvasRect.top, 0, canvasRect.height);
    previewBox = { x, y, w: Math.max(1, Math.min(rect.width, canvasRect.width - x)),
      h: Math.max(1, Math.min(rect.height, canvasRect.height - y)) };
    if (width !== renderWidth || height !== renderHeight) {
      renderer.setSize(width, height, false);
      renderWidth = width;
      renderHeight = height;
    }
    layoutDirty = false;
    cameraDirty = true;
  }
  function updatePreviewCamera() {
    const viewportAspect = Math.max(.35, previewBox.w / previewBox.h);
    const body = DISPLAY_BOUNDS;
    const envelope = body.clone();
    const side = DISPLAY_WIDTH * .13;
    envelope.min.x -= side; envelope.max.x += side;
    envelope.min.z -= side; envelope.max.z += side;
    envelope.max.y += DISPLAY_HEIGHT * .26;
    const target = modelCentre;
    const radius = 11;
    previewCamera.position.set(target.x + Math.sin(azimuth) * Math.cos(elevation) * radius,
      target.y + Math.sin(elevation) * radius,
      target.z + Math.cos(azimuth) * Math.cos(elevation) * radius);
    previewCamera.lookAt(target);
    previewCamera.updateMatrixWorld(true);
    const right = new THREE.Vector3().setFromMatrixColumn(previewCamera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(previewCamera.matrixWorld, 1);
    const projectedExtent = (box: THREE.Box3) => {
      let horizontal = 0, vertical = 0;
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const offset = new THREE.Vector3(x, y, z).sub(envelope.getCenter(new THREE.Vector3()));
        horizontal = Math.max(horizontal, Math.abs(offset.dot(right)));
        vertical = Math.max(vertical, Math.abs(offset.dot(up)));
      }
      return Math.max(2 * vertical, 2 * horizontal / viewportAspect);
    };
    const nominalHeight = Math.max(3.4, projectedExtent(envelope) * 1.16);
    // Reset includes effect travel. Close inspection may intentionally crop the
    // model; do not undo the user's zoom by fitting its bounds every frame.
    const desiredHeight = nominalHeight * PROJECTION_MARGIN;
    zoom = THREE.MathUtils.clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    previewCamera.top = desiredHeight / 2; previewCamera.bottom = -previewCamera.top;
    previewCamera.right = desiredHeight * viewportAspect / 2; previewCamera.left = -previewCamera.right;
    previewCamera.zoom = zoom;
    previewCamera.updateProjectionMatrix();
    cameraDirty = false;
  }
  function draw(start = tracking.begin(), continuous = false, timestamp?: number) {
    if (disposed || lost || document.hidden) return;
    try {
      if (layoutDirty) measureLayout();
      if (cameraDirty) updatePreviewCamera();
      renderer.info.reset();
      renderer.setViewport(0, 0, renderWidth, renderHeight);
      renderer.setScissorTest(false);
      renderer.autoClear = true;
      renderer.clear(true, true, true);
      const box = previewBox;
      renderer.setViewport(box.x, renderHeight - box.y - box.h, box.w, box.h);
      renderer.setScissor(box.x, renderHeight - box.y - box.h, box.w, box.h);
      renderer.setScissorTest(true);
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(previewScene, previewCamera);
      renderer.setScissorTest(false);
      renderer.autoClear = true;
      renderer.setViewport(0, 0, renderWidth, renderHeight);
      dirty = false;
      if (start !== undefined) tracking.end(start, { continuous, ...(timestamp === undefined ? {} : { timestamp }) });
      if (!firstDraw) { firstDraw = true; tracking.metadata({ readyMs: performance.now() - constructionStarted }); }
      schedulePortraitAfterFirstDraw();
    } catch (cause) {
      lost = true;
      addPerformanceEvent('render-error', String(cause));
      report({ phase: 'error', animations: [], message: cause instanceof Error ? cause.message : 'The 3D preview stopped.' });
    }
  }
  function stopLoop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    tracking.breakCadence();
  }
  function requestFrame() {
    if (!frame && !disposed && !lost && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function tick(time: number) {
    frame = 0;
    if (disposed || lost || document.hidden) return;
    if (live?.action && !dirty && lastFrame && time - lastFrame < FRAME_INTERVAL_MS) {
      requestFrame();
      return;
    }
    const delta = lastFrame ? Math.min((time - lastFrame) / 1000, .08) : 0;
    const started = tracking.begin();
    lastFrame = time;
    const current = live;
    if (current?.action) {
      current.mixer.update(delta);
      if (live === current) {
        current.actor.updateMatrixWorld(true);
        if (current.action) current.effect?.setState(current.choice, current.action.time, current.action.getClip().duration);
        else current.effect?.setState(null);
        dirty = true;
      }
    }
    if (dirty) draw(started, !!current?.action, time);
    if (live?.action) requestFrame();
  }
  function invalidate() { dirty = true; requestFrame(); }

  function clearLive() {
    if (!live) return;
    live.effect?.setState(null);
    live.effect?.dispose();
    live.mixer.stopAllAction();
    live.mixer.uncacheRoot(live.model);
    live.actor.parent?.remove(live.actor);
    live.model.traverse(object => { if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose(); });
    live = null;
    invalidate();
  }
  function disposeCacheEntry(id: string) {
    const model = cache.get(id);
    if (!model) return;
    cache.delete(id);
    disposeSceneResources([], [model]);
  }
  function trimCache() {
    while (cache.size > MAX_CACHE) {
      const evict = [...cache.keys()].find(id => id !== live?.id);
      if (!evict) break;
      disposeCacheEntry(evict);
    }
  }
  function setChoice(choice: AnimationChoice, notify = true, startAt = 0) {
    if (!live) return;
    const active = live;
    if (choice !== 'rest' && !active.clips.has(choice)) return;
    active.effect?.setState(null);
    active.mixer.stopAllAction();
    restorePose(active.reference);
    active.choice = choice;
    active.action = null;
    if (choice !== 'rest') {
      const clip = active.clips.get(choice)!;
      const action = active.mixer.clipAction(clip).reset();
      const playback = active.playback.get(choice) ?? 'loop';
      action.setLoop(playback === 'once' ? THREE.LoopOnce : THREE.LoopRepeat, playback === 'once' ? 1 : Infinity);
      action.clampWhenFinished = playback === 'once';
      action.time = THREE.MathUtils.clamp(startAt, 0, Math.max(0, clip.duration - .00001));
      action.play();
      active.mixer.update(0);
      active.action = action;
      active.model.updateMatrixWorld(true);
      active.effect?.setState(choice, action.time, clip.duration);
    }
    if (notify) options.onAnimationChange(choice);
    lastFrame = 0;
    invalidate();
  }
  function onFinished(event: THREE.Event & { action?: THREE.AnimationAction }) {
    if (!live || event.action !== live.action) return;
    if (transition?.phase === 'resolving' && live.choice === 'resolve') {
      clearLive();
      transition.phase = 'waiting';
      advanceTransition();
      return;
    }
    if (transition?.phase === 'placing' && live.choice === 'place') {
      finishIncoming();
      return;
    }
    setChoice(reducedMotion || !live.clips.has('idle') ? 'rest' : 'idle');
  }
  function install(id: string, gltf: GLTF) {
    clearLive();
    const model = skeletonSafeClone(gltf.scene);
    const actor = new THREE.Group();
    actor.name = `showcase_${id}`;
    model.position.y = MODEL_GROUND_Y;
    actor.add(model);
    let effect: ReturnType<typeof createDigitalResolve> = null;
    try {
      const rawBox = new THREE.Box3().setFromObject(gltf.scene);
      const dimensions = rawBox.getSize(new THREE.Vector3());
      rawBox.getCenter(modelCentre);
      modelCentre.y += MODEL_GROUND_Y;
      cameraDirty = true;
      model.traverse(object => {
        if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
      });
      const mixer = new THREE.AnimationMixer(model);
      const { clips, playback } = availableClips(SHOWCASE_TOWERS[id]!, gltf);
      const reference = capturePose(model);
      effect = createDigitalResolve(THREE, model, { budget });
      if (effect) { actor.add(effect.object); effect.prepare(); }
      previewScene.add(actor);
      live = { id, actor, model, mixer, clips, playback, reference, effect, choice: 'rest', action: null,
        height: Math.max(.1, dimensions.y), width: Math.max(.1, dimensions.x, dimensions.z) };
      mixer.addEventListener('finished', onFinished);
      portraitPendingId = options.onPortrait && !portraits.has(id) ? id : null;
      invalidate();
    } catch (cause) {
      effect?.dispose();
      actor.removeFromParent();
      model.traverse(object => { if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose(); });
      throw cause;
    }
  }
  function finishIncoming() {
    if (!live) return;
    transition = null;
    setChoice(reducedMotion || !live.clips.has('idle') ? 'rest' : 'idle');
    report({ phase: 'ready', animations: ['rest', ...CHOICES.slice(1).filter(choice => live!.clips.has(choice))] });
  }
  function advanceTransition() {
    const current = transition;
    if (!current || current.phase !== 'waiting' || disposed || lost) return;
    if (current.incoming === 'loading') {
      report({ phase: 'loading', animations: [], message: 'Loading model preview…' });
      return;
    }
    if (current.incoming === 'missing' || current.incoming === 'error') {
      transition = null;
      options.onAnimationChange('rest');
      report({ phase: current.incoming, animations: [], ...(current.message ? { message: current.message } : {}) });
      return;
    }
    const model = cache.get(current.targetId);
    if (!model) {
      current.incoming = 'error';
      current.message = 'Model preview could not load. Retry.';
      advanceTransition();
      return;
    }
    try {
      install(current.targetId, model);
      if (reducedMotion || !live?.clips.has('place')) {
        finishIncoming();
        return;
      }
      current.phase = 'placing';
      report({ phase: 'placing', animations: [], message: 'Assembling model preview…' });
      setChoice('place');
    } catch (cause) {
      clearLive();
      current.phase = 'waiting';
      current.incoming = 'error';
      current.message = cause instanceof Error ? cause.message : 'Model preview could not open. Retry.';
      advanceTransition();
    }
  }
  function cancelPortraitTask() {
    if (portraitIdle) window.cancelIdleCallback(portraitIdle);
    if (portraitTimeout) window.clearTimeout(portraitTimeout);
    portraitIdle = portraitTimeout = 0;
    portraitPendingId = null;
  }
  function schedulePortraitAfterFirstDraw() {
    const id = portraitPendingId;
    if (!id || !options.onPortrait || portraits.has(id) || portraitIdle || portraitTimeout) return;
    if (live?.id !== id || (live.choice !== 'rest' && live.choice !== 'idle')) return;
    portraitPendingId = null;
    const selected = generation;
    const capture = () => {
      portraitIdle = portraitTimeout = 0;
      if (disposed || lost || selected !== generation || live?.id !== id) return;
      if (document.hidden) { portraitPendingId = id; return; }
      if (live.choice !== 'rest' && live.choice !== 'idle') { portraitPendingId = id; return; }
      capturePortrait(id);
    };
    if (typeof window.requestIdleCallback === 'function') portraitIdle = window.requestIdleCallback(capture, { timeout: 1200 });
    else portraitTimeout = window.setTimeout(capture, 120);
  }
  function capturePortrait(id: string) {
    if (!options.onPortrait || portraits.has(id) || !live || live.id !== id || disposed || lost) return;
    // A small canonical model render, using this same renderer and the authored material.
    const target = new THREE.WebGLRenderTarget(192, 192, { depthBuffer: true });
    target.texture.colorSpace = THREE.SRGBColorSpace;
    const image = document.createElement('canvas');
    image.width = image.height = 192;
    const context = image.getContext('2d');
    if (!context) { target.dispose(); return; }
    const half = Math.max(1.0, live.height * .59, live.width * .59);
    const camera = new THREE.OrthographicCamera(-half, half, half, -half, .1, 30);
    const focusY = MODEL_GROUND_Y + live.height * .49;
    camera.position.set(3.5, focusY + 1.3, 8);
    camera.lookAt(0, focusY, .45);
    try {
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(previewScene, camera);
      const pixels = new Uint8Array(192 * 192 * 4);
      renderer.readRenderTargetPixels(target, 0, 0, 192, 192, pixels);
      const frame = context.createImageData(192, 192);
      for (let row = 0; row < 192; row++) {
        frame.data.set(pixels.subarray((191 - row) * 192 * 4, (192 - row) * 192 * 4), row * 192 * 4);
      }
      context.putImageData(frame, 0, 0);
      portraits.add(id);
      options.onPortrait(id, image.toDataURL('image/png'));
    } catch { /* Portraits are supplementary; the live preview remains usable. */ }
    finally {
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0);
      target.dispose();
      invalidate();
    }
  }
  function setTower(id: string) {
    if (disposed || lost) return;
    if (transition?.targetId === id || (!transition && live?.id === id)) return;
    const selected = ++generation;
    // Title/availability copy can shift the viewport without changing its size.
    layoutDirty = true;
    cancelPortraitTask();
    modelAbort?.abort();
    modelAbort = null;
    const asset = SHOWCASE_TOWERS[id];
    const continuingResolve = live?.choice === 'resolve' && transition?.phase === 'resolving' && !!live.action;
    const outgoing = !!live && !reducedMotion && live.clips.has('resolve');
    transition = { generation: selected, targetId: id, phase: outgoing ? 'resolving' : 'waiting',
      incoming: !asset ? 'missing' : cache.has(id) ? 'loaded' : 'loading',
      message: !asset ? 'Model preview coming soon.' : undefined };
    if (asset && cache.has(id)) {
      const cached = cache.get(id)!;
      cache.delete(id); cache.set(id, cached);
    }
    if (outgoing) {
      report({ phase: 'resolving', animations: [], message: 'Preparing the next Tower…' });
      if (!continuingResolve) {
        const placing = live!.choice === 'place' && live!.action;
        const startAt = placing && live!.clips.has('place')
          ? (1 - live!.action!.time / live!.clips.get('place')!.duration) * live!.clips.get('resolve')!.duration
          : 0;
        try { setChoice('resolve', true, startAt); }
        catch {
          clearLive();
          transition.phase = 'waiting';
          advanceTransition();
        }
      }
    } else {
      clearLive();
      advanceTransition();
    }
    if (!asset || cache.has(id)) return;
    const controller = new AbortController();
    modelAbort = controller;
    void fetchModel(asset, controller.signal, loader, 20_000, timings => {
      modelLoads.push({ id: asset.id, version: asset.version, revision: asset.revision, sha256: asset.sha256, bytes: asset.bytes, ...timings });
      if (modelLoads.length > 50) modelLoads.shift();
      tracking.metadata({ assets: modelLoads });
    }).then(model => {
      if (disposed || lost || selected !== generation || transition?.generation !== selected) {
        disposeSceneResources([], [model]);
        return;
      }
      cache.set(id, model);
      trimCache();
      transition.incoming = 'loaded';
      advanceTransition();
    }).catch(cause => {
      if (disposed || lost || selected !== generation || controller.signal.aborted || transition?.generation !== selected) return;
      transition.incoming = 'error';
      transition.message = cause instanceof Error ? cause.message : 'Model preview could not load. Retry.';
      advanceTransition();
    });
  }
  function onVisibilityChange() {
    if (document.hidden) { resetPointers(); stopLoop(); }
    else { lastFrame = 0; layoutDirty = true; invalidate(); }
  }
  function onContextLost(event: Event) {
    event.preventDefault();
    lost = true;
    resetPointers();
    stopLoop();
    report({ phase: 'error', animations: [], message: 'The graphics context was lost. Use Retry preview to restore it.' });
  }
  function onPointerDown(event: PointerEvent) {
    if (!live || lost || document.hidden || event.button !== 0 || (event.target instanceof Element && event.target.closest('button'))) return;
    if (pointers.size >= 2) { resetPointers(); return; }
    options.viewport.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDistance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    }
    event.preventDefault();
  }
  function onPointerMove(event: PointerEvent) {
    const prior = pointers.get(event.pointerId);
    if (!prior) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinchDistance > 0) scene.zoomBy(distance / pinchDistance);
      pinchDistance = distance;
    } else if (pointers.size === 1) {
      const width = Math.max(120, options.viewport.clientWidth);
      const height = Math.max(120, options.viewport.clientHeight);
      scene.orbit((event.clientX - prior.x) / width * Math.PI * 2,
        (prior.y - event.clientY) / height * Math.PI * .9);
    }
    event.preventDefault();
  }
  function resetPointers() {
    const ids = [...pointers.keys()];
    pointers.clear();
    pinchDistance = 0;
    for (const id of ids) if (options.viewport.hasPointerCapture(id)) options.viewport.releasePointerCapture(id);
  }
  function onPointerEnd(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    if (event.type !== 'pointerup') { resetPointers(); return; }
    pointers.delete(event.pointerId);
    pinchDistance = 0;
    if (options.viewport.hasPointerCapture(event.pointerId)) options.viewport.releasePointerCapture(event.pointerId);
  }
  function onWheel(event: WheelEvent) {
    if (!live) return;
    const delta = event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 400 : 1);
    scene.zoomBy(Math.exp(-delta * .001));
    event.preventDefault();
  }
  window.addEventListener('blur', resetPointers);
  document.addEventListener('visibilitychange', onVisibilityChange);
  canvas.addEventListener('webglcontextlost', onContextLost);
  options.viewport.addEventListener('pointerdown', onPointerDown);
  options.viewport.addEventListener('pointermove', onPointerMove);
  options.viewport.addEventListener('pointerup', onPointerEnd);
  options.viewport.addEventListener('pointercancel', onPointerEnd);
  options.viewport.addEventListener('lostpointercapture', onPointerEnd);
  options.viewport.addEventListener('wheel', onWheel, { passive: false });
  const unregisterDiagnostics = registerRendererDiagnostics('showcase', renderer, () => ({ tower: live?.id ?? null, animation: live?.choice ?? null, zoom, azimuth, elevation }));
  const scene: TowerShowcaseScene = {
    setTower,
    selectAnimation(choice) { if (!transition) setChoice(choice); },
    orbit(horizontal, vertical) {
      azimuth = (azimuth + horizontal) % (Math.PI * 2);
      elevation = THREE.MathUtils.clamp(elevation + vertical, .2, 1.3);
      cameraDirty = true;
      invalidate();
    },
    zoomBy(factor) { if (Number.isFinite(factor) && factor > 0) { zoom = THREE.MathUtils.clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM); cameraDirty = true; invalidate(); } },
    resetView() { azimuth = DEFAULT_AZIMUTH; elevation = DEFAULT_ELEVATION; zoom = DEFAULT_ZOOM; cameraDirty = true; invalidate(); },
    resize() { layoutDirty = true; invalidate(); },
    setReducedMotion(value) {
      reducedMotion = value;
      if (value && transition?.phase === 'resolving') {
        clearLive();
        transition.phase = 'waiting';
        advanceTransition();
      } else if (value && transition?.phase === 'placing') {
        finishIncoming();
      } else if (!transition && live) setChoice(value || !live.clips.has('idle') ? 'rest' : 'idle');
      invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      transition = null;
      cancelPortraitTask();
      stopLoop();
      modelAbort?.abort(); modelAbort = null;
      window.removeEventListener('blur', resetPointers);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      options.viewport.removeEventListener('pointerdown', onPointerDown);
      options.viewport.removeEventListener('pointermove', onPointerMove);
      options.viewport.removeEventListener('pointerup', onPointerEnd);
      options.viewport.removeEventListener('pointercancel', onPointerEnd);
      options.viewport.removeEventListener('lostpointercapture', onPointerEnd);
      options.viewport.removeEventListener('wheel', onWheel);
      resetPointers();
      clearLive();
      for (const id of [...cache.keys()]) disposeCacheEntry(id);
      disposeSceneResources([previewScene]);
      previewSun.shadow.dispose();
      previewScene.clear();
      unregisterDiagnostics();
      tracking.dispose();
      renderer.dispose();
    },
  };

  invalidate();
  return scene;
}

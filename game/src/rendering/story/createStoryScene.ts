import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { captureProgress, clampStoryTime, STORY_DURATION, storyCamera, storyFrame, storyPose, storyProgress } from '../../content/story/octocatAbduction';
import type { StoryRole } from '../../content/story/octocatAbduction';
import { registerRendererDiagnostics } from '../diagnostics';
import { disposeSceneResources } from '../campus/resources';
import { fetchShowcaseModel } from '../showcase/loadModel';
import { STORY_ASSETS } from './assets';
import { createStoryEffects } from './effects';
import type { StoryScene, StorySceneOptions } from './types';

type Actor = { role: StoryRole; group: THREE.Group; model: THREE.Object3D; mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>; active: string };

/** Scene-specific blocking wraps intact models; rigs and clips remain Blender-owned.
 * Later appearance assembly can replace these role instances without changing direction. */
function createActor(role: StoryRole, gltf: GLTF): Actor {
  const model = clone(gltf.scene);
  const group = new THREE.Group();
  group.name = role;
  group.add(model);
  model.traverse(object => {
    if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map(gltf.animations.map(clip => [clip.name, mixer.clipAction(clip)]));
  return { role, group, model, mixer, actions, active: '' };
}

function stageActor(actor: Actor, time: number, reduced: boolean) {
  const pose = storyPose(actor.role, time);
  actor.group.position.fromArray(pose.position);
  actor.group.rotation.y = pose.heading;
  actor.group.visible = pose.visible;
  for (const [name, action] of actor.actions) {
    const current = name === pose.clip;
    const previous = !reduced && name === pose.blend?.clip && !current;
    if (!current && !previous) { if (action.isScheduled()) action.stop(); continue; }
    if (!action.isScheduled()) action.reset().play();
    const once = ['hit', 'story_alarm', 'story_determined', 'story_startle', 'story_reach', 'story_grab'].includes(name);
    const duration = action.getClip().duration;
    const sampledTime = current ? pose.clipTime : pose.blend!.clipTime;
    const clipTime = reduced ? Math.max(.65, sampledTime) : sampledTime;
    action.paused = true;
    action.enabled = true;
    action.setEffectiveWeight(reduced ? 1 : current ? 1 - (pose.blend?.weight ?? 0) : pose.blend!.weight);
    // Sample both clips by absolute time: no frame-history-dependent crossfade.
    // Reduced motion keeps the meaningful pose of the selected shot without playback.
    action.time = once ? Math.min(duration - .00001, Math.max(0, clipTime))
      : ((clipTime % duration) + duration) % duration;
  }
  actor.active = pose.clip;
  actor.mixer.update(0);
  actor.group.updateMatrixWorld(true);
}

/** On-demand independent courtyard. No campus assets, preferences or game state are mutated. */
export async function createStoryScene(canvas: HTMLCanvasElement, options: StorySceneOptions): Promise<StoryScene> {
  options.signal.throwIfAborted();
  const controller = new AbortController();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc8d5df);
  scene.fog = new THREE.Fog(0xc8d5df, 25, 60);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 70);
  const models = new Map<string, GLTF>();
  const actors: Actor[] = [];
  let renderer: THREE.WebGLRenderer | undefined;
  let unregister = () => {};
  let disposed = false, ready = false, lost = false;
  let paused = options.paused, reduced = options.reducedMotion;
  let time = 0, frame = 0, last = 0;
  let width = 0, height = 0;
  let lastReport = -1;
  const effects = createStoryEffects();
  scene.add(effects.group);
  const stopLoop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ready = false;
    stopLoop();
    controller.abort(new DOMException('Story closed', 'AbortError'));
    options.signal.removeEventListener('abort', dispose);
    canvas.removeEventListener('webglcontextlost', contextLost);
    for (const actor of actors) { actor.mixer.stopAllAction(); actor.mixer.uncacheRoot(actor.model); }
    scene.traverse(object => { if (object instanceof THREE.Light && 'shadow' in object) (object.shadow as THREE.LightShadow).dispose(); });
    disposeSceneResources([scene], models.values());
    scene.clear();
    unregister();
    renderer?.dispose();
  };
  const error = (cause: unknown) => {
    if (disposed || lost) return;
    lost = true;
    stopLoop();
    options.onError(cause instanceof Error ? cause : new Error(String(cause)));
  };
  function contextLost(event: Event) { event.preventDefault(); error(new Error('The story graphics context was lost. Please retry.')); }
  const report = (force = false) => {
    // React receives at most 8 updates/sec; the renderer owns the 30 FPS clock.
    const bucket = Math.floor(time * 8);
    if (force || bucket !== lastReport || time === STORY_DURATION) { lastReport = bucket; options.onFrame(storyFrame(time)); }
  };
  const draw = () => {
    if (!renderer || disposed || lost || !ready) return;
    const staging = storyCamera(time);
    const aspect = width / height;
    // Portrait widens the lens enough to retain the cast in the same close shot.
    camera.fov = aspect < 1.25 ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(staging.fov / 2)) * 1.25 / aspect)) : staging.fov;
    camera.position.fromArray(staging.position);
    camera.lookAt(new THREE.Vector3().fromArray(staging.target));
    camera.updateProjectionMatrix();
    for (const actor of actors) stageActor(actor, time, reduced);
    effects.update(time, reduced);
    // One small contact impulse; no continuous handheld wobble or reduced-motion shake.
    if (!reduced && time >= 22.9 && time < 23.15) {
      const impulse = (1 - storyProgress(time, 22.9, 23.15)) * .028;
      camera.position.y += Math.sin((time - 22.9) * 65) * impulse;
    }
    renderer.render(scene, camera);
    report();
  };
  const tick = (timestamp: number) => {
    frame = 0;
    if (disposed || lost || !ready || paused || reduced || time >= STORY_DURATION) return;
    if (!last) last = timestamp;
    const elapsed = timestamp - last;
    if (elapsed >= 1000 / 30 - .2) {
      // No catch-up after tab suspension or a browser stall.
      time = clampStoryTime(time + Math.min(elapsed / 1000, .1));
      last = timestamp;
      try { draw(); } catch (cause) { error(cause); }
    }
    if (!disposed && !lost && !paused && !reduced && time < STORY_DURATION) frame = requestAnimationFrame(tick);
  };
  const refresh = () => {
    stopLoop();
    if (ready && !disposed && !lost && !paused && !reduced && time < STORY_DURATION) frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    if (!renderer || disposed || lost) return;
    width = Math.max(1, canvas.clientWidth); height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 760 ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    try { draw(); } catch (cause) { error(cause); }
  };
  options.signal.addEventListener('abort', dispose, { once: true });
  canvas.addEventListener('webglcontextlost', contextLost);
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    unregister = registerRendererDiagnostics('story', renderer, () => ({ time, paused, reducedMotion: reduced, finished: time >= STORY_DURATION,
      shot: storyFrame(time).shot, actors: actors.map(a => ({ role: a.role, visible: a.group.visible, clip: a.active, position: a.group.position.toArray() })),
      capture: captureProgress(time) > 0, expression: effects.badge.visible ? 'alarm' : null,
      trapPhase: time < 21 ? 'hidden' : time < 23 ? 'deploy' : time < 24 ? 'lock' : time < 30 ? 'resist' : time < 35 ? 'tow' : 'gone',
      ready, shadowSize: 1024, postPasses: 0, assets: Object.values(STORY_ASSETS).map(a => `${a.id}@${a.version}`) }));
    scene.add(new THREE.HemisphereLight(0xffedcf, 0x697c98, 1.8));
    const sun = new THREE.DirectionalLight(0xffdfa9, 2.5);
    sun.position.set(-6, 10, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -13, right: 15, top: 10, bottom: -10, near: .5, far: 40 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = .025;
    sun.shadow.bias = -.00015;
    scene.add(sun, sun.target);
    const rim = new THREE.DirectionalLight(0xb2dcec, 1.4);
    rim.position.set(6, 5, -7);
    scene.add(rim);
    const loader = new GLTFLoader();
    const entries = Object.entries(STORY_ASSETS);
    let next = 0, loaded = 0;
    options.onProgress(loaded, entries.length);
    const load = async () => {
      while (next < entries.length && !disposed && !controller.signal.aborted) {
        const [key, asset] = entries[next++]!;
        const gltf = await fetchShowcaseModel(asset, controller.signal, loader);
        if (disposed || controller.signal.aborted) { disposeSceneResources([], [gltf]); return; }
        models.set(key, gltf);
        options.onProgress(++loaded, entries.length);
      }
    };
    const loading = await Promise.allSettled([load(), load(), load()]);
    const failed = loading.find(result => result.status === 'rejected');
    if (failed?.status === 'rejected') throw failed.reason;
    options.signal.throwIfAborted();
    if (disposed) throw new DOMException('Story closed', 'AbortError');
    const place = (key: string, x: number, z: number, rotation = 0, y = 0) => {
      const instance = clone(models.get(key)!.scene);
      instance.position.set(x, y, z);
      instance.rotation.y = rotation;
      instance.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = !/ground|paving/i.test(object.name); object.receiveShadow = true; } });
      scene.add(instance);
      return instance;
    };
    place('courtyard', 0, 0);
    const carrier = new THREE.Group();
    carrier.name = 'Capture carrier'; carrier.add(clone(models.get('carrier')!.scene));
    carrier.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    scene.add(carrier);
    for (const role of ['copilot', 'octocat', 'bug-left', 'bug-right'] as const) {
      const actor = createActor(role, models.get(role.startsWith('bug') ? 'bug' : role)!);
      actors.push(actor); scene.add(actor.group);
    }
    effects.bind(actors[0]!.model, carrier);
    ready = true;
    resize();
    report(true);
    refresh();
    return {
      setPaused(value) { if (disposed) return; paused = value; refresh(); report(true); },
      setReducedMotion(value) { if (disposed) return; reduced = value; refresh(); draw(); report(true); },
      seek(seconds) { if (disposed) return; time = clampStoryTime(seconds); lastReport = -1; draw(); report(true); refresh(); },
      resize, dispose,
    };
  } catch (cause) { dispose(); throw cause; }
}

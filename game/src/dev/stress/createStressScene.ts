import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { disposeSceneResources } from '../../rendering/campus/resources';
import { rendererMetrics } from '../../rendering/diagnostics';
import { addPerformanceEvent, beginPerformancePhase, endPerformancePhase, getPerformanceSnapshot, getTrackingEnabled,
  registerPerformanceSource, setTrackingEnabled, startRecording, stopRecording, subscribeTracking } from '../../diagnostics/performance';
import type { PerformanceReport } from '../../diagnostics/types';
import { MOVER_ASSETS, STRESS_ASSETS, TOWER_ASSETS } from './assets';
import { BENCHMARK_PHASES, createBenchmarkTimeline } from './benchmark';
import { PATH_LENGTH, PATH_POINTS, pathPose, seededRandom, STRESS_SEED, TOWER_COUNTS, TOWER_POSITIONS } from './layout';
import type { StressPreset, StressView } from './layout';

const FRAME_INTERVAL_MS = 1000 / 30;
const FIXTURE_LABEL = 'Synthetic rendering and animation fixture';
type Actor = { root: THREE.Group; model: THREE.Object3D; mixer: THREE.AnimationMixer; offset: number; speed: number; lateral: number };
export interface StressStatus {
  phase: 'loading' | 'ready' | 'error';
  preset: StressPreset; view: StressView; paused: boolean; benchmark: string | null;
  message: string; report: PerformanceReport | null;
}
export interface StressScene {
  setPreset(preset: StressPreset): void;
  setView(view: StressView): void;
  setPaused(paused: boolean): void;
  reset(): void;
  runBenchmark(): void;
  cancelBenchmark(reason?: string): void;
  dispose(): void;
}

/** This test fixture owns one loop and no production simulation state. */
export function createStressScene(canvas: HTMLCanvasElement, onStatus: (status: StressStatus) => void): StressScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.info.autoReset = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x162a36);
  const camera = new THREE.OrthographicCamera(-22, 22, 17, -17, .1, 150);
  const models = new Map<string, GLTF>();
  const actors: Actor[] = [];
  const towers: Actor[] = [];
  const abort = new AbortController();
  let disposed = false, lost = false, ready = false, paused = false;
  let frame = 0, lastFrame = 0, elapsed = 0, width = 0, height = 0;
  let preset: StressPreset = 25, view: StressView = 'home';
  let benchmarkName: string | null = null, report: PerformanceReport | null = null;
  let pendingPopulationSetup = false;
  let message = 'Loading six delivered models…';
  const pose = { x: 0, z: 0, heading: 0 };
  const source = registerPerformanceSource('stress-map', 'renderer', () => ({ ...rendererMetrics(renderer),
    state: { fixture: FIXTURE_LABEL, seed: STRESS_SEED, movers: actors.length, towers: towers.length,
      preset, view, paused, elapsedSeconds: elapsed, activeMixers: actors.length + towers.length } }));
  source.metadata({ targetFPS: 30, fixture: FIXTURE_LABEL, seed: STRESS_SEED, shadowPassesIncluded: true,
    assets: STRESS_ASSETS.map(({ id, version, revision, sha256, bytes }) => ({ id, version, revision, sha256, bytes })) });

  scene.add(new THREE.HemisphereLight(0xd6f5ff, 0x415159, 2.1));
  const sun = new THREE.DirectionalLight(0xffead0, 2.2);
  sun.position.set(-15, 30, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 20, bottom: -20, near: .1, far: 90 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = .035;
  scene.add(sun);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x346251, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.BoxGeometry(38, .6, 25), groundMaterial);
  ground.position.y = -.4;
  ground.receiveShadow = true;
  scene.add(ground);
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x718b96, roughness: 1 });
  for (let index = 1; index < PATH_POINTS.length; index++) {
    const from = PATH_POINTS[index - 1]!, to = PATH_POINTS[index]!;
    const dx = to[0] - from[0], dz = to[1] - from[1];
    const road = new THREE.Mesh(new THREE.BoxGeometry(2.1, .1, Math.hypot(dx, dz) + 2.1), roadMaterial);
    road.position.set((from[0] + to[0]) / 2, -.045, (from[1] + to[1]) / 2);
    road.rotation.y = Math.atan2(dx, dz);
    road.receiveShadow = true;
    scene.add(road);
  }
  const padGeometry = new THREE.CylinderGeometry(1.45, 1.5, .14, 12);
  const padMaterial = new THREE.MeshStandardMaterial({ color: 0x96bd9d, roughness: .9 });
  for (const [x, z] of TOWER_POSITIONS) {
    const pad = new THREE.Mesh(padGeometry, padMaterial);
    pad.position.set(x, 0, z);
    pad.receiveShadow = true;
    scene.add(pad);
  }

  function notify(phase: StressStatus['phase'] = ready ? 'ready' : 'loading') {
    if (!disposed) onStatus({ phase, preset, view, paused, benchmark: benchmarkName, message, report });
  }
  function stopLoop() { if (frame) cancelAnimationFrame(frame); frame = 0; lastFrame = 0; source.breakCadence(); }
  function requestFrame() { if (!frame && !disposed && !lost && !document.hidden) frame = requestAnimationFrame(tick); }
  function cameraView() {
    const aspect = width / Math.max(1, height);
    const span = view === 'top' ? Math.max(28, 42 / aspect) : Math.max(31, 43 / aspect);
    camera.top = span / 2; camera.bottom = -span / 2;
    camera.left = -span * aspect / 2; camera.right = span * aspect / 2;
    camera.up.set(0, 1, 0);
    if (view === 'top') { camera.position.set(0, 55, .01); camera.up.set(0, 0, -1); }
    else camera.position.set(26, 31, 34);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  function resize() {
    const nextWidth = Math.max(1, canvas.clientWidth), nextHeight = Math.max(1, canvas.clientHeight);
    if (width === nextWidth && height === nextHeight) return;
    if (width && height) cancelBenchmark('Viewport resized; partial benchmark retained.');
    width = nextWidth; height = nextHeight;
    renderer.setSize(width, height, false);
    cameraView(); source.breakCadence(); requestFrame();
  }
  function clearActors(list: Actor[]) {
    const skeletons = new Set<THREE.Skeleton>();
    for (const actor of list) {
      actor.mixer.stopAllAction(); actor.mixer.uncacheRoot(actor.model); actor.root.removeFromParent();
      actor.model.traverse(object => { if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton); });
    }
    for (const skeleton of skeletons) skeleton.dispose();
    list.length = 0;
  }
  function actorFrom(id: string, clipName: 'move' | 'work', random: () => number): Actor {
    const gltf = models.get(id)!;
    const model = clone(gltf.scene);
    const root = new THREE.Group();
    root.add(model);
    model.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    const clip = THREE.AnimationClip.findByName(gltf.animations, clipName);
    if (!clip) throw new Error(`Delivered ${id} model has no ${clipName} clip.`);
    const mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play();
    mixer.setTime(random() * clip.duration);
    scene.add(root);
    return { root, model, mixer, offset: 0, speed: 1.6 + random() * .6, lateral: (random() - .5) * .8 };
  }
  function populate(value: StressPreset) {
    const setupStarted = getTrackingEnabled() ? performance.now() : undefined;
    clearActors(actors); clearActors(towers); preset = value; elapsed = 0;
    const random = seededRandom();
    for (let index = 0; index < value; index++) {
      const actor = actorFrom(MOVER_ASSETS[index % MOVER_ASSETS.length]!.id, 'move', random);
      actor.offset = PATH_LENGTH * index / value;
      actors.push(actor);
    }
    for (let index = 0; index < TOWER_COUNTS[value]; index++) {
      const actor = actorFrom(TOWER_ASSETS[index % TOWER_ASSETS.length]!.id, 'work', random);
      const [x, z] = TOWER_POSITIONS[index]!;
      actor.root.position.set(x, .08, z); actor.root.rotation.y = index % 2 ? Math.PI : 0;
      towers.push(actor);
    }
    updateActors(0); pendingPopulationSetup = true;
    if (setupStarted !== undefined) source.metadata({ populationSetupMs: performance.now() - setupStarted, populationSetupCount: value });
    source.breakCadence(); requestFrame();
  }
  function updateActors(delta: number) {
    elapsed += delta;
    for (const actor of actors) {
      pathPose(actor.offset + elapsed * actor.speed, actor.lateral, pose);
      actor.root.position.set(pose.x, 0, pose.z); actor.root.rotation.y = pose.heading;
      actor.mixer.update(delta);
    }
    for (const tower of towers) tower.mixer.update(delta);
  }
  function finishBenchmark(status: 'completed' | 'cancelled' | 'failed', reason?: string) {
    if (!timeline.active && !benchmarkName) return;
    timeline.cancel(); endPerformancePhase();
    report = stopRecording(status, reason); benchmarkName = null;
    message = status === 'completed' ? 'Benchmark complete. Download its report below.' : reason ?? 'Benchmark cancelled; partial report retained.';
    source.breakCadence(); notify();
  }
  const timeline = createBenchmarkTimeline(phase => {
    endPerformancePhase(); populate(phase.movers);
    benchmarkName = phase.name; beginPerformancePhase(phase.name);
    message = `Benchmark: ${phase.name.replaceAll('-', ' ')}.`; notify();
  }, () => finishBenchmark('completed'));
  function cancelBenchmark(reason = 'Benchmark cancelled; partial report retained.') { finishBenchmark('cancelled', reason); }
  function tick(time: number) {
    frame = 0;
    if (disposed || lost || document.hidden) return;
    if (lastFrame && time - lastFrame < FRAME_INTERVAL_MS - .5) { requestFrame(); return; }
    const started = source.begin();
    try {
      const updateStarted = started === undefined ? 0 : performance.now();
      timeline.advance(time);
      const setupFrame = pendingPopulationSetup;
      pendingPopulationSetup = false;
      const delta = lastFrame && !paused ? Math.min((time - lastFrame) / 1000, .1) : 0;
      lastFrame = time;
      if (ready && !paused) updateActors(delta);
      const updateMs = started === undefined ? 0 : performance.now() - updateStarted;
      renderer.info.reset(); renderer.render(scene, camera);
      // Population transitions and their first render are logged separately so phase
      // percentiles describe steady animation/drawing rather than fixture setup.
      if (started !== undefined) {
        if (setupFrame) {
          source.breakCadence();
          addPerformanceEvent('fixture-setup', `${preset} movers; population setup and first render excluded from steady samples.`);
        } else source.end(started, { timestamp: time, continuous: !paused,
          stages: { animationAndMotion: updateMs, draw: performance.now() - updateStarted - updateMs } });
      }
    } catch (error) {
      lost = true; finishBenchmark('failed', '3D rendering failed; partial benchmark retained.'); stopLoop();
      message = error instanceof Error ? error.message : 'The stress map renderer stopped.'; notify('error'); return;
    }
    if (!paused || timeline.active) requestFrame();
  }
  const onVisibility = () => {
    if (document.hidden) { cancelBenchmark('Tab hidden; partial benchmark retained.'); stopLoop(); }
    else { source.breakCadence(); requestFrame(); }
  };
  const onContextLost = (event: Event) => {
    event.preventDefault(); lost = true;
    finishBenchmark('failed', 'WebGL context lost; partial benchmark retained.'); stopLoop();
    addPerformanceEvent('context-loss', 'Stress map WebGL context lost.');
    message = 'The 3D context was lost. Reload this map to continue.'; notify('error');
  };
  const onContextRestored = () => {
    addPerformanceEvent('context-restored', 'Stress map WebGL context restored.');
    message = 'The 3D context is restored. Reload this map to rebuild the fixture.'; notify('error');
  };
  const unsubscribeTracking = subscribeTracking(() => {
    source.breakCadence();
    if (!timeline.active) return;
    const recording = getPerformanceSnapshot();
    if (!getTrackingEnabled() || recording.status !== 'recording' || recording.configuration.owner !== 'stress-map') {
      cancelBenchmark('Performance recording interrupted; partial benchmark retained.');
    }
  });
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  resize(); requestFrame(); notify();

  const loadStarted = performance.now();
  const loader = new GLTFLoader();
  let parsedCount = 0;
  const loadDeadline = window.setTimeout(() => {
    if (disposed || ready) return;
    abort.abort(new Error('The map assets took too long to load. Retry this map.'));
    lost = true; stopLoop(); disposeSceneResources([], models.values()); models.clear();
    message = 'The map assets took too long to load. Retry this map.'; notify('error');
  }, 20_000);
  void Promise.allSettled(STRESS_ASSETS.map(async asset => {
    const started = performance.now();
    const response = await fetch(asset.url, { signal: abort.signal });
    if (!response.ok) throw new Error(`Could not load ${asset.id} (HTTP ${response.status}).`);
    const bytes = await response.arrayBuffer();
    if (abort.signal.aborted) throw abort.signal.reason;
    const model = await loader.parseAsync(bytes, asset.url.slice(0, asset.url.lastIndexOf('/') + 1));
    if (disposed || abort.signal.aborted) { disposeSceneResources([], [model]); return; }
    models.set(asset.id, model);
    source.metadata({ [`${asset.id}LoadMs`]: performance.now() - started });
    parsedCount++; message = `Loaded ${parsedCount} of ${STRESS_ASSETS.length} models…`; notify();
  })).then(results => {
    window.clearTimeout(loadDeadline);
    if (disposed || abort.signal.aborted) return;
    const failed = results.find(result => result.status === 'rejected');
    if (failed?.status === 'rejected') {
      abort.abort(); lost = true; stopLoop(); disposeSceneResources([], models.values()); models.clear();
      message = failed.reason instanceof Error ? failed.reason.message : 'The map assets could not load.'; notify('error'); return;
    }
    try {
      populate(25); ready = true; source.metadata({ readyMs: performance.now() - loadStarted });
      message = 'Seeded loop ready. Models animate at a target of 30 FPS.'; notify();
    } catch (error) {
      lost = true; stopLoop(); message = error instanceof Error ? error.message : 'The test map could not initialize.'; notify('error');
    }
  });

  return {
    setPreset(value) { if (!ready || disposed) return; cancelBenchmark('Load changed; partial benchmark retained.'); populate(value); message = `${value} movers and ${TOWER_COUNTS[value]} working towers.`; notify(); },
    setView(value) { if (disposed) return; cancelBenchmark('Camera changed; partial benchmark retained.'); view = value; cameraView(); source.breakCadence(); requestFrame(); notify(); },
    setPaused(value) { cancelBenchmark('Map paused; partial benchmark retained.'); paused = value; stopLoop(); requestFrame(); notify(); },
    reset() { if (!ready || disposed) return; cancelBenchmark('Map reset; partial benchmark retained.'); paused = false; populate(preset); lastFrame = 0; message = 'Seed and animation positions reset.'; notify(); },
    runBenchmark() {
      if (!ready || disposed || lost || document.hidden || timeline.active) return;
      setTrackingEnabled(true);
      if (!startRecording('Stress map benchmark', { owner: 'stress-map', fixture: FIXTURE_LABEL, seed: STRESS_SEED, targetFPS: 30,
        view: 'home', phases: BENCHMARK_PHASES, assetPopulationSetup: 'Population changes and first render excluded from steady samples; setup duration recorded in source metadata and fixture-setup events.', gpuTiming: false })) {
        message = 'Finish the current recording before starting a benchmark.'; notify(); return;
      }
      report = null; paused = false; view = 'home'; cameraView(); lastFrame = 0;
      try { timeline.start(performance.now()); requestFrame(); }
      catch (error) { finishBenchmark('failed', error instanceof Error ? error.message : 'Benchmark setup failed.'); }
    },
    cancelBenchmark,
    dispose() {
      if (disposed) return;
      cancelBenchmark('Left the stress map; partial benchmark retained.'); disposed = true; abort.abort();
      stopLoop(); window.clearTimeout(loadDeadline); observer.disconnect(); unsubscribeTracking();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      clearActors(actors); clearActors(towers);
      disposeSceneResources([scene], models.values()); models.clear();
      sun.shadow.map?.dispose(); renderer.renderLists.dispose(); renderer.dispose(); source.dispose();
    },
  };
}

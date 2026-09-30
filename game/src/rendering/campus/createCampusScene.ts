import * as THREE from 'three';
import { registerRendererDiagnostics, trackRendererPerformance } from '../diagnostics';
import type { PerformanceSource } from '../../diagnostics/types';
import { addPerformanceEvent } from '../../diagnostics/performance';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { CAMPUS_HOME_FOCUS, CAMPUS_HOME_PLACEMENTS } from '../../content/maps/campusHome';
import { createCampusCamera } from './camera';
import { createCampusBuildingInteraction } from './buildingInteraction';
import { createCampusCompanion } from './companion';
import { createCampusResidents } from './residents';
import { createCampusAmbient } from './ambient';
import { createCampusAtmosphere } from './atmosphere';
import { createCampusLifecycles } from './lifecycle';
import { loadCampusModels } from './loadModels';
import { disposeSceneResources } from './resources';
import type { CampusScene, CampusSceneOptions } from './types';

/** Construct the independent home presentation and complete its first draw before ready. */
export async function createCampusScene(canvas: HTMLCanvasElement, options: CampusSceneOptions): Promise<CampusScene> {
  if (options.signal.aborted) throw options.signal.reason ?? new DOMException('Campus loading was cancelled.', 'AbortError');
  let renderer: THREE.WebGLRenderer | undefined;
  let unregisterDiagnostics = () => {};
  let tracking: PerformanceSource | undefined;
  const constructionStarted = performance.now();
  let firstDraw = false;
  let sun: THREE.DirectionalLight | undefined;
  let controls: ReturnType<typeof createCampusCamera> | undefined;
  let buildings: ReturnType<typeof createCampusBuildingInteraction> | undefined;
  let companion: ReturnType<typeof createCampusCompanion> | undefined;
  let residents: ReturnType<typeof createCampusResidents> | undefined;
  let ambient: ReturnType<typeof createCampusAmbient> | undefined;
  let atmosphere: ReturnType<typeof createCampusAtmosphere> | undefined;
  let models: Map<string, GLTF> | undefined;
  let frame = 0;
  let lastFrame = 0;
  let disposed = false;
  let ready = false;
  let paused = options.paused;
  let reducedMotion = options.reducedMotion;
  let errorReported = false;
  const originalCursor = canvas.style.cursor;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-15, 15, 11, -11, .1, 220);
  const lifecycles = createCampusLifecycles();

  const reportError = (error: Error) => {
    if (disposed || options.signal.aborted || errorReported) return;
    errorReported = true;
    stopLoop();
    options.onError(error);
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    addPerformanceEvent('context-lost', 'Campus WebGL context lost');
    reportError(new Error('The campus graphics context was lost. Please retry or continue without 3D.'));
  };
  const stopLoop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    tracking?.breakCadence();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    ready = false;
    stopLoop();
    options.signal.removeEventListener('abort', dispose);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    controls?.dispose();
    canvas.style.cursor = originalCursor;
    buildings?.dispose();
    lifecycles.dispose();
    companion?.dispose();
    residents?.dispose();
    ambient?.dispose();
    atmosphere?.dispose();
    disposeSceneResources([scene], models?.values());
    sun?.shadow.dispose();
    scene.clear();
    unregisterDiagnostics();
    tracking?.dispose();
    renderer?.dispose();
  };
  const renderOnce = (start = tracking?.begin(), continuous = false, timestamp?: number) => {
    if (disposed || !renderer) return;
    try {
      atmosphere?.resize(canvas.clientWidth, canvas.clientHeight); buildings?.refresh();
      renderer.info.reset(); renderer.render(scene, camera);
      if (start !== undefined) tracking?.end(start, { continuous, ...(timestamp === undefined ? {} : { timestamp }) });
      if (!firstDraw) { firstDraw = true; tracking?.metadata({ readyMs: performance.now() - constructionStarted }); }
    }
    catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      if (!ready) throw error;
      reportError(error);
    }
  };
  const tick = (timestamp: number) => {
    frame = 0;
    if (disposed || paused || reducedMotion || errorReported) return;
    if (!lastFrame) lastFrame = timestamp;
    const elapsed = timestamp - lastFrame;
    if (elapsed >= 1000 / 30 - .2) {
      const started = tracking?.begin();
      lifecycles.update(Math.min(elapsed / 1000, .1));
      companion?.update(Math.min(elapsed / 1000, .1));
      residents?.update(Math.min(elapsed / 1000, .1));
      ambient?.update(Math.min(elapsed / 1000, .1));
      atmosphere?.update(Math.min(elapsed / 1000, .1));
      lastFrame = timestamp;
      renderOnce(started, true, timestamp);
    }
    if (!disposed && !paused && !reducedMotion && !errorReported) frame = requestAnimationFrame(tick);
  };
  const refreshLoop = () => {
    stopLoop();
    if (ready && !disposed && !paused && !reducedMotion && !errorReported) frame = requestAnimationFrame(tick);
  };

  canvas.addEventListener('webglcontextlost', onContextLost);
  options.signal.addEventListener('abort', dispose, { once: true });
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.info.autoReset = false;
    tracking = trackRendererPerformance('campus', renderer, () => ({ zoom: camera.zoom, position: camera.position.toArray(), ready, paused, reducedMotion }));
    tracking.metadata({ targetFPS: 30 });
    unregisterDiagnostics = registerRendererDiagnostics('campus', renderer, () => ({ zoom: camera.zoom, position: camera.position.toArray(), ready, paused, reducedMotion }));
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.add(new THREE.HemisphereLight(0xfff3df, 0x263248, 1.65));
    sun = new THREE.DirectionalLight(0xfff4e6, 2.1);
    // Keep the approved light direction across the forest and construction edges.
    sun.target.position.set(CAMPUS_HOME_FOCUS[0], 0, CAMPUS_HOME_FOCUS[2]);
    sun.position.copy(sun.target.position).add(new THREE.Vector3(-60, 138, 84));
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 85, bottom: -85, near: 1, far: 300 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = .08;
    sun.shadow.bias = -.0006;
    sun.shadow.radius = 3;
    scene.add(sun);
    scene.add(sun.target);
    const fill = new THREE.DirectionalLight(0xd3deee, .55);
    fill.position.set(10, 8, -15);
    scene.add(fill);
    const accent = new THREE.DirectionalLight(0xb99beb, .22);
    accent.position.set(-20, 9, -20);
    scene.add(accent);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x496579, opacity: .16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.65;
    ground.receiveShadow = true;
    scene.add(ground);

    const loads: Record<string, unknown>[] = [];
    models = await loadCampusModels(options.signal, options.onProgress, (asset, timings) => {
      loads.push({ id: asset.id, version: asset.version, revision: asset.revision, sha256: asset.sha256, bytes: asset.bytes, ...timings });
      tracking?.metadata({ assets: loads });
    });
    if (options.signal.aborted || disposed) throw options.signal.reason ?? new DOMException('Campus loading was cancelled.', 'AbortError');
    const campus = new THREE.Group();
    campus.name = 'Copilot campus';
    for (const placement of CAMPUS_HOME_PLACEMENTS) {
      const model = models.get(placement.id);
      if (!model) throw new Error(`The campus is missing ${placement.id}.`);
      const instance = model.scene.clone(true);
      instance.name = placement.id;
      instance.position.fromArray(placement.position);
      instance.rotation.y = placement.rotation;
      if (placement.tile) instance.userData.tile = placement.tile;
      if (placement.building) instance.userData.building = placement.building;
      campus.add(instance);
    }
    const island = new THREE.Group();
    island.name = 'Floating campus';
    island.add(campus);
    scene.add(island);
    const copilot = models.get('copilot_base');
    if (!copilot) throw new Error('The campus is missing Copilot v02.');
    companion = createCampusCompanion(copilot, lifecycles);
    island.add(companion.actor);
    residents = createCampusResidents(models, lifecycles);
    island.add(residents.group);
    ambient = createCampusAmbient(campus, models, residents.group, reducedMotion);
    island.add(ambient.group);
    island.traverse(object => {
      if (object instanceof THREE.Mesh && object !== ground && object.parent !== ambient?.group && object.parent?.name !== 'presentation_digital_resolve') {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    atmosphere = createCampusAtmosphere(island, reducedMotion);
    atmosphere.background.userData.interactionOverlay = true;
    scene.add(atmosphere.background);
    buildings = createCampusBuildingInteraction(scene, camera, canvas);
    controls = createCampusCamera(canvas, renderer, camera, renderOnce, options.onViewChange, reducedMotion, {
      hitAt: buildings.hitAt,
      focusAt: buildings.focusAt,
      onHover: (building, point) => {
        buildings?.setHovered(building);
        canvas.style.cursor = building ? 'pointer' : originalCursor;
        const rect = point ? canvas.getBoundingClientRect() : null;
        options.onBuildingHover?.(building, rect && point ? {
          x: THREE.MathUtils.clamp(point.x - rect.left + 14, 8, Math.max(8, rect.width - 148)),
          y: Math.max(36, point.y - rect.top - 8),
        } : undefined);
        renderOnce();
      },
      onActivate: building => options.onBuildingActivate?.(building),
    });
    if (options.signal.aborted || disposed) throw options.signal.reason ?? new DOMException('Campus loading was cancelled.', 'AbortError');
    ready = true;
    refreshLoop();
    return {
      selectView: controls.selectView,
      zoomBy: controls.zoomBy,
      resetView: controls.resetView,
      resize: controls.resize,
      setPaused(value) { paused = value; refreshLoop(); },
      setInteractionEnabled(value) {
        buildings?.setEnabled(value);
        controls?.setInteractionEnabled(value);
        if (!value) { canvas.style.cursor = originalCursor; options.onBuildingHover?.(null); }
        renderOnce();
      },
      setBuildingFocus(value) { buildings?.setFocused(value); renderOnce(); },
      playBuildingReveal: () => controls?.playBuildingReveal() ?? Promise.resolve(true),
      playBuildingReturn: () => controls?.playBuildingReturn() ?? Promise.resolve(true),
      restoreBuildingReveal: () => controls?.restoreBuildingReveal(),
      setReducedMotion(value) {
        reducedMotion = value;
        if (value) { lifecycles.reset(); companion?.update(0); residents?.update(0); }
        controls?.setReducedMotion(value); ambient?.setReducedMotion(value); atmosphere?.setReducedMotion(value); renderOnce(); refreshLoop();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}

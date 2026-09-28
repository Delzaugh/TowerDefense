import type { CampusBuildingId, CampusScene, CampusSceneFactory, CampusView, CampusViewState } from '../../rendering/campus/types';
import type { HomeStatus } from '../home/homeTypes';

interface MotionSettings { readonly paused: boolean; readonly reducedMotion: boolean; readonly interactionEnabled?: boolean }
interface BootOptions {
  readonly loadFactory: () => Promise<CampusSceneFactory>;
  readonly settings: MotionSettings;
  readonly onViewChange: (state: CampusViewState) => void;
  readonly onBuildingActivate?: (building: CampusBuildingId) => void;
  readonly onBuildingHover?: (building: CampusBuildingId | null, point?: { readonly x: number; readonly y: number }) => void;
  readonly timeoutMs?: number;
}

/** Owns an attempt, not a frame loop. Abandoned async work can never install a scene. */
export function createHomeBoot(canvas: HTMLCanvasElement, options: BootOptions) {
  let snapshot: HomeStatus = Object.freeze({ phase: 'loading', loaded: 0, total: 0, message: 'Opening the campus…' });
  let generation = 0;
  let controller: AbortController | null = null;
  let scene: CampusScene | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let settings = options.settings;
  let focusedBuilding: CampusBuildingId | null = null;
  const listeners = new Set<() => void>();
  const publish = (value: HomeStatus) => {
    if (disposed) return;
    snapshot = Object.freeze(value);
    for (const listener of listeners) listener();
  };
  const clearTimer = () => { if (timeout !== null) clearTimeout(timeout); timeout = null; };
  const cancel = () => {
    generation++;
    clearTimer();
    controller?.abort(); controller = null;
    const previous = scene; scene = null;
    previous?.dispose();
  };
  const current = (attempt: number) => !disposed && attempt === generation;
  const fail = (attempt: number, message: string, reloadRequired = false) => {
    if (!current(attempt)) return;
    cancel();
    publish({ phase: 'error', loaded: snapshot.loaded, total: snapshot.total, message, ...(reloadRequired ? { reloadRequired: true } : {}) });
  };
  async function start() {
    if (disposed) return;
    cancel();
    const attempt = generation;
    const abort = new AbortController(); controller = abort;
    publish({ phase: 'loading', loaded: 0, total: 0, message: 'Opening the campus…' });
    timeout = setTimeout(() => fail(attempt, 'The campus is taking longer than expected to load. Check your connection and try again.'), options.timeoutMs ?? 30_000);
    let factory: CampusSceneFactory;
    try { factory = await options.loadFactory(); }
    catch { fail(attempt, 'Part of the application could not be downloaded. Reload the app to try again.', true); return; }
    try {
      if (!current(attempt)) return;
      const candidate = await factory(canvas, {
        signal: abort.signal, ...settings,
        onProgress: ({ loaded, total }) => {
          if (!current(attempt)) return;
          publish({ phase: 'loading', loaded, total, message: loaded === total ? 'Preparing your campus…' : 'Loading your campus…' });
        },
        onViewChange: value => { if (current(attempt)) options.onViewChange(value); },
        onBuildingActivate: building => { if (current(attempt) && settings.interactionEnabled !== false) options.onBuildingActivate?.(building); },
        onBuildingHover: (building, point) => {
          if (current(attempt) && (building === null || settings.interactionEnabled !== false)) options.onBuildingHover?.(building, point);
        },
        onError: () => fail(attempt, 'The campus view was interrupted. Try loading it again, or continue without 3D.'),
      });
      if (!current(attempt)) { candidate.dispose(); return; }
      scene = candidate;
      scene.setReducedMotion(settings.reducedMotion);
      scene.setPaused(settings.paused);
      scene.setInteractionEnabled?.(settings.interactionEnabled !== false);
      scene.setBuildingFocus?.(focusedBuilding);
      clearTimer();
      publish({ phase: 'ready', loaded: snapshot.total, total: snapshot.total, message: 'Welcome to your campus.' });
    } catch {
      fail(attempt, 'We couldn’t open the 3D campus. Check your connection, then try again. You can also continue without 3D.');
    }
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { if (disposed) return () => undefined; listeners.add(listener); return () => { listeners.delete(listener); }; },
    start,
    fallback() {
      if (disposed) return;
      cancel(); publish({ phase: 'fallback', loaded: 0, total: 0, message: 'Home is available without the 3D campus.', ...(snapshot.reloadRequired ? { reloadRequired: true } : {}) });
    },
    setSettings(value: MotionSettings) { settings = value; scene?.setReducedMotion(value.reducedMotion); scene?.setPaused(value.paused); scene?.setInteractionEnabled?.(value.interactionEnabled !== false); },
    setBuildingFocus(building: CampusBuildingId | null) { focusedBuilding = building; scene?.setBuildingFocus?.(building); },
    playBuildingReveal: () => scene?.playBuildingReveal?.() ?? Promise.resolve(true),
    playBuildingReturn: () => scene?.playBuildingReturn?.() ?? Promise.resolve(true),
    restoreBuildingReveal: () => scene?.restoreBuildingReveal?.(),
    selectView: (view: CampusView) => scene?.selectView(view),
    zoomBy: (factor: number) => scene?.zoomBy(factor),
    resetView: () => scene?.resetView(),
    resize: () => scene?.resize(),
    dispose() { if (disposed) return; disposed = true; cancel(); listeners.clear(); },
  };
}
export type HomeBoot = ReturnType<typeof createHomeBoot>;

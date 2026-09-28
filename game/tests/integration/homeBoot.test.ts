import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHomeBoot } from '../../src/app/boot/createHomeBoot';
import type { CampusScene, CampusSceneFactory, CampusSceneOptions } from '../../src/rendering/campus/types';
import { resolveAppRoute } from '../../src/app/routes';
import { defaultHomePreferences, HOME_PREFERENCES_KEY, readHomePreferences, saveHomePreferences } from '../../src/persistence/homePreferences';

function scene(): CampusScene {
  return { selectView: vi.fn(), zoomBy: vi.fn(), resetView: vi.fn(), setPaused: vi.fn(),
    setReducedMotion: vi.fn(), setInteractionEnabled: vi.fn(), setBuildingFocus: vi.fn(),
    playBuildingReveal: vi.fn().mockResolvedValue(true), playBuildingReturn: vi.fn().mockResolvedValue(true),
    restoreBuildingReveal: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const canvas = {} as HTMLCanvasElement;
const settings = { paused: false, reducedMotion: false };
afterEach(() => { vi.useRealTimers(); });

describe('home boot ownership', () => {
  it('offers a full reload after an unavailable renderer module', async () => {
    const boot = createHomeBoot(canvas, { loadFactory: async () => { throw new Error('module download failed'); }, settings, onViewChange: vi.fn() });
    await boot.start(); expect(boot.getSnapshot()).toMatchObject({ phase: 'error', reloadRequired: true });
    boot.dispose();
  });
  it('publishes actual asset progress and only becomes ready after scene construction', async () => {
    const candidate = scene(); const pending = deferred<CampusScene>();
    let options!: CampusSceneOptions;
    const factory: CampusSceneFactory = (_, received) => { options = received; return pending.promise; };
    const boot = createHomeBoot(canvas, { loadFactory: async () => factory, settings, onViewChange: vi.fn() });
    const changed = vi.fn(); boot.subscribe(changed);
    const finished = boot.start(); await Promise.resolve();
    options.onProgress({ loaded: 7, total: 26 });
    expect(boot.getSnapshot()).toMatchObject({ phase: 'loading', loaded: 7, total: 26 });
    options.onProgress({ loaded: 26, total: 26 });
    expect(boot.getSnapshot().phase).toBe('loading');
    pending.resolve(candidate); await finished;
    expect(boot.getSnapshot()).toMatchObject({ phase: 'ready', loaded: 26 });
    expect(changed).toHaveBeenCalled();
    boot.selectView('top'); boot.zoomBy(1.2); boot.resetView(); boot.resize();
    expect(candidate.selectView).toHaveBeenCalledWith('top');
    expect(candidate.zoomBy).toHaveBeenCalledWith(1.2);
    expect(candidate.resetView).toHaveBeenCalledOnce(); expect(candidate.resize).toHaveBeenCalledOnce();
    boot.dispose(); boot.dispose();
    expect(options.signal.aborted).toBe(true); expect(candidate.dispose).toHaveBeenCalledOnce();
  });

  it('disposes stale completions and ignores their callbacks after retry', async () => {
    const loads = [deferred<CampusScene>(), deferred<CampusScene>()]; const options: CampusSceneOptions[] = [];
    const factory: CampusSceneFactory = (_, received) => { options.push(received); return loads[options.length - 1]!.promise; };
    const view = vi.fn(); const boot = createHomeBoot(canvas, { loadFactory: async () => factory, settings, onViewChange: view });
    const first = boot.start(); await Promise.resolve();
    const second = boot.start(); await Promise.resolve();
    expect(options[0]!.signal.aborted).toBe(true);
    const current = scene(); loads[1]!.resolve(current); await second;
    options[0]!.onError(new Error('late')); options[0]!.onProgress({ loaded: 1, total: 2 }); options[0]!.onViewChange({ view: 'top', zoom: 8 });
    const stale = scene(); loads[0]!.resolve(stale); await first;
    expect(stale.dispose).toHaveBeenCalledOnce(); expect(current.dispose).not.toHaveBeenCalled();
    expect(boot.getSnapshot().phase).toBe('ready'); expect(view).not.toHaveBeenCalled();
    boot.dispose();
  });

  it('does not construct a scene when its module finishes after disposal', async () => {
    const imported = deferred<CampusSceneFactory>(); const factory = vi.fn(async () => scene());
    const boot = createHomeBoot(canvas, { loadFactory: () => imported.promise, settings, onViewChange: vi.fn() });
    const finished = boot.start(); boot.dispose(); imported.resolve(factory); await finished;
    expect(factory).not.toHaveBeenCalled();
  });

  it('turns a load failure into recovery and can retry successfully', async () => {
    const candidate = scene(); const factory = vi.fn<CampusSceneFactory>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(candidate);
    const boot = createHomeBoot(canvas, { loadFactory: async () => factory, settings, onViewChange: vi.fn() });
    await boot.start(); expect(boot.getSnapshot().phase).toBe('error');
    await boot.start(); expect(boot.getSnapshot().phase).toBe('ready'); boot.dispose();
  });

  it('times out, aborts and disposes a late result without leaving the error state', async () => {
    vi.useFakeTimers(); const pending = deferred<CampusScene>(); let signal!: AbortSignal;
    const boot = createHomeBoot(canvas, { loadFactory: async () => (_, options) => { signal = options.signal; return pending.promise; }, settings, onViewChange: vi.fn(), timeoutMs: 200 });
    const finished = boot.start(); await Promise.resolve(); await vi.advanceTimersByTimeAsync(201);
    expect(boot.getSnapshot().phase).toBe('error'); expect(signal.aborted).toBe(true);
    const candidate = scene(); pending.resolve(candidate); await finished;
    expect(candidate.dispose).toHaveBeenCalledOnce(); expect(boot.getSnapshot().phase).toBe('error'); boot.dispose();
  });

  it('fallback cancels pending work and still permits a fresh retry', async () => {
    const pending = deferred<CampusScene>(); const candidate = scene();
    const factory = vi.fn<CampusSceneFactory>().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(candidate);
    const boot = createHomeBoot(canvas, { loadFactory: async () => factory, settings, onViewChange: vi.fn() });
    const first = boot.start(); await Promise.resolve(); boot.fallback();
    expect(boot.getSnapshot().phase).toBe('fallback');
    const late = scene(); pending.resolve(late); await first; expect(late.dispose).toHaveBeenCalledOnce();
    await boot.start(); expect(boot.getSnapshot().phase).toBe('ready'); boot.dispose();
  });

  it('applies settings changed during loading and cleans up after a runtime error', async () => {
    const pending = deferred<CampusScene>(); const candidate = scene(); let options!: CampusSceneOptions;
    const boot = createHomeBoot(canvas, { loadFactory: async () => (_, value) => { options = value; return pending.promise; }, settings, onViewChange: vi.fn() });
    const finished = boot.start(); await Promise.resolve(); boot.setSettings({ paused: true, reducedMotion: true });
    pending.resolve(candidate); await finished;
    expect(candidate.setPaused).toHaveBeenLastCalledWith(true); expect(candidate.setReducedMotion).toHaveBeenLastCalledWith(true);
    options.onError(new Error('context lost')); expect(boot.getSnapshot().phase).toBe('error');
    expect(candidate.dispose).toHaveBeenCalledOnce(); boot.dispose(); expect(candidate.dispose).toHaveBeenCalledOnce();
  });

  it('blocks building activation while suspended and ignores callbacks from an abandoned scene', async () => {
    const activates = vi.fn();
    const options: CampusSceneOptions[] = [];
    const candidates = [scene(), scene()];
    let index = 0;
    const boot = createHomeBoot(canvas, {
      loadFactory: async () => async (_, value) => { options.push(value); return candidates[index++]!; },
      settings: { paused: false, reducedMotion: false, interactionEnabled: true },
      onViewChange: vi.fn(), onBuildingActivate: activates,
    });
    await boot.start();
    options[0]!.onBuildingActivate?.('copilot-lab');
    expect(activates).toHaveBeenCalledOnce();
    boot.setSettings({ paused: true, reducedMotion: false, interactionEnabled: false });
    expect(candidates[0]!.setInteractionEnabled).toHaveBeenLastCalledWith(false);
    options[0]!.onBuildingActivate?.('copilot-lab');
    expect(activates).toHaveBeenCalledOnce();
    await boot.start();
    options[0]!.onBuildingActivate?.('copilot-lab');
    expect(activates).toHaveBeenCalledOnce();
    boot.setSettings({ paused: false, reducedMotion: false, interactionEnabled: true });
    boot.setBuildingFocus('copilot-lab');
    expect(candidates[1]!.setBuildingFocus).toHaveBeenCalledWith('copilot-lab');
    options[1]!.onBuildingActivate?.('copilot-lab');
    expect(activates).toHaveBeenCalledTimes(2);
    boot.dispose();
  });

  it('forwards reveal and exact restore to the active scene, with immediate fallback entry', async () => {
    const candidate = scene();
    const boot = createHomeBoot(canvas, { loadFactory: async () => async () => candidate,
      settings, onViewChange: vi.fn() });
    expect(await boot.playBuildingReveal()).toBe(true);
    expect(await boot.playBuildingReturn()).toBe(true);
    await boot.start();
    expect(await boot.playBuildingReveal()).toBe(true);
    expect(await boot.playBuildingReturn()).toBe(true);
    expect(candidate.playBuildingReveal).toHaveBeenCalledOnce();
    expect(candidate.playBuildingReturn).toHaveBeenCalledOnce();
    boot.restoreBuildingReveal();
    expect(candidate.restoreBuildingReveal).toHaveBeenCalledOnce();
    boot.dispose();
  });
});

describe('home settings and routes', () => {
  it.each([
    ['/', 'home'], ['/#/', 'home'], ['/?lab=encounter', 'lab'], ['/?fixture=fragile', 'lab'],
    ['/?preset=fragile#/lab', 'lab'], ['/?lab=encounter#/', 'home'], ['/TowerDefense/#/lab', 'lab'], ['/#/unknown', 'not-found'],
  ])('resolves %s as %s', (url, expected) => { expect(resolveAppRoute('https://example.test' + url)).toBe(expected); });

  it('reads and writes only the separate versioned home record', () => {
    const values = new Map<string, string>([['tower-prototype-settings', 'untouched']]);
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(readHomePreferences(() => storage).preferences).toEqual(defaultHomePreferences);
    expect(saveHomePreferences(() => storage, { ambience: false, reducedMotion: true })).toBe('');
    expect(readHomePreferences(() => storage).preferences).toEqual({ ambience: false, reducedMotion: true });
    expect(values.get('tower-prototype-settings')).toBe('untouched'); expect(values.size).toBe(2);
    expect(JSON.parse(values.get(HOME_PREFERENCES_KEY)!)).toEqual({ version: 1, ambience: false, reducedMotion: true });
  });

  it.each(['{', 'null', '{"version":2,"ambience":false,"reducedMotion":true}', '{"version":1,"ambience":"false","reducedMotion":false}'])('ignores invalid preferences %s', json => {
    expect(readHomePreferences(() => ({ getItem: () => json, setItem: vi.fn() })).preferences).toEqual(defaultHomePreferences);
  });

  it('storage access and writes can fail without preventing local controls', () => {
    const unavailable = () => { throw new Error('denied'); };
    expect(readHomePreferences(unavailable)).toMatchObject({ preferences: defaultHomePreferences, notice: expect.stringContaining('this visit') });
    expect(saveHomePreferences(unavailable, { ambience: false, reducedMotion: true })).toContain('this visit');
  });
});

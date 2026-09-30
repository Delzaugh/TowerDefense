import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameWindow } from '../../src/diagnostics/frameWindow';
import type { PerformanceFrame } from '../../src/diagnostics/types';

let clock = 10;
let tracker: typeof import('../../src/diagnostics/performance');
beforeEach(async () => {
  vi.resetModules();
  clock = 10;
  vi.spyOn(performance, 'now').mockImplementation(() => clock);
  tracker = await import('../../src/diagnostics/performance');
});
afterEach(() => { tracker.setTrackingEnabled(false); vi.unstubAllGlobals(); });

const frame = (atMs: number): PerformanceFrame => ({ atMs, cpuMs: 1, intervalMs: 10, steps: 1,
  calls: 2, triangles: 3, overloaded: false, stages: {}, reason: 'test' });
function browser(stored: string | null = null) {
  const storage = { getItem: vi.fn(() => stored), setItem: vi.fn() };
  const target = Object.assign(new EventTarget(), { localStorage: storage });
  const page = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('window', target); vi.stubGlobal('document', page);
  vi.stubGlobal('location', { href: 'http://localhost/#/' });
  vi.stubGlobal('innerWidth', 1440); vi.stubGlobal('innerHeight', 900); vi.stubGlobal('devicePixelRatio', 1);
  vi.stubGlobal('navigator', { userAgent: 'test', hardwareConcurrency: 4 });
  vi.stubGlobal('PerformanceObserver', undefined);
  return { storage, target, page };
}

describe('bounded performance recording', () => {
  it('keeps frame order after multiple ring wraps and identifies dropped samples', () => {
    const window = new FrameWindow(3);
    for (let i = 0; i < 8; i++) window.push(frame(i));
    expect(window.values().map(item => item.atMs)).toEqual([5, 6, 7]);
    expect(window.dropped).toBe(5);
  });

  it('does no frame sampling while tracking is off', () => {
    const snapshot = vi.fn(() => ({ calls: 50 }));
    const source = tracker.registerPerformanceSource('campus', 'renderer', snapshot);
    expect(tracker.getTrackingEnabled()).toBe(false);
    source.end(source.begin(), { continuous: true });
    expect(tracker.getPerformanceSnapshot().streams[0]?.samples).toBe(0);
    expect(snapshot).not.toHaveBeenCalled();
    expect(tracker.startRecording('disabled')).toBe(false);
    source.dispose();
  });

  it('excludes demand draws and cadence breaks from continuous intervals', () => {
    tracker.setTrackingEnabled(true);
    const source = tracker.registerPerformanceSource('campus', 'renderer', () => ({ calls: 12, triangles: 24 }));
    for (const timestamp of [100, 133, 166]) {
      clock = timestamp; const start = source.begin(); clock += 2;
      source.end(start, { timestamp, continuous: true });
    }
    source.breakCadence(); clock = 5000; source.end(source.begin());
    clock = 6000; source.end(source.begin(), { timestamp: 6000, continuous: true });
    const summary = tracker.getPerformanceSnapshot({ raw: true }).streams[0]!;
    expect(summary.frameIntervalMs).toEqual({ p50: 33, p95: 33, p99: 33, max: 33 });
    expect(summary.fps).toBeCloseTo(1000 / 33);
    expect(summary.rawSamples.map(item => item.intervalMs)).toEqual([null, 33, 33, null, null]);
    source.dispose();
  });

  it('preserves a whole capture and its phases when resetting live samples', () => {
    tracker.setTrackingEnabled(true);
    const source = tracker.registerPerformanceSource('encounter', 'simulation', () => ({ state: { tick: 5 } }));
    expect(tracker.startRecording('real encounter')).toBe(true);
    expect(tracker.startRecording('duplicate')).toBe(false);
    tracker.beginPerformancePhase('baseline');
    clock = 20; const start = source.begin(); clock = 25;
    source.end(start, { steps: 2, stages: { simulation: 3, publication: 2 } });
    tracker.resetLiveSamples();
    expect(tracker.getPerformanceSnapshot().streams[0]?.samples).toBe(1);
    tracker.beginPerformancePhase('wave');
    clock = 40; source.end(source.begin(), { steps: 3, overloaded: true });
    const result = tracker.stopRecording()!;
    expect(result.status).toBe('completed');
    expect(result.phases.map(phase => phase.name)).toEqual(['baseline', 'wave']);
    expect(result.streams[0]?.steps).toBe(5);
    expect(result.streams[0]?.overloads).toBe(1);
    expect(result.streams[0]?.rawSamples).toHaveLength(2);
    expect(result.streams[0]?.stageCpuMs.simulation?.p95).toBe(3);
    expect(tracker.getPerformanceSnapshot().status).toBe('live');
    source.dispose();
  });

  it('disposes a source without leaving a callable scene reference', () => {
    tracker.setTrackingEnabled(true);
    const snapshot = vi.fn(() => ({ calls: 2 }));
    const source = tracker.registerPerformanceSource('showcase', 'renderer', snapshot);
    source.end(source.begin()); source.dispose(); snapshot.mockClear();
    const report = tracker.getPerformanceSnapshot();
    expect(report.streams[0]?.active).toBe(false);
    expect(snapshot).not.toHaveBeenCalled();
    source.end(0); expect(report.streams[0]?.samples).toBe(1);
  });

  it('freezes phase and final resource state while later frames keep changing', () => {
    tracker.setTrackingEnabled(true);
    const state = { movers: 25 };
    const assets = [{ id: 'example', loadMs: 1 }];
    const configuration = { nested: { seed: 42 } };
    const source = tracker.registerPerformanceSource('stress', 'renderer', () => ({ state }));
    source.metadata({ assets }); tracker.startRecording('immutable', configuration);
    tracker.beginPerformancePhase('baseline'); source.end(source.begin());
    tracker.endPerformancePhase(); state.movers = 200; assets[0]!.loadMs = 2; configuration.nested.seed = 0;
    const result = tracker.stopRecording()!;
    state.movers = 500; assets[0]!.loadMs = 3;
    expect(result.phases[0]!.streams[0]!.metrics.state).toEqual({ movers: 25 });
    expect(result.phases[0]!.streams[0]!.metadata.assets).toEqual([{ id: 'example', loadMs: 1 }]);
    expect(result.streams[0]!.metrics.state).toEqual({ movers: 200 });
    expect(result.streams[0]!.metadata.assets).toEqual([{ id: 'example', loadMs: 2 }]);
    expect(result.configuration).toEqual({ nested: { seed: 42 } });
    source.dispose();
  });

  it('cancels captures and tears down the browser registry when tracking is disabled', () => {
    browser(); tracker.setTrackingEnabled(true);
    const source = tracker.registerPerformanceSource('campus', 'renderer', () => ({}));
    tracker.startRecording('disable test'); source.end(source.begin());
    expect(window.__TOWER_PERFORMANCE__).toBeDefined();
    tracker.setTrackingEnabled(false);
    expect(window.__TOWER_PERFORMANCE__).toBeUndefined();
    const result = tracker.stopRecording()!;
    expect(result.status).toBe('cancelled'); expect(result.streams[0]?.samples).toBe(1);
    expect(tracker.getPerformanceSnapshot().streams[0]?.samples).toBe(0);
    source.dispose();
  });

  it('loads the persisted setting and interrupts partial captures on visibility changes', () => {
    const { page } = browser('{"version":1,"enabled":true}');
    expect(tracker.getTrackingEnabled()).toBe(true);
    tracker.startRecording('hidden test');
    page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
    const result = tracker.stopRecording()!;
    expect(result.status).toBe('cancelled');
    expect(result.events.some(event => event.type === 'visibility')).toBe(true);
    expect(result.support).toEqual({ longTasks: false, longAnimationFrames: false, gpuTiming: false });
  });

  it('retains a usable setting when browser storage rejects persistence', () => {
    const { storage } = browser();
    storage.setItem.mockImplementation(() => { throw new Error('unavailable'); });
    tracker.setTrackingEnabled(true);
    expect(tracker.getTrackingEnabled()).toBe(true);
    expect(tracker.getTrackingNotice()).toContain('this visit');
  });
});

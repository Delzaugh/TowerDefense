import { FrameWindow, distribution } from './frameWindow';
import type { PerformanceEvent, PerformanceFrame, PerformanceMetrics, PerformancePhase, PerformanceReport,
  PerformanceSource, PerformanceSourceKind, PerformanceStreamSummary } from './types';

const STORAGE_KEY = 'tower.performance.preferences.v1';
const LIVE_CAPACITY = 900;
const RECORD_CAPACITY = 18_000;
const MAX_EVENTS = 500;
const MAX_PHASES = 64;
type Stream = {
  name: string; kind: PerformanceSourceKind; active: boolean;
  sample: (() => PerformanceMetrics) | null; latest: PerformanceMetrics;
  metadata: Record<string, unknown>; window: FrameWindow | null; last: number | null;
};
type Capture = {
  label: string; started: number; startedAt: string; configuration: Record<string, unknown>;
  streams: Map<string, FrameWindow>; phases: PerformancePhase[];
  phase: { name: string; started: number; streams: Map<string, FrameWindow> } | null;
  longTasks: { count: number; durationMs: number }; longAnimationFrames: { count: number; durationMs: number };
  events: PerformanceEvent[]; droppedEvents: number;
};
const sources = new Map<string, Stream>();
const listeners = new Set<() => void>();
let initialized = false;
let enabled = false;
let notice = '';
let liveStarted = 0;
let liveStartedAt = '';
let capture: Capture | null = null;
let lastReport: PerformanceReport | null = null;
let buildIdentity: unknown = null;
let buildRequested = false;
let observers: PerformanceObserver[] = [];
let cleanupObservers: (() => void) | null = null;
let support = { longTasks: false, longAnimationFrames: false, gpuTiming: false as const };
let liveLongTasks = { count: 0, durationMs: 0 };
let liveLoafs = { count: 0, durationMs: 0 };
let events: PerformanceEvent[] = [];
let droppedEvents = 0;
const now = () => performance.now();
const announce = () => { for (const listener of listeners) listener(); };

function init() {
  if (initialized) return;
  initialized = true;
  liveStarted = now(); liveStartedAt = new Date().toISOString();
  if (typeof window === 'undefined') return;
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    enabled = typeof stored === 'object' && stored !== null && 'version' in stored && stored.version === 1 &&
      'enabled' in stored && stored.enabled === true;
  } catch { notice = 'Performance settings apply for this visit; browser storage is unavailable.'; }
  if (enabled) observe();
}

function observe() {
  if (typeof window === 'undefined' || cleanupObservers) return;
  const entryTypes = typeof PerformanceObserver === 'undefined' ? [] : PerformanceObserver.supportedEntryTypes;
  support = { longTasks: entryTypes.includes('longtask'), longAnimationFrames: entryTypes.includes('long-animation-frame'), gpuTiming: false };
  for (const type of ['longtask', 'long-animation-frame'] as const) {
    if (!entryTypes.includes(type)) continue;
    try {
      const observer = new PerformanceObserver(list => collectObserverEntries(list.getEntries()));
      observer.observe({ type, buffered: false }); observers.push(observer);
    } catch { if (type === 'longtask') support.longTasks = false; else support.longAnimationFrames = false; }
  }
  const visibility = () => {
    for (const source of sources.values()) source.last = null;
    addPerformanceEvent('visibility', document.hidden ? 'Page hidden' : 'Page visible');
    if (document.hidden && capture) stopRecording('cancelled', 'Page hidden during recording.');
  };
  const resize = () => {
    for (const source of sources.values()) source.last = null;
    addPerformanceEvent('resize', 'Viewport changed');
    if (capture) stopRecording('cancelled', 'Viewport changed during recording.');
  };
  const error = (event: ErrorEvent) => addPerformanceEvent('error', event.message || 'Resource or script error');
  const reject = (event: PromiseRejectionEvent) => addPerformanceEvent('error', String(event.reason));
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('resize', resize); window.addEventListener('error', error);
  window.addEventListener('unhandledrejection', reject);
  window.__TOWER_PERFORMANCE__ = { snapshot: getPerformanceSnapshot };
  cleanupObservers = () => {
    for (const observer of observers) observer.disconnect(); observers = [];
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('resize', resize); window.removeEventListener('error', error);
    window.removeEventListener('unhandledrejection', reject);
    delete window.__TOWER_PERFORMANCE__;
  };
  if (!buildRequested && import.meta.env?.PROD) {
    buildRequested = true;
    void fetch(`${import.meta.env.BASE_URL}performance-build.json`).then(response => response.ok ? response.json() : null)
      .then(value => { buildIdentity = value; }).catch(() => { /* A report still works without a build inventory. */ });
  }
}

function collectObserverEntries(entries: PerformanceEntry[]) {
  for (const entry of entries) {
    if (!enabled) continue;
    const isTask = entry.entryType === 'longtask';
    if (entry.startTime >= liveStarted) {
      const target = isTask ? liveLongTasks : liveLoafs;
      target.count++; target.durationMs += entry.duration;
    }
    if (capture && entry.startTime >= capture.started) {
      const recorded = isTask ? capture.longTasks : capture.longAnimationFrames;
      recorded.count++; recorded.durationMs += entry.duration;
    }
  }
}

export function getTrackingEnabled() { init(); return enabled; }
export function getTrackingNotice() { init(); return notice; }
export function subscribeTracking(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setTrackingEnabled(value: boolean) {
  init();
  if (value === enabled) return;
  if (!value && capture) stopRecording('cancelled', 'Performance tracking was disabled.');
  enabled = value;
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, enabled }));
    notice = '';
  } catch { notice = 'Performance settings apply for this visit; browser storage is unavailable.'; }
  if (enabled) { resetLiveSamples(); observe(); }
  else {
    cleanupObservers?.(); cleanupObservers = null;
    for (const source of sources.values()) { source.window = null; source.last = null; }
  }
  announce();
}

export function addPerformanceEvent(type: string, message: string) {
  if (!getTrackingEnabled()) return;
  const event = { atMs: now(), type, message: message.slice(0, 2_000) };
  events.push(event); if (events.length > MAX_EVENTS) { events.shift(); droppedEvents++; }
  if (capture) {
    capture.events.push(event);
    if (capture.events.length > MAX_EVENTS) { capture.events.shift(); capture.droppedEvents++; }
  }
}

function sampleSource(source: Stream) {
  try { if (source.sample) source.latest = source.sample(); }
  catch { /* Disposal cannot prevent exporting an already collected report. */ }
  return source.latest;
}

export function registerPerformanceSource(name: string, kind: PerformanceSourceKind, sample: () => PerformanceMetrics): PerformanceSource {
  init();
  const source: Stream = { name, kind, active: true, sample, latest: {}, metadata: {}, window: null, last: null };
  sources.set(name, source);
  return {
    begin: () => getTrackingEnabled() && source.active ? now() : undefined,
    end(start, options = {}) {
      if (start === undefined || !enabled || !source.active) return;
      const ended = now();
      const stamp = options.timestamp ?? ended;
      const intervalMs = options.continuous && source.last !== null && stamp > source.last ? stamp - source.last : null;
      source.last = options.continuous ? stamp : null;
      const metrics = sampleSource(source);
      const frame: PerformanceFrame = { atMs: ended, cpuMs: Math.max(0, ended - start), intervalMs,
        steps: options.steps ?? 0, overloaded: options.overloaded ?? false,
        calls: metrics.calls ?? null, triangles: metrics.triangles ?? null,
        stages: options.stages ?? {}, reason: options.reason ?? (options.continuous ? 'animation' : 'demand') };
      (source.window ??= new FrameWindow(LIVE_CAPACITY)).push(frame);
      if (capture) {
        const window = capture.streams.get(name) ?? new FrameWindow(RECORD_CAPACITY);
        capture.streams.set(name, window); window.push(frame);
        if (capture.phase) {
          const phaseWindow = capture.phase.streams.get(name) ?? new FrameWindow(RECORD_CAPACITY);
          capture.phase.streams.set(name, phaseWindow); phaseWindow.push(frame);
        }
      }
    },
    breakCadence() { source.last = null; },
    metadata(value) { source.metadata = { ...source.metadata, ...value }; },
    dispose() {
      if (!source.active) return;
      if (enabled) sampleSource(source);
      source.active = false; source.sample = null; source.last = null;
    },
  };
}

function summarize(source: Stream, window: FrameWindow | null, raw: boolean): PerformanceStreamSummary {
  const frames = window?.values() ?? [];
  const intervals = frames.flatMap(frame => frame.intervalMs === null ? [] : [frame.intervalMs]);
  const mean = intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  const stageNames = new Set(frames.flatMap(frame => Object.keys(frame.stages)));
  return { name: source.name, kind: source.kind, active: source.active, samples: frames.length,
    droppedSamples: window?.dropped ?? 0,
    sampledDurationMs: frames.length > 1 ? frames.at(-1)!.atMs - frames[0]!.atMs : 0,
    fps: mean ? 1000 / mean : null, frameIntervalMs: distribution(intervals),
    cpuMs: distribution(frames.map(frame => frame.cpuMs)),
    calls: distribution(frames.flatMap(frame => frame.calls === null ? [] : [frame.calls])),
    triangles: distribution(frames.flatMap(frame => frame.triangles === null ? [] : [frame.triangles])),
    steps: frames.reduce((sum, frame) => sum + frame.steps, 0), overloads: frames.filter(frame => frame.overloaded).length,
    framesOver50ms: intervals.filter(interval => interval > 50).length,
    framesOver100ms: intervals.filter(interval => interval > 100).length,
    stageCpuMs: Object.fromEntries([...stageNames].map(name => [name, distribution(frames.flatMap(frame => frame.stages[name] === undefined ? [] : [frame.stages[name]!]))!])),
    metrics: enabled ? sampleSource(source) : source.latest, metadata: { ...source.metadata },
    rawSamples: raw ? frames.map(frame => ({ ...frame, stages: { ...frame.stages } })) : [] };
}

function environment(): Record<string, unknown> {
  return { mode: import.meta.env?.MODE ?? 'test', build: buildIdentity,
    ...(typeof window !== 'undefined' ? { url: location.href, width: innerWidth, height: innerHeight,
      devicePixelRatio: devicePixelRatio, userAgent: navigator.userAgent, logicalProcessors: navigator.hardwareConcurrency } : {}) };
}

function report(recorded: Capture | null, raw: boolean): PerformanceReport {
  const start = recorded?.started ?? liveStarted;
  return { schemaVersion: 2, application: 'tower-game', status: recorded ? 'recording' : 'live',
    label: recorded?.label ?? 'Live performance', startedAt: recorded?.startedAt ?? liveStartedAt,
    finishedAt: null, durationMs: now() - start, configuration: recorded?.configuration ?? {}, environment: environment(), support: { ...support },
    longTasks: { ...(recorded?.longTasks ?? liveLongTasks) }, longAnimationFrames: { ...(recorded?.longAnimationFrames ?? liveLoafs) },
    streams: [...sources.values()].map(source => summarize(source, recorded ? recorded.streams.get(source.name) ?? null : source.window, raw)),
    phases: recorded?.phases.map(phase => ({ ...phase, streams: phase.streams.map(stream => ({ ...stream, rawSamples: raw ? stream.rawSamples : [] })) })) ?? [],
    events: [...(recorded?.events ?? events)], droppedEvents: recorded?.droppedEvents ?? droppedEvents,
    notes: ['CPU work includes JavaScript updates and WebGL submission; GPU execution time is not measured.',
      'Renderer counters include shadow and presentation passes. Resource counts are not VRAM bytes.',
      'Animation cadence is measured only for continuous samples; demand-driven frames do not imply an FPS target.',
      'Frame and event atMs timestamps use the performance time origin. Sample statistics describe the retained bounded window.',
      'Live windows retain 900 samples per source; captures retain up to 18000 per source and phase. Dropped counts are explicit.',
      'Physical device performance cannot be inferred from viewport emulation.'] };
}

export function getPerformanceSnapshot(options: { raw?: boolean } = {}): PerformanceReport {
  init(); return report(capture, options.raw ?? false);
}
export function startRecording(label: string, configuration: Record<string, unknown> = {}) {
  if (!getTrackingEnabled() || capture) return false;
  capture = { label, started: now(), startedAt: new Date().toISOString(), configuration: structuredClone(configuration), streams: new Map(), phases: [], phase: null,
    longTasks: { count: 0, durationMs: 0 }, longAnimationFrames: { count: 0, durationMs: 0 }, events: [], droppedEvents: 0 };
  for (const source of sources.values()) source.last = null;
  announce(); return true;
}
export function beginPerformancePhase(name: string) {
  if (!capture) return;
  endPerformancePhase();
  if (capture.phases.length >= MAX_PHASES) { addPerformanceEvent('limit', 'Phase limit reached; recording stopped.'); stopRecording('cancelled', 'Phase limit reached.'); return; }
  capture.phase = { name, started: now(), streams: new Map() };
  for (const source of sources.values()) source.last = null;
}
export function endPerformancePhase(): PerformancePhase | null {
  if (!capture?.phase) return null;
  const phase = capture.phase;
  const result = structuredClone({ name: phase.name, durationMs: now() - phase.started,
    streams: [...sources.values()].filter(source => phase.streams.has(source.name)).map(source => summarize(source, phase.streams.get(source.name)!, true)) });
  capture.phases.push(result); capture.phase = null; return result;
}
export function stopRecording(status: 'completed' | 'cancelled' | 'failed' = 'completed', reason?: string): PerformanceReport | null {
  if (!capture) return lastReport;
  for (const observer of observers) collectObserverEntries(observer.takeRecords());
  if (reason) addPerformanceEvent(status, reason);
  endPerformancePhase();
  lastReport = structuredClone({ ...report(capture, true), status, finishedAt: new Date().toISOString() });
  capture = null; announce(); return lastReport;
}
export function resetLiveSamples() {
  init(); liveStarted = now(); liveStartedAt = new Date().toISOString();
  for (const source of sources.values()) { source.window = null; source.last = null; }
  liveLongTasks = { count: 0, durationMs: 0 }; liveLoafs = { count: 0, durationMs: 0 }; events = []; droppedEvents = 0;
}
export function downloadPerformanceReport(value?: PerformanceReport) {
  const result = value ?? (capture ? getPerformanceSnapshot({ raw: true }) : lastReport ?? getPerformanceSnapshot({ raw: true }));
  const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url;
  anchor.download = `tower-performance-${result.startedAt.replace(/[:.]/g, '-')}.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

declare global { interface Window { __TOWER_PERFORMANCE__?: { snapshot(options?: { raw?: boolean }): PerformanceReport } } }

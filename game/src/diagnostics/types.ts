export type PerformanceSourceKind = 'renderer' | 'simulation';
export interface Distribution { p50: number; p95: number; p99: number; max: number }
export interface PerformanceMetrics {
  calls?: number; triangles?: number; geometries?: number; textures?: number; programs?: number;
  pixelRatio?: number; bufferWidth?: number; bufferHeight?: number;
  state?: unknown;
}
export interface PerformanceFrameOptions {
  timestamp?: number;
  continuous?: boolean;
  stages?: Record<string, number>;
  steps?: number;
  overloaded?: boolean;
  reason?: string;
}
export interface PerformanceFrame {
  atMs: number; cpuMs: number; intervalMs: number | null; steps: number;
  calls: number | null; triangles: number | null; overloaded: boolean;
  stages: Record<string, number>; reason: string;
}
export interface PerformanceStreamSummary {
  name: string; kind: PerformanceSourceKind; active: boolean; samples: number; droppedSamples: number;
  sampledDurationMs: number; fps: number | null; frameIntervalMs: Distribution | null; cpuMs: Distribution | null;
  calls: Distribution | null; triangles: Distribution | null;
  steps: number; overloads: number; framesOver50ms: number; framesOver100ms: number;
  stageCpuMs: Record<string, Distribution>;
  metrics: PerformanceMetrics; metadata: Record<string, unknown>; rawSamples: PerformanceFrame[];
}
export interface PerformanceEvent { atMs: number; type: string; message: string }
export interface PerformancePhase {
  name: string; durationMs: number; streams: PerformanceStreamSummary[];
}
export interface PerformanceReport {
  schemaVersion: 2; application: 'tower-game'; status: 'live' | 'recording' | 'completed' | 'cancelled' | 'failed';
  label: string; startedAt: string; finishedAt: string | null; durationMs: number;
  configuration: Record<string, unknown>; environment: Record<string, unknown>;
  support: { longTasks: boolean; longAnimationFrames: boolean; gpuTiming: false };
  longTasks: { count: number; durationMs: number }; longAnimationFrames: { count: number; durationMs: number };
  streams: PerformanceStreamSummary[]; phases: PerformancePhase[]; events: PerformanceEvent[];
  droppedEvents: number; notes: string[];
}
export interface PerformanceSource {
  begin(): number | undefined;
  end(start: number | undefined, options?: PerformanceFrameOptions): void;
  breakCadence(): void;
  metadata(value: Record<string, unknown>): void;
  dispose(): void;
}

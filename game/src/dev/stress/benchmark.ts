import type { StressPreset } from './layout';

export const BENCHMARK_PHASES = [
  { name: 'warmup', movers: 200, durationMs: 3000 },
  { name: 'baseline-25', movers: 25, durationMs: 5000 },
  { name: 'load-50', movers: 50, durationMs: 7000 },
  { name: 'load-100', movers: 100, durationMs: 7000 },
  { name: 'load-200', movers: 200, durationMs: 7000 },
  { name: 'recovery-25', movers: 25, durationMs: 5000 },
] as const satisfies readonly { name: string; movers: StressPreset; durationMs: number }[];
export const BENCHMARK_DURATION_MS = BENCHMARK_PHASES.reduce((sum, phase) => sum + phase.durationMs, 0);
export type BenchmarkPhase = typeof BENCHMARK_PHASES[number];

/** Monotonic wall time drives phases; a slow device does not extend the workload. */
export function createBenchmarkTimeline(onPhase: (phase: BenchmarkPhase) => void, onComplete: () => void) {
  let active = false, phaseIndex = 0, phaseStarted = 0;
  return {
    start(now: number) { active = true; phaseIndex = 0; phaseStarted = now; onPhase(BENCHMARK_PHASES[0]); },
    advance(now: number) {
      if (!active || now - phaseStarted < BENCHMARK_PHASES[phaseIndex]!.durationMs) return;
      phaseIndex += 1;
      if (phaseIndex === BENCHMARK_PHASES.length) { active = false; onComplete(); return; }
      phaseStarted = now;
      onPhase(BENCHMARK_PHASES[phaseIndex]!);
    },
    cancel() { active = false; },
    get active() { return active; },
  };
}

import { describe, expect, it } from 'vitest';
import { BENCHMARK_DURATION_MS, BENCHMARK_PHASES, createBenchmarkTimeline } from '../../src/dev/stress/benchmark';
import { PATH_LENGTH, pathPose, seededRandom, STRESS_PRESETS, TOWER_COUNTS } from '../../src/dev/stress/layout';
import { resolveAppRoute } from '../../src/app/routes';

describe('removable stress map', () => {
  it('allows the explicit route only when its compiled fixture is enabled', () => {
    expect(resolveAppRoute('https://example.test/TowerDefense/#/stress', true)).toBe('stress');
    expect(resolveAppRoute('https://example.test/TowerDefense/#/stress', false)).toBe('not-found');
    expect(resolveAppRoute('https://example.test/?preset=fragile#/', false)).toBe('home');
  });
  it('keeps the route closed and reproducible without frame allocations', () => {
    const start = { x: 0, z: 0, heading: 0 }, end = { x: 0, z: 0, heading: 0 };
    pathPose(0, .1, start); pathPose(PATH_LENGTH, .1, end);
    expect(end).toEqual(start);
    pathPose(-10, 0, start); pathPose(PATH_LENGTH - 10, 0, end);
    expect(end).toEqual(start);
    const first = seededRandom(), second = seededRandom();
    expect(Array.from({ length: 20 }, first)).toEqual(Array.from({ length: 20 }, second));
    expect(STRESS_PRESETS.map(preset => TOWER_COUNTS[preset])).toEqual([4, 6, 8, 12]);
  });
  it('records ordered wall-time warmup, baseline, loads and recovery then ends once', () => {
    const phases: string[] = [];
    let completed = 0;
    const timeline = createBenchmarkTimeline(phase => phases.push(phase.name), () => completed++);
    let time = 100;
    timeline.start(time);
    for (const phase of BENCHMARK_PHASES) {
      timeline.advance(time + phase.durationMs - 1);
      expect(completed).toBe(0);
      time += phase.durationMs;
      timeline.advance(time);
    }
    expect(phases).toEqual(BENCHMARK_PHASES.map(phase => phase.name));
    expect(BENCHMARK_DURATION_MS).toBe(34000);
    expect(timeline.active).toBe(false);
    timeline.advance(time + 5000);
    expect(completed).toBe(1);
  });
  it('cancels before the next phase and permits a clean new benchmark', () => {
    const phases: string[] = [];
    const timeline = createBenchmarkTimeline(phase => phases.push(phase.name), () => { throw new Error('Unexpected completion'); });
    timeline.start(0); timeline.cancel(); timeline.advance(10000);
    expect(phases).toEqual(['warmup']);
    timeline.start(10000); timeline.advance(13000);
    expect(phases).toEqual(['warmup', 'warmup', 'baseline-25']);
  });
});

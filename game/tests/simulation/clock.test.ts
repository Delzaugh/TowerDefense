import { describe, expect, it } from 'vitest';
import { createFixedStepClock } from '../../src/session/fixedStepClock';

describe('fixed-step scheduling', () => {
  const run = (frames: number[], speed: 1 | 2) => {
    const clock = createFixedStepClock();
    let ticks = 0;
    for (const time of frames) clock.advance(time, speed, () => { ticks++; return true; });
    return ticks;
  };
  it('gives identical ticks for different frame partitions', () => {
    const sixty = Array.from({ length: 61 }, (_, index) => index * 1000 / 60);
    const irregular = [0, 3, 50, 99, 183, 201, 320, 450, 503, 689, 750, 910, 1000];
    expect(run(sixty, 1)).toBe(60);
    expect(run(irregular, 1)).toBe(60);
    expect(run(irregular, 2)).toBe(120);
  });
  it('does not catch up after a large interruption or clock reversal', () => {
    const clock = createFixedStepClock(); let ticks = 0;
    const step = () => { ticks++; return true; };
    clock.advance(0, 1, step);
    expect(clock.advance(30_000, 1, step).overloaded).toBe(true);
    expect(ticks).toBe(0);
    expect(clock.advance(29_000, 1, step).overloaded).toBe(true);
    clock.reset(); clock.advance(100_000, 1, step); clock.advance(100_100, 1, step);
    expect(ticks).toBe(6);
  });
  it('stops stepping when the core declines advancement', () => {
    const clock = createFixedStepClock();
    clock.advance(0, 1, () => true);
    let calls = 0;
    const result = clock.advance(100, 1, () => ++calls < 3);
    expect(result.steps).toBe(2);
    expect(result.alpha).toBe(0);
    expect(calls).toBe(3);
  });
});

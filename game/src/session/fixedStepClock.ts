import { TICKS_PER_SECOND } from '../simulation/state';

export const STEP_MS = 1000 / TICKS_PER_SECOND;
export const MAX_FRAME_MS = 250;
const MAX_STEPS = 30;

/** Converts wall time into fixed steps. Large gaps require an explicit pause. */
export function createFixedStepClock() {
  let previous: number | null = null;
  let accumulator = 0;
  return {
    reset() { previous = null; accumulator = 0; },
    advance(timestamp: number, speed: 1 | 2, step: () => boolean) {
      if (!Number.isFinite(timestamp) || timestamp < 0) throw new Error('Invalid frame timestamp.');
      if (previous === null) { previous = timestamp; return { steps: 0, alpha: 0, overloaded: false }; }
      const elapsed = timestamp - previous;
      previous = timestamp;
      if (elapsed < 0 || elapsed > MAX_FRAME_MS) {
        accumulator = 0;
        return { steps: 0, alpha: 0, overloaded: true };
      }
      accumulator += elapsed * speed;
      const pending = Math.floor((accumulator + 1e-8) / STEP_MS);
      if (pending > MAX_STEPS) {
        accumulator = 0;
        return { steps: 0, alpha: 0, overloaded: true };
      }
      let steps = 0;
      while (steps < pending) {
        if (!step()) { accumulator = 0; break; }
        accumulator = Math.max(0, accumulator - STEP_MS);
        steps++;
      }
      return { steps, alpha: Math.min(1, accumulator / STEP_MS), overloaded: false };
    },
  };
}

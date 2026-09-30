import type { Distribution, PerformanceFrame } from './types';

export function distribution(values: number[]): Distribution | null {
  if (!values.length) return null;
  const sorted = values.sort((a, b) => a - b);
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;
  return { p50: at(.5), p95: at(.95), p99: at(.99), max: sorted.at(-1)! };
}

/** Bounded samples. Statistics and duration always describe the same retained window. */
export class FrameWindow {
  private frames: PerformanceFrame[] = [];
  private next = 0;
  dropped = 0;
  constructor(private readonly capacity: number) {}
  push(frame: PerformanceFrame) {
    if (this.frames.length < this.capacity) this.frames.push(frame);
    else { this.frames[this.next] = frame; this.next = (this.next + 1) % this.capacity; this.dropped++; }
  }
  values() {
    return this.next ? [...this.frames.slice(this.next), ...this.frames.slice(0, this.next)] : [...this.frames];
  }
}

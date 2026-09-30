export const STRESS_SEED = 73421;
export const STRESS_PRESETS = [25, 50, 100, 200] as const;
export type StressPreset = typeof STRESS_PRESETS[number];
export type StressView = 'home' | 'top';
export const TOWER_COUNTS: Record<StressPreset, number> = { 25: 4, 50: 6, 100: 8, 200: 12 };
export const PATH_POINTS = [
  [-16, -9], [16, -9], [16, -3], [-13, -3], [-13, 3], [16, 3], [16, 9], [-16, 9], [-16, -9],
] as const;
const segments = PATH_POINTS.slice(1).map((point, index) => {
  const start = PATH_POINTS[index]!;
  const dx = point[0] - start[0], dz = point[1] - start[1];
  return { x: start[0], z: start[1], dx, dz, length: Math.hypot(dx, dz) };
});
export const PATH_LENGTH = segments.reduce((sum, segment) => sum + segment.length, 0);
export interface PathPose { x: number; z: number; heading: number }
/** Writes to the caller's reusable pose; hot frames need no new vectors. */
export function pathPose(distance: number, lateral: number, pose: PathPose): void {
  let remaining = ((distance % PATH_LENGTH) + PATH_LENGTH) % PATH_LENGTH;
  for (const segment of segments) {
    if (remaining > segment.length) { remaining -= segment.length; continue; }
    const fraction = remaining / segment.length;
    pose.x = segment.x + segment.dx * fraction + segment.dz / segment.length * lateral;
    pose.z = segment.z + segment.dz * fraction - segment.dx / segment.length * lateral;
    pose.heading = Math.atan2(segment.dx, segment.dz);
    return;
  }
}
export function seededRandom(seed = STRESS_SEED): () => number {
  let value = seed >>> 0;
  return () => { value = Math.imul(1664525, value) + 1013904223 >>> 0; return value / 4294967296; };
}
export const TOWER_POSITIONS = [
  [-11, -6], [-5, -6], [2, -6], [10, -6], [-9, 0], [-3, 0], [4, 0], [11, 0],
  [-11, 6], [-5, 6], [2, 6], [10, 6],
] as const;

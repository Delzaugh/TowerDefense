import type { Point } from '../content/schemas/scenario';

/** Logical +X toward +Z, stable tenths of a degree. Near-center gestures have no aim. */
export function facingToward(origin: Point, pointer: Point): number | null {
  const dx = pointer.x - origin.x, dz = pointer.z - origin.z;
  if (!Number.isFinite(dx) || !Number.isFinite(dz) || Math.hypot(dx, dz) < 0.2) return null;
  return (Math.round(((Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360) * 10) / 10) % 360;
}

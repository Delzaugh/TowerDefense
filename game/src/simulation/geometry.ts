import type { Point, Rectangle } from '../content/schemas/scenario';

export const GEOMETRY_EPSILON = 1e-7;
export const MARKER_RADIUS = 0.4;

export function containsPoint(rectangle: Rectangle, point: Point, inset = 0): boolean {
  return point.x >= rectangle.min.x + inset && point.x <= rectangle.max.x - inset
    && point.z >= rectangle.min.z + inset && point.z <= rectangle.max.z - inset;
}

// Inclusive boundaries: touching a prohibited footprint is not valid placement.
export function circleIntersectsRectangle(center: Point, radius: number, rectangle: Rectangle): boolean {
  const x = Math.max(rectangle.min.x, Math.min(center.x, rectangle.max.x));
  const z = Math.max(rectangle.min.z, Math.min(center.z, rectangle.max.z));
  return (center.x - x) ** 2 + (center.z - z) ** 2 <= radius ** 2 + GEOMETRY_EPSILON;
}

// A route is a chain of closed capsules. Tangency to its authored edge is blocked.
export function circleIntersectsPolyline(center: Point, radius: number, points: readonly Point[], width: number): boolean {
  const clearance = radius + width / 2;
  const clearanceSquared = clearance ** 2 + GEOMETRY_EPSILON;
  return points.slice(1).some((end, index) => {
    const start = points[index]!;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const lengthSquared = dx ** 2 + dz ** 2;
    const fraction = lengthSquared <= GEOMETRY_EPSILON
      ? 0
      : Math.max(0, Math.min(1, ((center.x - start.x) * dx + (center.z - start.z) * dz) / lengthSquared));
    const nearestX = start.x + dx * fraction;
    const nearestZ = start.z + dz * fraction;
    return (center.x - nearestX) ** 2 + (center.z - nearestZ) ** 2 <= clearanceSquared;
  });
}

// Slab intersection. Tangency and either endpoint inside a blocker count as blocked.
export function segmentIntersectsRectangle(start: Point, end: Point, rectangle: Rectangle): boolean {
  let near = 0;
  let far = 1;
  for (const axis of ['x', 'z'] as const) {
    const delta = end[axis] - start[axis];
    if (Math.abs(delta) <= GEOMETRY_EPSILON) {
      if (start[axis] < rectangle.min[axis] - GEOMETRY_EPSILON || start[axis] > rectangle.max[axis] + GEOMETRY_EPSILON) return false;
    } else {
      const first = (rectangle.min[axis] - start[axis]) / delta;
      const second = (rectangle.max[axis] - start[axis]) / delta;
      near = Math.max(near, Math.min(first, second));
      far = Math.min(far, Math.max(first, second));
      if (near > far + GEOMETRY_EPSILON) return false;
    }
  }
  return true;
}

export function compileRoute(points: readonly Point[]) {
  if (points.length < 2) throw new Error('A route needs at least two points.');
  const segments = points.slice(1).map((end, index) => {
    const start = points[index]!;
    const length = Math.hypot(end.x - start.x, end.z - start.z);
    if (!Number.isFinite(length) || length <= GEOMETRY_EPSILON) throw new Error('Invalid route segment.');
    return { start: { ...start }, end: { ...end }, length };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  return {
    totalLength,
    pointAt(progress: number): Point {
      if (!Number.isFinite(progress)) throw new Error('Progress must be finite.');
      let remaining = Math.max(0, Math.min(1, progress)) * totalLength;
      for (const segment of segments) {
        if (remaining <= segment.length) {
          const fraction = remaining / segment.length;
          return { x: segment.start.x + (segment.end.x - segment.start.x) * fraction, z: segment.start.z + (segment.end.z - segment.start.z) * fraction };
        }
        remaining -= segment.length;
      }
      return { ...segments[segments.length - 1]!.end };
    },
  };
}

import { describe, expect, it } from 'vitest';
import { circleIntersectsPolyline, circleIntersectsRectangle, compileRoute, containsPoint, segmentIntersectsRectangle } from '../../src/simulation/geometry';

const box = { min: { x: -1, z: -1 }, max: { x: 1, z: 1 } };
describe('logical geometry', () => {
  it('includes area boundaries and respects footprint inset', () => {
    expect(containsPoint(box, { x: 1, z: 0 })).toBe(true);
    expect(containsPoint(box, { x: 1, z: 0 }, 0.4)).toBe(false);
    expect(containsPoint(box, { x: 0.6, z: 0 }, 0.4)).toBe(true);
  });
  it('treats touching a prohibited footprint as blocked', () => {
    expect(circleIntersectsRectangle({ x: 1.4, z: 0 }, 0.4, box)).toBe(true);
    expect(circleIntersectsRectangle({ x: 1.5, z: 0 }, 0.4, box)).toBe(false);
    expect(circleIntersectsRectangle({ x: 0, z: 0 }, 0.4, box)).toBe(true);
  });
  it('uses the full circular footprint against route segments, corners and endpoints', () => {
    const points = [{ x: 0, z: 0 }, { x: 2, z: 0 }, { x: 2, z: 2 }];
    expect(circleIntersectsPolyline({ x: 1, z: 0 }, 0.4, points, 0.8)).toBe(true);
    expect(circleIntersectsPolyline({ x: 1, z: 0.8 }, 0.4, points, 0.8)).toBe(true);
    expect(circleIntersectsPolyline({ x: 1, z: 0.801 }, 0.4, points, 0.8)).toBe(false);
    expect(circleIntersectsPolyline({ x: 2.5, z: -0.5 }, 0.4, points, 0.8)).toBe(true);
    expect(circleIntersectsPolyline({ x: 2.6, z: -0.6 }, 0.4, points, 0.8)).toBe(false);
  });
  it.each([
    [{ x: -2, z: 0 }, { x: 2, z: 0 }, true],
    [{ x: -2, z: 1 }, { x: 2, z: 1 }, true],
    [{ x: -2, z: 2 }, { x: 2, z: 2 }, false],
    [{ x: 0, z: 0 }, { x: 0, z: 0 }, true],
    [{ x: 2, z: 0 }, { x: 2, z: 0 }, false],
    [{ x: 0, z: -2 }, { x: 0, z: 2 }, true],
    [{ x: -3, z: 0 }, { x: -2, z: 0 }, false],
  ] as const)('checks sight segments symmetrically', (start, end, blocked) => {
    expect(segmentIntersectsRectangle(start, end, box)).toBe(blocked);
    expect(segmentIntersectsRectangle(end, start, box)).toBe(blocked);
  });
  it('samples a polyline by total distance, not point count', () => {
    const route = compileRoute([{ x: 0, z: 0 }, { x: 3, z: 0 }, { x: 3, z: 1 }]);
    expect(route.totalLength).toBe(4);
    expect(route.pointAt(0.5)).toEqual({ x: 2, z: 0 });
    expect(route.pointAt(0.875)).toEqual({ x: 3, z: 0.5 });
    expect(route.pointAt(-1)).toEqual({ x: 0, z: 0 });
    expect(route.pointAt(2)).toEqual({ x: 3, z: 1 });
    expect(() => route.pointAt(NaN)).toThrow();
    expect(() => compileRoute([])).toThrow();
  });
});

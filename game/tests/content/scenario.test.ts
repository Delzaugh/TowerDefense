import { describe, expect, it } from 'vitest';
import { foundationProbe } from '../../src/content/definitions/foundationProbe';
import { canonicalJson, ValidationError } from '../../src/content/schemas/data';
import { parseScenario } from '../../src/content/schemas/scenario';

describe('scenario boundary', () => {
  it('detaches and freezes valid content', () => {
    const input = structuredClone(foundationProbe);
    const parsed = parseScenario(input);
    expect(parsed).toEqual(input);
    expect(parsed).not.toBe(input);
    expect(Object.isFrozen(parsed.map.routes[0]?.points[0])).toBe(true);
  });
  it.each([
    { durationTicks: 0 }, { durationTicks: 1.2 }, { durationTicks: NaN },
    { schemaVersion: 2 }, { routeId: 'absent' }, { id: 'Wrong ID' }, { unexpected: true },
  ])('rejects malformed content %j', change => {
    expect(() => parseScenario({ ...foundationProbe, ...change })).toThrow(ValidationError);
  });
  it('reports a useful path for a broken reference', () => {
    try { parseScenario({ ...foundationProbe, routeId: 'missing' }); throw new Error('Expected validation failure.'); }
    catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).issues[0]?.path).toBe('routeId');
    }
  });
  it('rejects duplicate IDs, zero-length segments and invalid rectangles', () => {
    const map = foundationProbe.map;
    expect(() => parseScenario({ ...foundationProbe, map: { ...map, routes: [map.routes[0], map.routes[0]] } })).toThrow('Duplicate');
    expect(() => parseScenario({ ...foundationProbe, map: { ...map, routes: [{ id: 'main_route', points: [{ x: 0, z: 0 }, { x: 0, z: 0 }] }] } })).toThrow('nonzero');
    expect(() => parseScenario({ ...foundationProbe, map: { ...map, buildable: { min: { x: 0, z: 0 }, max: { x: -1, z: 1 } } } })).toThrow('positive');
  });
  it('defaults legacy route width and rejects invalid authored widths', () => {
    const route = foundationProbe.map.routes[0]!;
    const legacyRoute = { id: route.id, points: route.points };
    expect(parseScenario({ ...foundationProbe, map: { ...foundationProbe.map, routes: [legacyRoute] } }).map.routes[0]!.width).toBe(0.8);
    for (const width of [0, -1, Infinity, 101]) {
      expect(() => parseScenario({ ...foundationProbe, map: { ...foundationProbe.map, routes: [{ ...route, width }] } })).toThrow();
    }
  });
  it('rejects infinite or oversized coordinates', () => {
    const map = foundationProbe.map;
    for (const x of [Infinity, -Infinity, NaN, 10001]) {
      expect(() => parseScenario({ ...foundationProbe, map: { ...map, routes: [{ id: 'main_route', points: [{ x, z: 0 }, { x: 1, z: 0 }] }] } })).toThrow();
    }
  });
  it('canonicalizes key order without weakening exact content identity', () => {
    expect(canonicalJson({ b: 2, a: { z: 3, x: 1 } })).toBe(canonicalJson({ a: { x: 1, z: 3 }, b: 2 }));
    expect(canonicalJson({ b: 3 })).not.toBe(canonicalJson({ b: 2 }));
    expect(() => canonicalJson(undefined)).toThrow();
    expect(() => canonicalJson(NaN)).toThrow();
  });
});

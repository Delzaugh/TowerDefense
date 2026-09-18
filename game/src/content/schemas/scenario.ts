import { z } from 'zod';
import { freezeData, identifierSchema, parseData, versionSchema } from './data';
import type { ReadonlyData } from './data';

const coordinateSchema = z.number().finite().min(-10_000).max(10_000);
export const pointSchema = z.strictObject({ x: coordinateSchema, z: coordinateSchema });
export type Point = ReadonlyData<z.infer<typeof pointSchema>>;
export const rectangleSchema = z.strictObject({ min: pointSchema, max: pointSchema }).refine(
  rectangle => rectangle.min.x < rectangle.max.x && rectangle.min.z < rectangle.max.z,
  'Rectangle must have positive width and depth.',
);
export type Rectangle = ReadonlyData<z.infer<typeof rectangleSchema>>;
export const routeSchema = z.strictObject({
  id: identifierSchema,
  // Logical path width is shared by placement and rendering. The default keeps
  // older standalone scenario inputs readable while authored maps stay explicit.
  width: z.number().finite().min(0.01).max(100).default(0.8),
  points: z.array(pointSchema).min(2).max(1024),
}).superRefine((route, context) => {
  route.points.forEach((point, index) => {
    const previous = route.points[index - 1];
    if (previous && Math.hypot(point.x - previous.x, point.z - previous.z) <= 1e-7) {
      context.addIssue({ code: 'custom', path: ['points', index], message: 'Route segment must have nonzero length.' });
    }
  });
});

export const mapSchema = z.strictObject({
  id: identifierSchema,
  version: versionSchema,
  buildable: rectangleSchema,
  routes: z.array(routeSchema).min(1).max(64),
  obstacles: z.array(z.strictObject({
    id: identifierSchema, footprint: rectangleSchema, blocksSight: z.boolean(),
  })).max(256),
}).superRefine((map, context) => {
  for (const key of ['routes', 'obstacles'] as const) {
    const ids = new Set<string>();
    map[key].forEach((item, index) => {
      if (ids.has(item.id)) context.addIssue({ code: 'custom', path: [key, index, 'id'], message: 'Duplicate identity.' });
      ids.add(item.id);
    });
  }
});

export const scenarioSchema = z.strictObject({
  schemaVersion: z.literal(1),
  id: identifierSchema,
  version: versionSchema,
  map: mapSchema,
  routeId: identifierSchema,
  durationTicks: z.number().int().min(1).max(216_000),
}).superRefine((scenario, context) => {
  if (!scenario.map.routes.some(route => route.id === scenario.routeId)) {
    context.addIssue({ code: 'custom', path: ['routeId'], message: 'Route reference does not exist in this map.' });
  }
});

export type Scenario = ReadonlyData<z.infer<typeof scenarioSchema>>;
export function parseScenario(value: unknown): Scenario { return freezeData(parseData(scenarioSchema, value)); }

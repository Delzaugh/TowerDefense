import { z } from 'zod';
import { counterSchema, identifierSchema, versionSchema } from '../content/schemas/data';
import type { ReadonlyData } from '../content/schemas/data';
import { pointSchema } from '../content/schemas/scenario';

export const TICKS_PER_SECOND = 60;
export const snapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  rulesVersion: z.literal(1),
  ticksPerSecond: z.literal(TICKS_PER_SECOND),
  scenarioId: identifierSchema,
  scenarioVersion: versionSchema,
  contentSignature: z.string().min(1).max(1_000_000),
  runId: identifierSchema,
  phase: z.enum(['preparation', 'running', 'complete']),
  paused: z.boolean(),
  speed: z.union([z.literal(1), z.literal(2)]),
  tick: counterSchema,
  commandSequence: counterSchema,
  eventSequence: counterSchema,
  marker: pointSchema.nullable(),
});
export type SimulationSnapshot = ReadonlyData<z.infer<typeof snapshotSchema>>;

export type SimulationEvent = ReadonlyData<{
  sequence: number;
  tick: number;
  type: 'started' | 'paused' | 'resumed' | 'speed_changed' | 'marker_placed' | 'route_completed';
}>;

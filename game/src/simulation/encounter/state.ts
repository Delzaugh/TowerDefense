import { z } from 'zod';
import { counterSchema, identifierSchema } from '../../content/schemas/data';
import type { ReadonlyData } from '../../content/schemas/data';
import { pointSchema } from '../../content/schemas/scenario';
import { towerStatOverridesSchema } from '../../content/schemas/towerStats';
import { modeSchema, prioritySchema, facingSchema, coverageKindSchema } from '../../content/schemas/towerConfiguration';
import { encounterCommandSchema } from './commandSchema';
export { modeSchema, prioritySchema, facingSchema, coverageKindSchema } from '../../content/schemas/towerConfiguration';

export const actionStateSchema = z.strictObject({
  mode: modeSchema, priority: prioritySchema,
  targetId: z.number().int().min(1).max(1000).nullable(),
  readyTick: z.number().int().min(0).max(219_600), commitmentUntil: z.number().int().min(0).max(219_600),
});
export const towerSchema = z.strictObject({
  id: z.number().int().min(1).max(100), definitionId: identifierSchema, position: pointSchema, facing: facingSchema, coverageKind: coverageKindSchema,
  statOverrides: towerStatOverridesSchema,
  placedTick: z.number().int().min(0).max(216_000), action: actionStateSchema.nullable(),
  upgrades: z.array(identifierSchema).max(16),
  activeEffects: z.array(z.strictObject({ effectId: identifierSchema, sourceId: identifierSchema,
    appliedTick: z.number().int().min(0).max(216_000), expiresTick: z.number().int().min(1).max(252_000) })).max(32),
});
export type Tower = z.infer<typeof towerSchema>;
export const outcomeSchema = z.strictObject({
  entityId: z.number().int().min(1).max(1000), tick: z.number().int().min(1).max(216_000),
  type: z.enum(['work_completed', 'problem_resolved', 'work_missed', 'problem_leaked']),
  compute: z.number().int().min(0).max(2_000_000), healing: z.number().int().min(0).max(1_000_000), damage: z.number().int().min(0).max(1_000_000),
});
export type Outcome = z.infer<typeof outcomeSchema>;

export const entitySchema = z.strictObject({
  id: z.number().int().min(1).max(1000), definitionId: identifierSchema, routeId: identifierSchema,
  kind: z.enum(['work', 'problem']), spawnedTick: z.number().int().min(1).max(36_001),
  distance: z.number().finite().min(0), remaining: z.number().int().positive().max(1_000_000),
  travelUnits: z.number().int().min(0).max(2_160_000_000),
});
export const encounterSnapshotSchema = z.strictObject({
  format: z.literal('tower.encounter.snapshot'), schemaVersion: z.literal(6), rulesVersion: z.literal(6), ticksPerSecond: z.literal(60),
  contentSignature: z.string().min(1).max(2_000_000), runId: identifierSchema,
  phase: z.enum(['preparation', 'active', 'drained', 'failed']), paused: z.boolean(), speed: z.union([z.literal(1), z.literal(2)]),
  tick: z.number().int().min(0).max(216_000), commandSequence: counterSchema, eventSequence: counterSchema,
  commandLog: z.array(z.strictObject({ tick: z.number().int().min(0).max(216_000), command: encounterCommandSchema })).max(10_000),
  spawnCursor: z.number().int().min(0).max(1000), nextEntityId: z.number().int().min(1).max(1001),
  entities: z.array(entitySchema).max(1000), productHealth: z.number().int().min(0).max(1_000_000),
  compute: z.number().int().min(0).max(2_001_000_000), debt: z.number().int().min(0).max(1000), productProgress: z.number().int().min(0).max(1000),
  nextTowerId: z.number().int().min(1).max(101), towers: z.array(towerSchema).max(100), outcomes: z.array(outcomeSchema).max(1000),
  totals: z.strictObject({ missedWork: z.number().int().min(0).max(1000), leakedProblems: z.number().int().min(0).max(1000), damageTaken: z.number().int().min(0).max(1_000_000_000),
    completedWork: z.number().int().min(0).max(1000), resolvedProblems: z.number().int().min(0).max(1000),
    computeEarned: z.number().int().min(0).max(2_000_000_000), computeSpent: z.number().int().min(0).max(1_700_000_000), healingReceived: z.number().int().min(0).max(1_000_000_000) }),
});
export type MutableSnapshot = z.infer<typeof encounterSnapshotSchema>;
export type Entity = z.infer<typeof entitySchema>;
export type EncounterSnapshot = ReadonlyData<MutableSnapshot>;
export type EventPayload =
  | { type: 'started' | 'paused' | 'resumed' | 'speed_changed' | 'wave_drained' | 'product_destroyed' }
  | { type: 'spawned'; entityId: number; kind: 'work' | 'problem' }
  | { type: 'work_missed'; entityId: number; debtAdded: 1 }
  | { type: 'problem_leaked'; entityId: number; damage: number };
export type TowerEventPayload =
  | { type: 'tower_placed' | 'tower_configured' | 'tower_upgraded' | 'effect_applied' | 'effect_removed'; towerId: number }
  | { type: 'target_changed'; towerId: number; targetId: number | null }
  | { type: 'tower_action'; towerId: number; entityId: number; amount: number }
  | { type: 'work_completed' | 'problem_resolved'; entityId: number; compute: number; healing: number };
export type EncounterEvent = ReadonlyData<(EventPayload | TowerEventPayload) & { sequence: number; tick: number }>;
export type Emit = (payload: EventPayload | TowerEventPayload) => EncounterEvent;



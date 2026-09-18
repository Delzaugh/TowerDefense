import { z } from 'zod';

import { facingSchema, modeSchema, prioritySchema, coverageKindSchema } from '../../content/schemas/towerConfiguration';
import { identifierSchema } from '../../content/schemas/data';
import { pointSchema } from '../../content/schemas/scenario';
import { towerStatOverridesSchema } from '../../content/schemas/towerStats';

export const encounterCommandSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('start') }), z.strictObject({ type: z.literal('pause') }),
  z.strictObject({ type: z.literal('resume') }),
  z.strictObject({ type: z.literal('set_speed'), speed: z.union([z.literal(1), z.literal(2)]) }),
  z.strictObject({ type: z.literal('place_tower'), definitionId: identifierSchema, position: pointSchema, facing: facingSchema }),
  z.strictObject({ type: z.literal('set_mode'), towerId: z.number().int().positive(), mode: modeSchema }),
  z.strictObject({ type: z.literal('set_priority'), towerId: z.number().int().positive(), priority: prioritySchema }),
  z.strictObject({ type: z.literal('set_facing'), towerId: z.number().int().positive(), facing: facingSchema }),
  z.strictObject({ type: z.literal('set_coverage'), towerId: z.number().int().positive(), coverageKind: coverageKindSchema }),
  z.strictObject({ type: z.literal('set_stats'), towerId: z.number().int().positive(), overrides: towerStatOverridesSchema }),
  z.strictObject({ type: z.literal('buy_upgrade'), towerId: z.number().int().positive(), upgradeId: identifierSchema }),
  z.strictObject({ type: z.literal('apply_effect'), towerId: z.number().int().positive(), effectId: identifierSchema, sourceId: identifierSchema }),
  z.strictObject({ type: z.literal('remove_effect'), towerId: z.number().int().positive(), effectId: identifierSchema, sourceId: identifierSchema }),
]);
export type EncounterCommand = z.infer<typeof encounterCommandSchema>;


import { z } from 'zod';
import { identifierSchema } from './data';

export const qaAuraSchema = z.strictObject({
  kind: z.literal('qa_aura'),
  slowPercent: z.number().finite().min(0).max(90),
  computeBonus: z.number().int().min(0).max(1_000_000),
  combination: z.strictObject({ slow: z.literal('strongest'), compute: z.literal('strongest') }),
});
export const modifierSchema = z.strictObject({
  stat: z.enum(['range', 'cooldownTicks', 'damagePerAction', 'workPerAction', 'commitmentTicks', 'qaSlowPercent', 'qaComputeBonus']),
  operation: z.enum(['add', 'multiply']), value: z.number().finite().min(-1_000_000).max(1_000_000),
}).superRefine((modifier, ctx) => {
  if (modifier.operation === 'multiply' && modifier.value < 0) ctx.addIssue({ code: 'custom', message: 'Multiplier must be nonnegative.' });
});
export const upgradeSchema = z.strictObject({
  id: identifierSchema, label: z.string().min(1).max(80), cost: z.number().int().min(0).max(1_000_000),
  operations: z.array(z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('modify'), modifiers: z.array(modifierSchema).min(1).max(16) }),
    z.strictObject({ kind: z.literal('add_ability'), ability: qaAuraSchema }),
  ])).min(1).max(8),
});
export const externalEffectSchema = z.strictObject({
  id: identifierSchema, label: z.string().min(1).max(80), durationTicks: z.number().int().min(1).max(36_000),
  modifiers: z.array(modifierSchema).min(1).max(16),
});
export type Modifier = z.infer<typeof modifierSchema>;

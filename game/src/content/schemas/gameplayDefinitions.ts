import { z } from 'zod';
import { identifierSchema } from './data';
import { placementStatsSchema, towerStatsSchema } from './towerStats';
import { modeSchema, prioritySchema } from './towerConfiguration';
import { qaAuraSchema, upgradeSchema, externalEffectSchema } from './abilities';

export const amountSchema = z.number().int().min(0).max(1_000_000);
const moving = { id: identifierSchema, speed: z.number().finite().min(0.1).max(100) };
export const gameplayDefinitionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...moving, kind: z.literal('work'), requiredWork: amountSchema.min(1), computeReward: amountSchema, healing: amountSchema }),
  z.strictObject({ ...moving, kind: z.literal('problem'), durability: amountSchema.min(1), severityDamage: amountSchema.min(1), computeReward: amountSchema }),
]);

export const coverageSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('area') }),
  z.strictObject({ kind: z.literal('cone'), angleDegrees: z.number().finite().positive().max(360) }),
]);

// Base target origin is the placed logical center; facing is +X toward +Z.
const towerCommon = {
  id: identifierSchema, label: z.string().min(1).max(80), family: z.enum(['copilot', 'human']),
  coverage: coverageSchema,
  coverageAlternatives: z.array(coverageSchema).max(1).optional(),
  placementLimit: z.number().int().min(1).max(100).optional(),
  canRotate: z.boolean(),
  abilities: z.array(qaAuraSchema).max(1),
  upgrades: z.array(upgradeSchema).max(16),
  externalEffects: z.array(externalEffectSchema).max(16),
  allowStatTuning: z.boolean().optional(),
};
export const towerDefinitionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ ...towerCommon, kind: z.literal('targeted'), baseStats: towerStatsSchema,
    capabilities: z.strictObject({ work: z.boolean(), problem: z.boolean() }),
    controls: z.strictObject({ modes: z.array(modeSchema).min(1).max(3), priorities: z.array(prioritySchema).min(1).max(2) }),
  }),
  z.strictObject({ ...towerCommon, kind: z.literal('passive'), baseStats: placementStatsSchema }),
]).superRefine((value, ctx) => {
  if (value.coverageAlternatives?.some(profile => profile.kind === value.coverage.kind)) ctx.addIssue({ code: 'custom', path: ['coverageAlternatives'], message: 'Alternative must use a different coverage kind.' });
  if (new Set(value.upgrades.map(item => item.id)).size !== value.upgrades.length || new Set(value.externalEffects.map(item => item.id)).size !== value.externalEffects.length) ctx.addIssue({ code: 'custom', message: 'Upgrade and effect IDs must be unique within their lists.' });
  const possibleAura = value.abilities.length > 0 || value.upgrades.some(upgrade => upgrade.operations.some(op => op.kind === 'add_ability'));
  const modifiers = [...value.externalEffects.flatMap(effect => effect.modifiers), ...value.upgrades.flatMap(upgrade => upgrade.operations.flatMap(op => op.kind === 'modify' ? op.modifiers : []))];
  if (modifiers.some(modifier => modifier.stat.startsWith('qa') ? !possibleAura : modifier.stat !== 'range' && value.kind !== 'targeted')) ctx.addIssue({ code: 'custom', message: 'Modifier references an unsupported stat or ability.' });
  if (value.kind === 'targeted') {
    if (!value.capabilities.work && !value.capabilities.problem) ctx.addIssue({ code: 'custom', message: 'Targeted actions need a capability.' });
    if (new Set(value.controls.modes).size !== value.controls.modes.length || new Set(value.controls.priorities).size !== value.controls.priorities.length) ctx.addIssue({ code: 'custom', message: 'Duplicate controls.' });
    if (value.controls.modes.some(mode => mode === 'build' && !value.capabilities.work || mode === 'defend' && !value.capabilities.problem)) ctx.addIssue({ code: 'custom', message: 'Mode requires its capability.' });
  }
});

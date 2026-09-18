import { z } from 'zod';

/** Gameplay units, not renderer units or percentages. All action timing is 60 Hz ticks. */
export const placementStatsSchema = z.strictObject({
  cost: z.number().int().min(0).max(1_000_000),
  footprintRadius: z.number().finite().positive().max(10),
  range: z.number().finite().positive().max(100),
});
export const towerStatsSchema = placementStatsSchema.extend({
  cooldownTicks: z.number().int().min(1).max(3600),
  damagePerAction: z.number().int().min(0).max(1_000_000),
  workPerAction: z.number().int().min(0).max(1_000_000),
  commitmentTicks: z.number().int().min(0).max(3600),
});
// Placement properties vary by type, but cannot be rewritten on a purchased tower.
export const towerStatOverridesSchema = towerStatsSchema.omit({ cost: true, footprintRadius: true }).partial().superRefine((value, ctx) => {
  if (Object.values(value).some(item => item === undefined)) ctx.addIssue({ code: 'custom', message: 'Omit unset overrides; explicit undefined is not a stat value.' });
});
export type TowerStats = z.infer<typeof towerStatsSchema>;
export type TowerStatOverrides = z.infer<typeof towerStatOverridesSchema>;

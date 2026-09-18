import { z } from 'zod';
import { freezeData, identifierSchema, parseData, versionSchema } from './data';
import type { ReadonlyData } from './data';
import { mapSchema } from './scenario';
import { amountSchema, towerDefinitionSchema, gameplayDefinitionSchema } from './gameplayDefinitions';

export const encounterSchema = z.strictObject({
  schemaVersion: z.literal(6), id: identifierSchema, version: versionSchema,
  map: mapSchema,
  product: z.strictObject({ maximumHealth: amountSchema.min(1), initialHealth: amountSchema.min(1) }),
  initialCompute: amountSchema,
  towerLimit: z.number().int().min(1).max(100).optional(),
  definitions: z.array(gameplayDefinitionSchema).min(1).max(100),
  towerDefinitions: z.array(towerDefinitionSchema).min(1).max(32),
  // Single authored wave in this batch; no implicit multi-wave or boss victory policy.
  wave: z.strictObject({ id: identifierSchema, spawns: z.array(z.strictObject({
    offsetTicks: z.number().int().min(0).max(36_000), definitionId: identifierSchema, routeId: identifierSchema,
  })).min(1).max(1000) }),
}).superRefine((value, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  if (value.product.initialHealth > value.product.maximumHealth) issue(['product', 'initialHealth'], 'Initial health exceeds maximum.');
  const ids = new Set<string>();
  const towerIds = new Set<string>();
  value.towerDefinitions.forEach((definition, index) => {
    if (towerIds.has(definition.id)) issue(['towerDefinitions', index, 'id'], 'Duplicate tower definition ID.');
    towerIds.add(definition.id);
  });
  value.definitions.forEach((definition, index) => {
    if (ids.has(definition.id)) issue(['definitions', index, 'id'], 'Duplicate definition ID.');
    ids.add(definition.id);
  });
  value.wave.spawns.forEach((spawn, index) => {
    if (!ids.has(spawn.definitionId)) issue(['wave', 'spawns', index, 'definitionId'], 'Unknown definition.');
    const route = value.map.routes.find(item => item.id === spawn.routeId);
    if (!route) issue(['wave', 'spawns', index, 'routeId'], 'Unknown route.');
    const definition = value.definitions.find(item => item.id === spawn.definitionId);
    if (route && definition) {
      const length = route.points.slice(1).reduce((total, point, i) => total + Math.hypot(point.x - route.points[i]!.x, point.z - route.points[i]!.z), 0);
      const hasSlow = value.towerDefinitions.some(tower => tower.abilities.length || tower.upgrades.some(upgrade => upgrade.operations.some(op => op.kind === 'add_ability')));
      if (spawn.offsetTicks + Math.ceil(length * 60 / definition.speed * (hasSlow && definition.kind === 'problem' ? 10 : 1)) > 216_000) issue(['wave', 'spawns', index], 'Fixture travel including the 90% slow bound must finish within 216000 ticks.');
    }
  });
});
export type EncounterContent = ReadonlyData<z.infer<typeof encounterSchema>>;
export function parseEncounter(value: unknown): EncounterContent { return freezeData(parseData(encounterSchema, value)); }

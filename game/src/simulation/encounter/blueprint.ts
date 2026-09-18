import { z } from 'zod';
import { freezeData, parseData } from '../../content/schemas/data';
import type { EncounterContent } from '../../content/schemas/encounter';
import { pointSchema } from '../../content/schemas/scenario';
import { towerSchema, actionStateSchema } from './state';
import type { EncounterSnapshot } from './state';
import { createEncounter } from './createEncounter';
import { markerRejection } from './diagnostics';

export const blueprintSchema = z.strictObject({
  towers: z.array(towerSchema.pick({ definitionId: true, position: true, facing: true, coverageKind: true, statOverrides: true, upgrades: true }).extend({
    action: actionStateSchema.pick({ mode: true, priority: true }).nullable(),
  })).max(100), marker: pointSchema.nullable(),
});
export type Blueprint = ReturnType<typeof captureBlueprint>;
export function captureBlueprint(snapshot: EncounterSnapshot, marker: unknown) {
  return freezeData(parseData(blueprintSchema, { marker, towers: snapshot.towers.map(tower => ({
    definitionId: tower.definitionId, position: tower.position, facing: tower.facing,
    coverageKind: tower.coverageKind, statOverrides: tower.statOverrides, upgrades: tower.upgrades,
    action: tower.action ? { mode: tower.action.mode, priority: tower.action.priority } : null,
  })) }));
}
/** Rebuild owned upgrades/configuration, with fresh clocks and no temporary effects. */
export function prepareBlueprint(content: EncounterContent, input: unknown, runId: string) {
  const blueprint = freezeData(parseData(blueprintSchema, input));
  if (blueprint.marker && markerRejection(content, blueprint.marker)) throw new Error('Starting marker is invalid.');
  const encounter = createEncounter(content, runId);
  for (const [index, tower] of blueprint.towers.entries()) {
    const definition = content.towerDefinitions.find(item => item.id === tower.definitionId);
    if (!definition || (definition.kind === 'targeted') !== (tower.action !== null)) throw new Error('Starting action does not match its definition.');
    const commands = [
      { type: 'place_tower', definitionId: tower.definitionId, position: tower.position, facing: tower.facing },
      { type: 'set_coverage', towerId: index + 1, coverageKind: tower.coverageKind },
      ...(tower.action ? [{ type: 'set_mode', towerId: index + 1, mode: tower.action.mode }, { type: 'set_priority', towerId: index + 1, priority: tower.action.priority }] : []),
      ...(Object.keys(tower.statOverrides).length ? [{ type: 'set_stats', towerId: index + 1, overrides: tower.statOverrides }] : []),
      ...tower.upgrades.map(upgradeId => ({ type: 'buy_upgrade', towerId: index + 1, upgradeId })),
    ];
    for (const command of commands) {
      const result = encounter.dispatch(command);
      if (!result.accepted) throw new Error(`Starting tower ${index + 1}: ${result.reason.replaceAll('_', ' ')}.`);
    }
  }
  return { encounter, blueprint };
}

import type { EncounterContent } from '../../content/schemas/encounter';
import { compileRoute } from '../geometry';
import type { Entity } from './state';

export function compileEncounter(content: EncounterContent) {
  const routes = new Map(content.map.routes.map(route => [route.id, compileRoute(route.points)]));
  const definitions = new Map(content.definitions.map(definition => [definition.id, definition]));
  const towers = new Map(content.towerDefinitions.map(definition => [definition.id, definition]));
  const schedule = content.wave.spawns.map((spawn, order) => ({ ...spawn, order }))
    .sort((a, b) => a.offsetTicks - b.offsetTicks || a.order - b.order)
    .map((spawn, index) => {
      const definition = definitions.get(spawn.definitionId)!;
      const route = routes.get(spawn.routeId)!;
      return { ...spawn, id: index + 1, definition, route };
    });
  return { schedule, routes, towers };
}
export type Compiled = ReturnType<typeof compileEncounter>;
export function makeEntity(item: Compiled['schedule'][number]): Entity {
  return { id: item.id, definitionId: item.definitionId, routeId: item.routeId, kind: item.definition.kind, spawnedTick: item.offsetTicks + 1, distance: 0, travelUnits: 0,
    remaining: item.definition.kind === 'work' ? item.definition.requiredWork : item.definition.durability };
}
export function entityPosition(compiled: Compiled, entity: Pick<Entity, 'routeId' | 'distance'>) {
  const route = compiled.routes.get(entity.routeId)!;
  return route.pointAt(entity.distance / route.totalLength);
}

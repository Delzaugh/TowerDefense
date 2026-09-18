import type { EncounterContent } from '../../content/schemas/encounter';
import type { Point } from '../../content/schemas/scenario';
import type { EncounterSnapshot } from './state';
import type { Rejection } from './commands';
import { circleIntersectsPolyline, circleIntersectsRectangle, containsPoint, GEOMETRY_EPSILON } from '../geometry';
import { resolveTowerStats } from './stats';

export function placementRejection(content: EncounterContent, state: Pick<EncounterSnapshot, 'phase' | 'paused' | 'towers' | 'compute'>, definitionId: string, position: Point): Rejection | null {
  if (state.paused) return 'paused';
  if (state.phase !== 'active' && state.phase !== 'preparation') return 'wrong_phase';
  const definition = content.towerDefinitions.find(item => item.id === definitionId);
  if (!definition) return 'unknown_definition';
  const stats = resolveTowerStats(definition);
  if (state.towers.length >= (content.towerLimit ?? 100)) return 'tower_limit';
  if (definition.placementLimit !== undefined && state.towers.filter(tower => tower.definitionId === definitionId).length >= definition.placementLimit) return 'type_limit';
  if (!Number.isFinite(position.x) || !Number.isFinite(position.z)) return 'invalid_command';
  if (!containsPoint(content.map.buildable, position, stats.footprintRadius)) return 'outside_buildable';
  // Tower placement rejects logical routes. Other placeable kinds can deliberately
  // choose their own surface policy instead of gaining an implicit tower bypass.
  if (content.map.routes.some(route => circleIntersectsPolyline(position, stats.footprintRadius, route.points, route.width))) return 'path_blocked';
  if (content.map.obstacles.some(item => circleIntersectsRectangle(position, stats.footprintRadius, item.footprint))) return 'blocked';
  if (state.towers.some(tower => {
    const radius = stats.footprintRadius + resolveTowerStats(content.towerDefinitions.find(item => item.id === tower.definitionId)!, tower).footprintRadius;
    return (position.x - tower.position.x) ** 2 + (position.z - tower.position.z) ** 2 <= radius ** 2 + GEOMETRY_EPSILON;
  })) return 'overlap';
  return state.compute < stats.cost ? 'insufficient_compute' : null;
}

import type { EncounterContent } from '../../content/schemas/encounter';
import type { Point } from '../../content/schemas/scenario';
import type { EncounterSnapshot, Tower, Entity } from './state';
import type { Compiled } from './content';
import { entityPosition } from './content';
import { GEOMETRY_EPSILON, segmentIntersectsRectangle } from '../geometry';
import { resolveCoverage } from './coverage';
import { resolveActionStats } from './stats';
import type { StatSource } from './stats';

export type CoverageTower = Pick<EncounterSnapshot['towers'][number], 'definitionId' | 'position' | 'facing'> & { coverageKind?: Tower['coverageKind'] } & StatSource;
export function visibility(content: EncounterContent, tower: CoverageTower, point: Point): 'visible' | 'out_of_range' | 'outside_cone' | 'occluded' {
  const coverage = resolveCoverage(content, tower);
  const dx = point.x - tower.position.x, dz = point.z - tower.position.z;
  const distance = Math.hypot(dx, dz);
  if (!coverage || distance > coverage.radius + GEOMETRY_EPSILON) return 'out_of_range';
  if (coverage.kind === 'cone' && distance > GEOMETRY_EPSILON) {
    const angle = tower.facing * Math.PI / 180;
    if ((dx * Math.cos(angle) + dz * Math.sin(angle)) / distance + GEOMETRY_EPSILON < Math.cos(coverage.angleDegrees * Math.PI / 360)) return 'outside_cone';
  }
  return content.map.obstacles.some(item => item.blocksSight && segmentIntersectsRectangle(tower.position, point, item.footprint)) ? 'occluded' : 'visible';
}
export function eligible(content: EncounterContent, compiled: Compiled, tower: EncounterSnapshot['towers'][number], entity: Entity | EncounterSnapshot['entities'][number]) {
  const definition = compiled.towers.get(tower.definitionId)!;
  const stats = resolveActionStats(definition, tower), action = tower.action;
  if (!stats || !action || definition.kind !== 'targeted') return false;
  return (entity.kind === 'work' ? definition.capabilities.work && stats.workPerAction > 0 : definition.capabilities.problem && stats.damagePerAction > 0)
    && (action.mode === 'auto' || (action.mode === 'build' ? entity.kind === 'work' : entity.kind === 'problem'))
    && visibility(content, tower, entityPosition(compiled, entity)) === 'visible';
}
export function chooseTarget(content: EncounterContent, compiled: Compiled, state: EncounterSnapshot, tower: Tower): number | null {
  const action = tower.action;
  if (!action) return null;
  const candidates = state.entities.filter(entity => eligible(content, compiled, tower, entity));
  const current = candidates.find(entity => entity.id === action.targetId);
  if (current && action.mode === 'auto' && state.tick < action.commitmentUntil) return current.id;
  candidates.sort((a, b) => {
    if (action.mode === 'auto' && a.kind !== b.kind) return a.kind === 'problem' ? -1 : 1;
    if (action.priority === 'closest_to_product') {
      const distance = (compiled.routes.get(a.routeId)!.totalLength - a.distance) - (compiled.routes.get(b.routeId)!.totalLength - b.distance);
      if (Math.abs(distance) > GEOMETRY_EPSILON) return distance;
    }
    return a.id - b.id;
  });
  return candidates[0]?.id ?? null;
}

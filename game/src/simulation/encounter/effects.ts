import type { EncounterContent } from '../../content/schemas/encounter';
import type { EncounterSnapshot, Entity } from './state';
import type { Compiled } from './content';
import { entityPosition } from './content';
import { resolveQaAura } from './stats';
import { visibility } from './targeting';

/** Strongest-only is declared by each QA effect, independently for slow and reward.
 * This query deliberately does not consult mode, main-action target, or cooldown.
 */
export function qaEffectsAt(content: EncounterContent, compiled: Compiled, state: EncounterSnapshot, entity: Entity) {
  let slowPercent = 0, computeBonus = 0;
  const point = entityPosition(compiled, entity);
  for (const tower of state.towers) {
    const aura = resolveQaAura(compiled.towers.get(tower.definitionId)!, tower);
    if (!aura || visibility(content, tower, point) !== 'visible') continue;
    if (entity.kind === 'problem' && aura.combination.slow === 'strongest') slowPercent = Math.max(slowPercent, aura.slowPercent);
    if (entity.kind === 'work' && aura.combination.compute === 'strongest') computeBonus = Math.max(computeBonus, aura.computeBonus);
  }
  return { slowPercent, computeBonus };
}

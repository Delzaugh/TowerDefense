import type { MutableSnapshot, Outcome, Entity, Emit, EncounterEvent } from './state';
import type { EncounterContent } from '../../content/schemas/encounter';
import type { Compiled } from './content';
import { qaEffectsAt } from './effects';

export function settle(content: EncounterContent, compiled: Compiled, state: MutableSnapshot, entity: Entity, success: boolean, emit: Emit): EncounterEvent {
  const definition = compiled.schedule[entity.id - 1]!.definition;
  const outcome: Outcome = { entityId: entity.id, tick: state.tick, type: definition.kind === 'work' ? (success ? 'work_completed' : 'work_missed') : (success ? 'problem_resolved' : 'problem_leaked'), compute: 0, healing: 0, damage: 0 };
  if (success) {
    outcome.compute = definition.computeReward + (definition.kind === 'work' ? qaEffectsAt(content, compiled, state, entity).computeBonus : 0);
    state.compute += outcome.compute; state.totals.computeEarned += outcome.compute;
    if (definition.kind === 'work') {
      outcome.healing = Math.min(definition.healing, content.product.maximumHealth - state.productHealth);
      state.productHealth += outcome.healing; state.totals.healingReceived += outcome.healing;
      state.productProgress++; state.totals.completedWork++;
    } else state.totals.resolvedProblems++;
  } else if (definition.kind === 'work') { state.debt++; state.totals.missedWork++; }
  else {
    outcome.damage = Math.min(state.productHealth, definition.severityDamage);
    state.productHealth -= outcome.damage; state.totals.damageTaken += outcome.damage; state.totals.leakedProblems++;
  }
  state.outcomes.push(outcome);
  if (outcome.type === 'work_missed') return emit({ type: outcome.type, entityId: entity.id, debtAdded: 1 });
  if (outcome.type === 'problem_leaked') return emit({ type: outcome.type, entityId: entity.id, damage: outcome.damage });
  return emit({ type: outcome.type, entityId: entity.id, compute: outcome.compute, healing: outcome.healing });
}

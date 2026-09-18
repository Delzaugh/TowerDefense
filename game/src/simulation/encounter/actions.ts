import type { EncounterContent } from '../../content/schemas/encounter';
import type { Compiled } from './content';
import type { MutableSnapshot, Emit, EncounterEvent, Tower } from './state';
import { chooseTarget, eligible } from './targeting';
import { settle } from './outcomes';
import { resolveActionStats } from './stats';

export function setTarget(tower: Tower, id: number | null, state: MutableSnapshot, compiled: Compiled, emit: Emit, events: EncounterEvent[]) {
  const action = tower.action;
  if (!action || action.targetId === id) return;
  action.targetId = id;
  action.commitmentUntil = id === null ? 0 : state.tick + resolveActionStats(compiled.towers.get(tower.definitionId)!, tower)!.commitmentTicks;
  events.push(emit({ type: 'target_changed', towerId: tower.id, targetId: id }));
}
export function clearInvalidTargets(content: EncounterContent, compiled: Compiled, state: MutableSnapshot, emit: Emit, events: EncounterEvent[]) {
  for (const tower of state.towers) {
    const target = state.entities.find(entity => entity.id === tower.action?.targetId);
    if (!target || !eligible(content, compiled, tower, target)) setTarget(tower, null, state, compiled, emit, events);
  }
}
export function act(content: EncounterContent, compiled: Compiled, state: MutableSnapshot, emit: Emit, events: EncounterEvent[]) {
  const contributions = new Map<number, number>();
  for (const tower of state.towers) {
    const action = tower.action;
    if (!action) continue;
    setTarget(tower, chooseTarget(content, compiled, state, tower), state, compiled, emit, events);
    if (action.targetId === null || state.tick < action.readyTick) continue;
    const entity = state.entities.find(item => item.id === action.targetId)!;
    const stats = resolveActionStats(compiled.towers.get(tower.definitionId)!, tower)!;
    const amount = entity.kind === 'work' ? stats.workPerAction : stats.damagePerAction;
    contributions.set(entity.id, (contributions.get(entity.id) ?? 0) + amount);
    action.readyTick = state.tick + stats.cooldownTicks;
    events.push(emit({ type: 'tower_action', towerId: tower.id, entityId: entity.id, amount }));
  }
  const completed = new Set<number>();
  for (const entity of state.entities) {
    entity.remaining = Math.max(0, entity.remaining - (contributions.get(entity.id) ?? 0));
    if (entity.remaining === 0) { completed.add(entity.id); events.push(settle(content, compiled, state, entity, true, emit)); }
  }
  state.entities = state.entities.filter(entity => !completed.has(entity.id));
}

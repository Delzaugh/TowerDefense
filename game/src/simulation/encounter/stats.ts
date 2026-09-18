import type { EncounterContent } from '../../content/schemas/encounter';
import type { TowerStatOverrides, TowerStats } from '../../content/schemas/towerStats';
import type { Modifier } from '../../content/schemas/abilities';
import { freezeData } from '../../content/schemas/data';

type Definition = EncounterContent['towerDefinitions'][number];
export type StatSource = {
  readonly statOverrides?: Readonly<TowerStatOverrides>;
  readonly upgrades?: readonly string[];
  readonly activeEffects?: readonly { effectId: string; sourceId: string; appliedTick: number; expiresTick: number }[];
};
function stages(definition: Definition, tower: StatSource): readonly (readonly Modifier[])[] {
  const upgrades = definition.upgrades.filter(item => tower.upgrades?.includes(item.id));
  const external = [...(tower.activeEffects ?? [])].sort((a, b) => a.sourceId < b.sourceId ? -1 : a.sourceId > b.sourceId ? 1 : a.effectId < b.effectId ? -1 : a.effectId > b.effectId ? 1 : 0);
  return [upgrades.flatMap(upgrade => upgrade.operations.flatMap(op => op.kind === 'modify' ? op.modifiers : [])),
    external.flatMap(effect => definition.externalEffects.find(item => item.id === effect.effectId)?.modifiers ?? [])];
}
function value(base: number, stat: Modifier['stat'], groups: readonly (readonly Modifier[])[], min: number, max: number, integer = false) {
  let result = base;
  for (const group of groups) {
    const applicable = group.filter(modifier => modifier.stat === stat);
    if (!applicable.length) continue;
    result += applicable.filter(modifier => modifier.operation === 'add').reduce((sum, modifier) => sum + modifier.value, 0);
    for (const modifier of applicable) if (modifier.operation === 'multiply') result = Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, result * modifier.value));
    result = Math.max(min, Math.min(max, result));
  }
  return integer ? Math.round(result) : result;
}
/** Authored -> diagnostic override -> purchased upgrades -> active external effects.
 * Additions precede multipliers within each stage. Purchased cost/footprint never change.
 */
export function resolveTowerStats(definition: Definition, tower: StatSource = {}) {
  const base = definition.baseStats, overrides = tower.statOverrides, groups = stages(definition, tower);
  const shared = { cost: base.cost, footprintRadius: base.footprintRadius,
    range: value(overrides?.range ?? base.range, 'range', groups, .01, 100) };
  if (definition.kind === 'passive') return freezeData(shared);
  const action = definition.baseStats;
  return freezeData({ ...shared,
    cooldownTicks: value(overrides?.cooldownTicks ?? action.cooldownTicks, 'cooldownTicks', groups, 1, 3600, true),
    damagePerAction: value(overrides?.damagePerAction ?? action.damagePerAction, 'damagePerAction', groups, 0, 1_000_000, true),
    workPerAction: value(overrides?.workPerAction ?? action.workPerAction, 'workPerAction', groups, 0, 1_000_000, true),
    commitmentTicks: value(overrides?.commitmentTicks ?? action.commitmentTicks, 'commitmentTicks', groups, 0, 3600, true),
  });
}
export function resolveActionStats(definition: Definition, tower: StatSource = {}): Readonly<TowerStats> | undefined {
  return definition.kind === 'targeted' ? resolveTowerStats(definition, tower) as Readonly<TowerStats> : undefined;
}
export function resolveQaAura(definition: Definition, tower: StatSource = {}) {
  const added = definition.upgrades.filter(item => tower.upgrades?.includes(item.id)).flatMap(upgrade => upgrade.operations.flatMap(op => op.kind === 'add_ability' ? [op.ability] : []));
  const aura = [...definition.abilities, ...added][0];
  if (!aura) return undefined;
  const groups = stages(definition, tower);
  return { ...aura, slowPercent: Math.round(value(aura.slowPercent, 'qaSlowPercent', groups, 0, 90) * 100) / 100,
    computeBonus: value(aura.computeBonus, 'qaComputeBonus', groups, 0, 1_000_000, true) };
}
export function statRates(stats: ReturnType<typeof resolveTowerStats>) {
  if (!('cooldownTicks' in stats)) return { intervalMs: 0, actionsPerSecond: 0, damagePerSecond: 0, workPerSecond: 0 };
  const action = stats as Readonly<TowerStats>, actionsPerSecond = 60 / action.cooldownTicks;
  return { intervalMs: action.cooldownTicks * 1000 / 60, actionsPerSecond,
    damagePerSecond: action.damagePerAction * actionsPerSecond, workPerSecond: action.workPerAction * actionsPerSecond };
}

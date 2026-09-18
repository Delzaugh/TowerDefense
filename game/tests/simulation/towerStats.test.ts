import { expect, it } from 'vitest';
import { towerStatsSchema, towerStatOverridesSchema } from '../../src/content/schemas/towerStats';
import { testMap } from '../../src/content/levels/testMap';
import { headlessSlice } from '../../src/content/levels/headlessSlice';
import { parseEncounter } from '../../src/content/schemas/encounter';
import { resolveTowerStats, statRates } from '../../src/simulation/encounter/stats';
import { createEncounter, restoreEncounter } from '../../src/simulation/encounter';
import { createEncounterLab } from '../../src/session/createEncounterLab';
import { createMemoryRepository } from '../../src/persistence/saveRepository';
import { fakeHost } from '../fixtures/helpers';

const place = { type: 'place_tower', definitionId: 'base_copilot', position: { x: -5, z: 0 }, facing: 0 };
const definition = testMap.towerDefinitions[0]!;
it.each([{ cost: -1 }, { cost: .5 }, { cost: Infinity }, { cost: 1000001 }, { footprintRadius: 0 }, { footprintRadius: -1 }, { footprintRadius: Infinity }, { footprintRadius: 10.1 }])('rejects invalid authored placement stats %j', patch => {
  expect(() => parseEncounter({ ...testMap, towerDefinitions: [{ ...definition, baseStats: { ...definition.baseStats, ...patch } }] })).toThrow();
});
it.each([{ cost: 0 }, { footprintRadius: .01 }])('cannot rewrite purchased placement properties with overrides %j', overrides => {
  const sim = createEncounter(testMap, 'stats_test'); sim.dispatch(place); const before = sim.capture();
  expect(sim.dispatch({ type: 'set_stats', towerId: 1, overrides })).toMatchObject({ reason: 'invalid_command' });
  expect(sim.capture()).toEqual(before);
  expect(() => restoreEncounter(testMap, { ...before, towers: [{ ...before.towers[0], statOverrides: overrides }] })).toThrow();
});
it('uses different type costs and footprint sizes for spending, overlap and restoration', () => {
  const heavy = { ...definition, id: 'heavy_test', baseStats: { ...definition.baseStats, cost: 80, footprintRadius: 1.25 } };
  const content = parseEncounter({ ...headlessSlice, towerDefinitions: [definition, heavy] });
  const sim = createEncounter(content, 'stats_test');
  expect(sim.dispatch({ ...place, definitionId: heavy.id }).accepted).toBe(true);
  const before = sim.capture(); expect(before.compute).toBe(20); expect(before.totals.computeSpent).toBe(80);
  expect(sim.dispatch({ ...place, position: { x: -3.5, z: 0 } })).toMatchObject({ reason: 'overlap' });
  expect(sim.dispatch({ ...place, position: { x: 4, z: 0 } })).toMatchObject({ reason: 'insufficient_compute' });
  expect(sim.capture()).toEqual(before); expect(restoreEncounter(content, before).capture()).toEqual(before);
  const lab = createEncounterLab(content, fakeHost().host, () => 'stats_test', createMemoryRepository());
  lab.dispatch({ ...place, definitionId: heavy.id }); lab.dispatch({ type: 'start' }); lab.prepareAgain();
  expect(lab.getSnapshot().snapshot).toMatchObject({ compute: 20, totals: { computeSpent: 80 }, towers: [{ definitionId: heavy.id }] });
});
it('uses a larger authored footprint for map edges and obstacles, including preview', () => {
  const large = parseEncounter({ ...testMap, towerDefinitions: [{ ...definition, baseStats: { ...definition.baseStats, footprintRadius: 1.25 } }] });
  const sim = createEncounter(large, 'stats_test');
  for (const [x, reason] of [[-9, 'outside_buildable'], [-3, 'blocked']] as const) {
    const position = { x, z: 0 }; expect(sim.previewPlacement(definition.id, position)).toBe(reason);
    expect(sim.dispatch({ ...place, position })).toMatchObject({ reason });
  }
  expect(sim.capture().compute).toBe(300); expect(sim.capture().towers).toHaveLength(0);
});
it('resolves detached base stats and overrides without changing the definition', () => {
  const base = resolveTowerStats(definition);
  expect(base).toEqual({ cost: 30, footprintRadius: .4, range: 5, cooldownTicks: 30, damagePerAction: 5, workPerAction: 5, commitmentTicks: 30 });
  expect(statRates(base)).toEqual({ intervalMs: 500, actionsPerSecond: 2, damagePerSecond: 10, workPerSecond: 10 });
  expect(resolveTowerStats(definition, { statOverrides: { range: 8, damagePerAction: 0 } })).toEqual({ ...base, range: 8, damagePerAction: 0 });
  expect(Object.isFrozen(base)).toBe(true); expect(definition.baseStats.range).toBe(5);
});
it.each([{ range: 0 }, { range: Infinity }, { range: 101 }, { cooldownTicks: 0 }, { cooldownTicks: 3601 }, { cooldownTicks: 1.5 }, { damagePerAction: -1 }, { workPerAction: .5 }, { workPerAction: 1000001 }, { commitmentTicks: -1 }, { commitmentTicks: 3601 }, { mystery: 1 }, { range: undefined }])('rejects invalid stat overrides %j', overrides => {
  expect(towerStatOverridesSchema.safeParse(overrides).success).toBe(false);
  const sim = createEncounter(testMap, 'stats_test'); sim.dispatch(place); const before = sim.capture();
  expect(sim.dispatch({ type: 'set_stats', towerId: 1, overrides })).toMatchObject({ reason: 'invalid_command' }); expect(sim.capture()).toEqual(before);
});
it('requires complete authored stats and rejects duplicated legacy flat stats', () => {
  expect(towerStatsSchema.safeParse({ range: 5 }).success).toBe(false);
  expect(() => parseEncounter({ ...testMap, towerDefinitions: [{ ...definition, damagePerAction: 7 }] })).toThrow();
  expect(() => parseEncounter({ ...testMap, towerDefinitions: [{ ...definition, coverage: { kind: 'area', radius: 7 } }] })).toThrow();
});
it('changes only the requested tower, preserves identity/economy, and can clear overrides', () => {
  const sim = createEncounter(testMap, 'stats_test'); sim.dispatch(place); sim.dispatch({ ...place, position: { x: 4, z: 0 } });
  const before = sim.capture();
  expect(sim.dispatch({ type: 'set_stats', towerId: 1, overrides: { range: 2, workPerAction: 9 } }).accepted).toBe(true);
  expect(sim.capture().towers[1]).toEqual(before.towers[1]); expect(sim.capture().compute).toBe(240);
  expect(sim.capture().towers[0]).toEqual({ ...before.towers[0], statOverrides: { range: 2, workPerAction: 9 } });
  expect(sim.inspectCoverage(sim.capture().towers[0]!, { x: -8, z: 0 })).toBe('out_of_range');
  sim.dispatch({ type: 'set_stats', towerId: 1, overrides: {} }); expect(sim.capture().towers[0]!.statOverrides).toEqual({});
  expect(sim.inspectCoverage(sim.capture().towers[0]!, { x: -8, z: 0 })).toBe('visible');
});
it('keeps tuning opt-in and preparation-only, with no bypass on restore', () => {
  const fixed = createEncounter(headlessSlice, 'fixed'); fixed.dispatch(place); const state = fixed.capture();
  expect(fixed.dispatch({ type: 'set_stats', towerId: 1, overrides: { range: 9 } })).toMatchObject({ reason: 'stat_tuning_disabled' });
  expect(() => restoreEncounter(headlessSlice, { ...state, towers: [{ ...state.towers[0], statOverrides: { range: 9 } }] })).toThrow('Stat tuning is disabled');
  const sim = createEncounter(testMap, 'stats_test'); sim.dispatch(place);
  expect(sim.dispatch({ type: 'set_stats', towerId: 99, overrides: {} })).toMatchObject({ reason: 'unknown_tower' });
  sim.dispatch({ type: 'start' }); expect(sim.dispatch({ type: 'set_stats', towerId: 1, overrides: {} })).toMatchObject({ reason: 'wrong_phase' });
  sim.dispatch({ type: 'pause' }); expect(sim.dispatch({ type: 'set_stats', towerId: 1, overrides: {} })).toMatchObject({ reason: 'paused' });
});
it('uses tuned output and action interval for actual Work and Problem actions', () => {
  const sim = createEncounter(testMap, 'stats_test'); sim.dispatch(place);
  sim.dispatch({ type: 'set_stats', towerId: 1, overrides: { workPerAction: 3, damagePerAction: 4, cooldownTicks: 6, commitmentTicks: 12 } }); sim.dispatch({ type: 'start' });
  const first = sim.advanceOneTick(); expect(first.events).toContainEqual(expect.objectContaining({ type: 'tower_action', amount: 3 }));
  expect(sim.capture().entities[0]!.remaining).toBe(7); expect(sim.capture().towers[0]).toMatchObject({ action: { readyTick: 7, commitmentUntil: 13 } });
  for (let i = 0; i < 5; i++) expect(sim.advanceOneTick().events.some(event => event.type === 'tower_action')).toBe(false);
  expect(sim.advanceOneTick().events).toContainEqual(expect.objectContaining({ type: 'tower_action', amount: 3 }));
  for (let i = 0; i < 53; i++) sim.advanceOneTick();
  expect(sim.advanceOneTick().events).toContainEqual(expect.objectContaining({ type: 'tower_action', amount: 4 }));
  const restored = restoreEncounter(testMap, sim.capture());
  for (let i = 0; i < 50; i++) { expect(restored.advanceOneTick()).toEqual(sim.advanceOneTick()); }
  expect(restored.capture()).toEqual(sim.capture());
});
it('zero-output specialists never select unusable categories or emit zero actions', () => {
  const sim = createEncounter(testMap, 'stats_test'); sim.dispatch(place);
  sim.dispatch({ type: 'set_stats', towerId: 1, overrides: { damagePerAction: 0, workPerAction: 0 } }); sim.dispatch({ type: 'start' });
  for (let i = 0; i < 120; i++) expect(sim.advanceOneTick().events.some(event => event.type === 'tower_action')).toBe(false);
  expect(sim.capture().towers[0]!.action!.targetId).toBeNull();
});
it.each(['work', 'problem'] as const)('a %s specialist still acts on its supported category', kind => {
  const sim = createEncounter(testMap, 'stats_test'); sim.dispatch(place);
  sim.dispatch({ type: 'set_stats', towerId: 1, overrides: { damagePerAction: kind === 'problem' ? 5 : 0, workPerAction: kind === 'work' ? 5 : 0 } });
  sim.dispatch({ type: 'start' });
  const actionKinds: string[] = [];
  for (let i = 0; i < 120; i++) {
    const result = sim.advanceOneTick();
    for (const event of result.events) if (event.type === 'tower_action') {
      // Definitions spawn Work first (entity 1), then Problem (entity 2).
      actionKinds.push(event.entityId === 1 ? 'work' : 'problem');
      expect(event.amount).toBe(5);
    }
  }
  expect(actionKinds.length).toBeGreaterThan(0); expect(new Set(actionKinds)).toEqual(new Set([kind]));
});
it('preserves overrides through capture, custom queue application, save/reload and repeat', async () => {
  const repository = createMemoryRepository(); const lab = createEncounterLab(testMap, fakeHost().host, () => 'stats_test', repository);
  lab.dispatch(place); lab.dispatch({ type: 'set_stats', towerId: 1, overrides: { range: 8, workPerAction: 7, cooldownTicks: 12 } });
  lab.capture(); lab.dispatch({ type: 'set_stats', towerId: 1, overrides: {} }); lab.restore();
  lab.applyRecipe(lab.getSnapshot().recipe, true); await lab.save(); lab.reset(); await lab.load();
  expect(lab.getSnapshot().snapshot.towers[0]!.statOverrides).toEqual({ range: 8, workPerAction: 7, cooldownTicks: 12 });
  lab.dispatch({ type: 'start' }); lab.step(60); lab.prepareAgain();
  expect(lab.getSnapshot().snapshot.towers[0]).toMatchObject({ action: { readyTick: 0 }, statOverrides: { range: 8, workPerAction: 7, cooldownTicks: 12 } });
});



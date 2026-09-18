import { describe, expect, it } from 'vitest';
import { headlessSlice } from '../../src/content/levels/headlessSlice';
import { parseEncounter } from '../../src/content/schemas/encounter';
import { createEncounter, restoreEncounter } from '../../src/simulation/encounter';
import type { Encounter } from '../../src/simulation/encounter';
import { resolveQaAura, resolveTowerStats } from '../../src/simulation/encounter/stats';
import { captureBlueprint, prepareBlueprint } from '../../src/simulation/encounter/blueprint';
import { createLabSave, parseLabSave } from '../../src/persistence/testLabSave';

const aura = { kind: 'qa_aura', slowPercent: 10, computeBonus: 2, combination: { slow: 'strongest', compute: 'strongest' } };
const base = { ...headlessSlice.towerDefinitions[0]!, allowStatTuning: true, baseStats: { ...headlessSlice.towerDefinitions[0]!.baseStats, range: 30, workPerAction: 0, damagePerAction: 0 } };
const tester = { ...base, id: 'tester', abilities: [aura], upgrades: [
  { id: 'enhance', label: 'Enhance', cost: 20, operations: [{ kind: 'modify', modifiers: [{ stat: 'qaSlowPercent', operation: 'add', value: 5 }, { stat: 'qaComputeBonus', operation: 'add', value: 1 }] }] },
], externalEffects: [{ id: 'boost', label: 'Boost', durationTicks: 5, modifiers: [{ stat: 'qaSlowPercent', operation: 'add', value: 10 }] }] };
const passive = { id: 'human_probe', label: 'Human restriction fixture', family: 'human', kind: 'passive',
  canRotate: false, placementLimit: 1, coverage: { kind: 'area' }, baseStats: { cost: 80, footprintRadius: .4, range: 30 },
  abilities: [aura], upgrades: [], externalEffects: [], allowStatTuning: true };
function content(towers: unknown[] = [tester], work = 100_000) {
  return parseEncounter({ ...headlessSlice, initialCompute: 1000,
    map: { ...headlessSlice.map, routes: [{ id: 'main_route', width: .8, points: [{ x: -8, z: 2 }, { x: 8, z: 2 }] }], obstacles: [] },
    towerDefinitions: towers,
    definitions: headlessSlice.definitions.map(item => item.kind === 'work' ? { ...item, speed: 6, requiredWork: work } : { ...item, speed: 6, durability: 100_000 }),
    wave: { id: 'aura_test', spawns: [
      { offsetTicks: 0, definitionId: 'coding_task', routeId: 'main_route' },
      { offsetTicks: 0, definitionId: 'bug', routeId: 'main_route' },
    ] },
  });
}
function place(sim: Encounter, definitionId = 'tester', x = -5) {
  expect(sim.dispatch({ type: 'place_tower', definitionId, position: { x, z: 0 }, facing: 0 }).accepted).toBe(true);
}
function step(sim: Encounter, ticks: number) { for (let i = 0; i < ticks; i++) sim.advanceOneTick(); }
function configure(sim: Encounter, command: unknown) { expect(sim.dispatch(command).accepted).toBe(true); }

describe('generic tower definitions and controls', () => {
  it('places a Human passive without action stats/state and enforces its cap atomically', () => {
    const data = content([passive, tester]), sim = createEncounter(data, 'human'); place(sim, passive.id);
    const before = sim.capture(); expect(before.towers[0]!.action).toBeNull(); expect(before.compute).toBe(920);
    expect(sim.dispatch({ type: 'place_tower', definitionId: passive.id, position: { x: -3, z: 0 }, facing: 0 })).toMatchObject({ reason: 'type_limit' });
    expect(sim.previewPlacement(passive.id, { x: -3, z: 0 })).toBe('type_limit');
    for (const command of [{ type: 'set_mode', mode: 'build' }, { type: 'set_priority', priority: 'first_spawned' }, { type: 'set_facing', facing: 90 }, { type: 'set_stats', overrides: { damagePerAction: 10 } }]) expect(sim.dispatch({ ...command, towerId: 1 })).toMatchObject({ reason: 'unsupported_control' });
    expect(sim.capture()).toEqual(before); expect(restoreEncounter(data, before).capture()).toEqual(before);
    place(sim, 'tester', -3); expect(sim.capture().towers).toHaveLength(2);
    const corrupted = { ...before, towers: [...before.towers, { ...before.towers[0], id: 2, position: { x: -3, z: 0 } }], nextTowerId: 3 };
    expect(() => restoreEncounter(data, corrupted)).toThrow();
  });
  it('uses declared categories and modes independently of nonzero output', () => {
    const data = content([{ ...tester, capabilities: { work: true, problem: false }, controls: { modes: ['build'], priorities: ['first_spawned'] }, baseStats: { ...tester.baseStats, workPerAction: 5, damagePerAction: 100_000 } }]);
    const sim = createEncounter(data, 'capabilities'); place(sim);
    expect(sim.capture().towers[0]!.action).toMatchObject({ mode: 'build', priority: 'first_spawned' });
    expect(sim.dispatch({ type: 'set_mode', towerId: 1, mode: 'auto' })).toMatchObject({ reason: 'unsupported_control' });
    configure(sim, { type: 'start' }); step(sim, 60);
    expect(sim.capture().entities.find(item => item.kind === 'problem')!.remaining).toBe(100_000);
    expect(sim.capture().entities.find(item => item.kind === 'problem')!.distance).toBeCloseTo(5.4);
  });
  it('rejects unsupported content, policies, stats and duplicate upgrade IDs', () => {
    for (const tower of [
      { ...passive, baseStats: { ...passive.baseStats, damagePerAction: 1 } },
      { ...tester, abilities: [{ ...aura, combination: { slow: 'add', compute: 'strongest' } }] },
      { ...tester, upgrades: [tester.upgrades[0], tester.upgrades[0]] },
      { ...passive, externalEffects: [{ ...tester.externalEffects[0], modifiers: [{ stat: 'cooldownTicks', operation: 'add', value: 1 }] }] },
      { ...tester, externalEffects: [{ ...tester.externalEffects[0], modifiers: [{ stat: 'qaSlowPercent', operation: 'multiply', value: -1 }] }] },
    ]) expect(() => content([tower])).toThrow();
  });
});

describe('QA Aura effects and shared coverage', () => {
  it.each(['auto', 'build', 'defend'])('slows only Enemies while idle in %s, with identical restoration', mode => {
    const data = content(), sim = createEncounter(data, 'idle'); place(sim);
    configure(sim, { type: 'set_mode', towerId: 1, mode }); configure(sim, { type: 'start' }); step(sim, 60);
    const state = sim.capture(); expect(state.towers[0]!.action!.targetId).toBeNull();
    expect(state.entities.find(item => item.kind === 'problem')!.distance).toBeCloseTo(5.4);
    expect(state.entities.find(item => item.kind === 'work')!.distance).toBe(6);
    const restored = restoreEncounter(data, state);
    for (let i = 0; i < 140; i++) expect(restored.advanceOneTick()).toEqual(sim.advanceOneTick());
    expect(restored.capture()).toEqual(sim.capture());
    expect(sim.capture().outcomes.find(item => item.type === 'problem_leaked')!.tick).toBe(178);
  });
  it('uses the strongest slow and strongest bonus independently, regardless of who completes Work', () => {
    const strongerSlow = { ...tester, id: 'slow', abilities: [{ ...aura, slowPercent: 20, computeBonus: 1 }] };
    const strongerReward = { ...tester, id: 'reward', abilities: [{ ...aura, slowPercent: 10, computeBonus: 4 }] };
    const worker = { ...base, baseStats: { ...base.baseStats, workPerAction: 5 } };
    const data = content([strongerSlow, strongerReward, worker], 5), sim = createEncounter(data, 'overlap');
    place(sim, 'slow', -5); place(sim, 'reward', -3); place(sim, 'base_copilot', -1);
    configure(sim, { type: 'set_mode', towerId: 1, mode: 'defend' }); configure(sim, { type: 'set_mode', towerId: 2, mode: 'defend' });
    configure(sim, { type: 'start' }); step(sim, 60);
    expect(sim.capture().entities[0]!.distance).toBeCloseTo(4.8);
    expect(sim.capture().outcomes[0]).toMatchObject({ compute: 16, healing: 0, type: 'work_completed' });
    expect(sim.capture()).toMatchObject({ productProgress: 1, totals: { completedWork: 1, computeEarned: 16 } });
    expect(restoreEncounter(data, sim.capture()).capture()).toEqual(sim.capture());
  });
  it('pays bonus Compute exactly once with simultaneous Work contributors', () => {
    const data = content([{ ...tester, baseStats: { ...tester.baseStats, workPerAction: 5 } }], 5), sim = createEncounter(data, 'reward');
    place(sim); place(sim, 'tester', -3); configure(sim, { type: 'start' });
    const events = sim.advanceOneTick().events;
    expect(events.filter(event => event.type === 'tower_action')).toHaveLength(2);
    expect(events.filter(event => event.type === 'work_completed')).toHaveLength(1);
    expect(sim.capture()).toMatchObject({ compute: 954, productProgress: 1, totals: { computeEarned: 14 } });
  });
  it('obeys blockers and cone facing for both slow and completion bonus', () => {
    const raw = content([{ ...tester, coverage: { kind: 'cone', angleDegrees: 90 }, baseStats: { ...tester.baseStats, workPerAction: 5 } }], 5);
    const blocked = parseEncounter({ ...raw, map: { ...raw.map, obstacles: [{ id: 'wall', footprint: { min: { x: -6.5, z: .5 }, max: { x: -6, z: 1.5 } }, blocksSight: true }] } });
    for (const [data, facing] of [[raw, 0], [blocked, 150]] as const) {
      const sim = createEncounter(data, 'occlusion'); place(sim); configure(sim, { type: 'set_facing', towerId: 1, facing });
      configure(sim, { type: 'start' }); step(sim, 1);
      expect(sim.capture().outcomes).toHaveLength(0); expect(sim.capture().entities.find(item => item.kind === 'problem')!.distance).toBe(.1);
    }
    const sim = createEncounter(raw, 'visible'); place(sim); configure(sim, { type: 'set_facing', towerId: 1, facing: 150 }); configure(sim, { type: 'start' }); step(sim, 1);
    expect(sim.capture().outcomes[0]!.compute).toBe(14); expect(sim.capture().entities[0]!.distance).toBeCloseTo(.09);
  });
  it('starts and stops slow at shared range boundaries and follows range modifiers', () => {
    const data = content([{ ...tester, baseStats: { ...tester.baseStats, range: 2 }, upgrades: [{ id: 'range', label: 'Range', cost: 0, operations: [{ kind: 'modify', modifiers: [{ stat: 'range', operation: 'add', value: 1 }] }] }] }]);
    const sim = createEncounter(data, 'range'); place(sim, 'tester', 0); configure(sim, { type: 'start' }); step(sim, 81);
    expect(sim.capture().entities.find(item => item.kind === 'problem')!.distance).toBeCloseTo(8.09); // Only the point directly beside the tower is in range 2.
    step(sim, 1); expect(sim.capture().entities.find(item => item.kind === 'problem')!.distance).toBeCloseTo(8.19);
    configure(sim, { type: 'buy_upgrade', towerId: 1, upgradeId: 'range' });
    expect(sim.inspectCoverage(sim.capture().towers[0]!, { x: 0, z: 3 })).toBe('visible');
    step(sim, 1); expect(sim.capture().entities.find(item => item.kind === 'problem')!.distance).toBeCloseTo(8.28);
  });
});

describe('upgrades, external modifiers and persistence', () => {
  it('preserves the base, enhances an aura, refreshes sources, and expires after exactly N ticks', () => {
    const data = content(), sim = createEncounter(data, 'effects'); place(sim);
    configure(sim, { type: 'buy_upgrade', towerId: 1, upgradeId: 'enhance' });
    const purchased = sim.capture(); expect(purchased.compute).toBe(950);
    expect(sim.dispatch({ type: 'buy_upgrade', towerId: 1, upgradeId: 'enhance' })).toMatchObject({ reason: 'already_owned' }); expect(sim.capture()).toEqual(purchased);
    const boost = { type: 'apply_effect', towerId: 1, effectId: 'boost', sourceId: 'support' };
    configure(sim, boost); configure(sim, boost); expect(sim.capture().towers[0]!.activeEffects).toHaveLength(1);
    expect(resolveQaAura(data.towerDefinitions[0]!, sim.capture().towers[0]!)).toMatchObject({ slowPercent: 25, computeBonus: 3 });
    expect(data.towerDefinitions[0]!.abilities[0]!.slowPercent).toBe(10);
    configure(sim, { type: 'start' }); step(sim, 3); const saved = sim.capture();
    configure(sim, { type: 'pause' }); const paused = sim.capture(); step(sim, 10); expect(sim.capture()).toEqual(paused);
    expect(sim.dispatch(boost)).toMatchObject({ reason: 'paused' }); configure(sim, { type: 'resume' }); step(sim, 2);
    expect(sim.capture().entities.find(item => item.kind === 'problem')!.distance).toBe(.375);
    expect(sim.capture().towers[0]!.activeEffects).toHaveLength(0); step(sim, 1);
    expect(sim.capture().entities.find(item => item.kind === 'problem')!.distance).toBeCloseTo(.46);
    const restored = restoreEncounter(data, saved); step(restored, 3);
    expect(restored.capture().entities).toEqual(sim.capture().entities);
    configure(sim, boost); configure(sim, { ...boost, sourceId: 'second' });
    configure(sim, { ...boost, type: 'remove_effect' });
    expect(sim.capture().towers[0]!.activeEffects.map(effect => effect.sourceId)).toEqual(['second']);
  });
  it('adds an ability explicitly and rejects modifiers on abilities not yet acquired', () => {
    const data = content([{ ...tester, abilities: [], upgrades: [...tester.upgrades,
      { id: 'grant_qa', label: 'Add QA', cost: 10, operations: [{ kind: 'add_ability', ability: aura }] },
      { id: 'duplicate_qa', label: 'Duplicate QA', cost: 10, operations: [{ kind: 'add_ability', ability: aura }] },
    ] }]);
    const sim = createEncounter(data, 'grant'); place(sim); const before = sim.capture();
    expect(sim.dispatch({ type: 'buy_upgrade', towerId: 1, upgradeId: 'enhance' })).toMatchObject({ reason: 'unsupported_effect' }); expect(sim.capture()).toEqual(before);
    configure(sim, { type: 'buy_upgrade', towerId: 1, upgradeId: 'grant_qa' }); configure(sim, { type: 'buy_upgrade', towerId: 1, upgradeId: 'enhance' });
    expect(sim.dispatch({ type: 'buy_upgrade', towerId: 1, upgradeId: 'duplicate_qa' })).toMatchObject({ reason: 'ability_conflict' });
    expect(resolveQaAura(data.towerDefinitions[0]!, sim.capture().towers[0]!)!.slowPercent).toBe(15);
    expect(restoreEncounter(data, sim.capture()).capture()).toEqual(sim.capture());
  });
  it('keeps an in-flight cooldown deadline while changing subsequent cadence', () => {
    const data = content([{ ...tester, baseStats: { ...tester.baseStats, workPerAction: 1 }, upgrades: [{ id: 'faster', label: 'Faster', cost: 10, operations: [{ kind: 'modify', modifiers: [{ stat: 'cooldownTicks', operation: 'multiply', value: .5 }] }] }] }]);
    const sim = createEncounter(data, 'cadence'); place(sim); configure(sim, { type: 'start' }); step(sim, 1);
    configure(sim, { type: 'buy_upgrade', towerId: 1, upgradeId: 'faster' }); expect(sim.capture().towers[0]!.action!.readyTick).toBe(31);
    const restored = restoreEncounter(data, sim.capture()); step(sim, 30); step(restored, 30);
    expect(sim.capture().towers[0]!.action!.readyTick).toBe(46); expect(restored.capture()).toEqual(sim.capture());
  });
  it('saves owned upgrades, removes transient effects on repeat, and rejects tampered histories/accounting', () => {
    const data = content(), sim = createEncounter(data, 'save'); place(sim);
    configure(sim, { type: 'buy_upgrade', towerId: 1, upgradeId: 'enhance' }); configure(sim, { type: 'apply_effect', towerId: 1, effectId: 'boost', sourceId: 'support' });
    const envelope = createLabSave(data, sim.capture(), null); expect(parseLabSave(data, envelope).snapshot).toEqual(sim.capture());
    const repeated = prepareBlueprint(data, captureBlueprint(sim.capture(), null), 'repeat').encounter;
    expect(repeated.capture().towers[0]).toMatchObject({ upgrades: ['enhance'], activeEffects: [], action: { readyTick: 0, targetId: null } }); expect(repeated.capture().compute).toBe(950);
    configure(sim, { type: 'start' }); step(sim, 60); const saved = sim.capture();
    for (const patch of [{ schemaVersion: 5 }, { compute: saved.compute + 1 }, { commandLog: saved.commandLog.slice(1) },
      { entities: saved.entities.map(entity => ({ ...entity, distance: entity.distance + .1 })) },
      { towers: saved.towers.map(tower => ({ ...tower, upgrades: [] })) },
    ]) expect(() => restoreEncounter(data, { ...saved, ...patch })).toThrow();
    step(sim, 200); const end = sim.capture();
    expect(() => restoreEncounter(data, { ...end, outcomes: end.outcomes.map(outcome => ({ ...outcome, compute: outcome.compute + 1 })) })).toThrow();
  });
  it('bounds effective stats and uses additions before multipliers without mutating bases', () => {
    const data = content([{ ...tester, upgrades: [{ id: 'math', label: 'Math', cost: 0, operations: [{ kind: 'modify', modifiers: [
      { stat: 'qaSlowPercent', operation: 'multiply', value: 2 }, { stat: 'qaSlowPercent', operation: 'add', value: 5 }, { stat: 'range', operation: 'multiply', value: 1_000_000 },
    ] }] }] }]);
    const sim = createEncounter(data, 'math'); place(sim); configure(sim, { type: 'buy_upgrade', towerId: 1, upgradeId: 'math' });
    expect(resolveQaAura(data.towerDefinitions[0]!, sim.capture().towers[0]!)!.slowPercent).toBe(30);
    expect(resolveTowerStats(data.towerDefinitions[0]!, sim.capture().towers[0]!).range).toBe(100);
  });
});


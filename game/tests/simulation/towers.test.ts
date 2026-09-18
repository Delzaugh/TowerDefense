import { describe, expect, it } from 'vitest';
import { headlessSlice, blockerSlice } from '../../src/content/levels/headlessSlice';
import { parseEncounter } from '../../src/content/schemas/encounter';
import type { EncounterContent } from '../../src/content/schemas/encounter';
import { createEncounter, restoreEncounter } from '../../src/simulation/encounter';
import type { Encounter, EncounterEvent } from '../../src/simulation/encounter';
import { compileEncounter } from '../../src/simulation/encounter/content';
import { chooseTarget, visibility } from '../../src/simulation/encounter/targeting';
import { initialState } from '../../src/simulation/encounter/snapshot';
import type { Tower } from '../../src/simulation/encounter/state';

const place = (sim: Encounter, x = -5, z = 0, definitionId = 'base_copilot', facing = 0) => sim.dispatch({ type: 'place_tower', definitionId, position: { x, z }, facing });
function advance(sim: Encounter, ticks: number) { const events: EncounterEvent[] = []; for (let i = 0; i < ticks; i++) events.push(...sim.advanceOneTick().events); return events; }
function one(kind: 'work' | 'problem' = 'work', override: Partial<EncounterContent> = {}) {
  return parseEncounter({ ...headlessSlice, wave: { id: 'one', spawns: [headlessSlice.wave.spawns[kind === 'work' ? 0 : 1]] }, ...override });
}
const baseTower = (): Tower => ({ id: 1, definitionId: 'base_copilot', coverageKind: 'area', statOverrides: {}, position: { x: 0, z: 0 }, facing: 0, placedTick: 0, upgrades: [], activeEffects: [], action: { mode: 'auto', priority: 'closest_to_product', readyTick: 0, targetId: null, commitmentUntil: 0 } });

describe('atomic tower placement and commands', () => {
  it('allocates a tower and spends exactly once; overlap consumes nothing', () => {
    const sim = createEncounter(headlessSlice, 'tower_test');
    expect(place(sim).accepted).toBe(true); const snapshot = sim.capture();
    expect(snapshot).toMatchObject({ compute: 70, nextTowerId: 2, totals: { computeSpent: 30 }, towers: [{ id: 1, action: { mode: 'auto', targetId: null } }] });
    expect(place(sim)).toMatchObject({ accepted: false, reason: 'overlap', events: [] }); expect(sim.capture()).toEqual(snapshot);
    expect(place(sim, -5, 1).accepted).toBe(true); expect(sim.capture().towers.map(tower => tower.id)).toEqual([1, 2]);
  });
  it.each([
    [-9.61, 0, 'outside_buildable'], [-6, 2, 'path_blocked'], [-6, 2.8, 'path_blocked'], [-1.5, 0, 'blocked'], [-2.4, 0, 'blocked'],
  ])('rejects authored boundary/obstacle placement at %s %s', (x, z, reason) => {
    const sim = createEncounter(blockerSlice, 'tower_test'); const before = sim.capture();
    expect(place(sim, Number(x), Number(z))).toMatchObject({ accepted: false, reason }); expect(sim.capture()).toEqual(before);
  });
  it('allows a tower footprint just beyond the authored path edge', () => {
    const sim = createEncounter(headlessSlice, 'tower_test');
    expect(sim.previewPlacement('base_copilot', { x: -6, z: 2.801 })).toBeNull();
    expect(place(sim, -6, 2.801).accepted).toBe(true);
  });
  it('accepts buildable-edge containment and rejects circle tangency', () => {
    const sim = createEncounter(headlessSlice, 'tower_test'); expect(place(sim, -9.6, 0).accepted).toBe(true);
    const before = sim.capture(); expect(place(sim, -8.8, 0)).toMatchObject({ reason: 'overlap' }); expect(sim.capture()).toEqual(before);
  });
  it('rejects insufficient Compute, invalid input, unknown definitions and unknown towers atomically', () => {
    const sim = createEncounter({ ...headlessSlice, initialCompute: 29 }, 'tower_test'); const before = sim.capture();
    expect(place(sim)).toMatchObject({ reason: 'insufficient_compute' });
    expect(place(sim, -5, 0, 'missing')).toMatchObject({ reason: 'unknown_definition' });
    expect(place(sim, Number.NaN)).toMatchObject({ reason: 'invalid_command' });
    expect(sim.dispatch({ type: 'set_mode', towerId: 1, mode: 'build' })).toMatchObject({ reason: 'unknown_tower' });
    expect(sim.capture()).toEqual(before);
  });
  it('supports active placement/configuration but rejects paused tactics and active rotation', () => {
    const sim = createEncounter(headlessSlice, 'tower_test'); sim.dispatch({ type: 'start' }); expect(place(sim).accepted).toBe(true);
    expect(sim.dispatch({ type: 'set_facing', towerId: 1, facing: 90 })).toMatchObject({ reason: 'wrong_phase' });
    expect(sim.dispatch({ type: 'set_mode', towerId: 1, mode: 'build' }).accepted).toBe(true);
    sim.dispatch({ type: 'pause' }); const paused = sim.capture();
    for (const command of [{ type: 'set_mode', towerId: 1, mode: 'defend' }, { type: 'set_priority', towerId: 1, priority: 'first_spawned' }, { type: 'place_tower', definitionId: 'base_copilot', position: { x: 4, z: 0 }, facing: 0 }]) expect(sim.dispatch(command)).toMatchObject({ reason: 'paused' });
    advance(sim, 100); expect(sim.capture()).toEqual(paused);
  });
  it('matches preview and authoritative rejection and caps tower count', () => {
    const sim = createEncounter(blockerSlice, 'tower_test');
    expect(sim.previewPlacement('base_copilot', { x: -1.5, z: 0 })).toBe('blocked');
    const tiny = parseEncounter({ ...headlessSlice,
      map: { ...headlessSlice.map, routes: [{ ...headlessSlice.map.routes[0], points: [{ x: -9, z: 5.5 }, { x: 9, z: 5.5 }] }] },
      towerDefinitions: [{ ...headlessSlice.towerDefinitions[0], baseStats: { ...headlessSlice.towerDefinitions[0]!.baseStats, cost: 0, footprintRadius: .01 } }] });
    const many = createEncounter(tiny, 'tower_test');
    for (let i = 0; i < 100; i++) expect(place(many, -9 + i % 10, -5 + Math.floor(i / 10)).accepted).toBe(true);
    const before = many.capture(); expect(place(many, 5, 0)).toMatchObject({ reason: 'tower_limit' }); expect(many.capture()).toEqual(before);
  });
});

describe('coverage and local targeting', () => {
  it('uses inclusive Area radius, obstacle occlusion/tangency and independent blocker flags', () => {
    const tower = baseTower();
    expect(visibility(headlessSlice, tower, { x: 5, z: 0 })).toBe('visible');
    expect(visibility(headlessSlice, tower, { x: 5.001, z: 0 })).toBe('out_of_range');
    expect(visibility(blockerSlice, { ...tower, position: { x: -4, z: 0 } }, { x: 0, z: 0 })).toBe('occluded');
    expect(visibility(blockerSlice, { ...tower, position: { x: -4, z: 1 } }, { x: 0, z: 1 })).toBe('occluded');
    const transparent = parseEncounter({ ...blockerSlice, map: { ...blockerSlice.map, obstacles: blockerSlice.map.obstacles.map(item => ({ ...item, blocksSight: false })) } });
    expect(visibility(transparent, { ...tower, position: { x: -4, z: 0 } }, { x: 0, z: 0 })).toBe('visible');
  });
  it('supports cone edges, facing and origin', () => {
    const tower = { ...baseTower(), definitionId: 'cone_probe', coverageKind: 'cone' as const };
    expect(visibility(headlessSlice, tower, { x: 2, z: 2 })).toBe('visible');
    expect(visibility(headlessSlice, tower, { x: 2, z: 2.01 })).toBe('outside_cone');
    expect(visibility(headlessSlice, tower, { x: -2, z: 0 })).toBe('outside_cone');
    expect(visibility(headlessSlice, { ...tower, facing: 180 }, { x: -2, z: 0 })).toBe('visible');
    expect(visibility(headlessSlice, tower, { x: 0, z: 0 })).toBe('visible');
  });
  it.each([['build', 1], ['defend', 2], ['auto', 2]] as const)('%s selects the eligible category', (mode, id) => {
    const state = initialState(headlessSlice, 'tower_test'), compiled = compileEncounter(headlessSlice);
    state.entities = [{ id: 1, definitionId: 'coding_task', routeId: 'main_route', kind: 'work', spawnedTick: 1, travelUnits: 0, distance: 9, remaining: 10 }, { id: 2, definitionId: 'bug', routeId: 'main_route', kind: 'problem', spawnedTick: 1, travelUnits: 0, distance: 8, remaining: 10 }];
    expect(chooseTarget(headlessSlice, compiled, state, { ...baseTower(), action: { ...baseTower().action!, mode } })).toBe(id);
    state.entities = state.entities.filter(entity => entity.id !== id);
    if (mode !== 'auto') expect(chooseTarget(headlessSlice, compiled, state, { ...baseTower(), action: { ...baseTower().action!, mode } })).toBeNull();
  });
  it('selects remaining route distance or first-spawned, with stable ties and no global targets', () => {
    const state = initialState(headlessSlice, 'tower_test'), compiled = compileEncounter(headlessSlice);
    state.entities = [1, 2].map(id => ({ id, definitionId: 'coding_task', routeId: 'main_route', kind: 'work', spawnedTick: 1, travelUnits: 0, distance: id === 1 ? 8 : 9, remaining: 10 }));
    expect(chooseTarget(headlessSlice, compiled, state, baseTower())).toBe(2);
    expect(chooseTarget(headlessSlice, compiled, state, { ...baseTower(), action: { ...baseTower().action!, priority: 'first_spawned' } })).toBe(1);
    state.entities[0]!.distance = 9; expect(chooseTarget(headlessSlice, compiled, state, baseTower())).toBe(1);
    expect(chooseTarget(headlessSlice, compiled, state, { ...baseTower(), position: { x: 9, z: 5 } })).toBeNull();
  });
  it('honors Auto commitment but immediately drops invalid targets', () => {
    const state = initialState(headlessSlice, 'tower_test'), compiled = compileEncounter(headlessSlice);
    state.tick = 10;
    state.entities = [{ id: 1, definitionId: 'coding_task', routeId: 'main_route', kind: 'work', spawnedTick: 1, travelUnits: 0, distance: 9, remaining: 10 }, { id: 2, definitionId: 'bug', routeId: 'main_route', kind: 'problem', spawnedTick: 1, travelUnits: 0, distance: 8, remaining: 10 }];
    const tower = { ...baseTower(), action: { ...baseTower().action!, targetId: 1, commitmentUntil: 30 } };
    expect(chooseTarget(headlessSlice, compiled, state, tower)).toBe(1);
    state.tick = 30; expect(chooseTarget(headlessSlice, compiled, state, tower)).toBe(2);
    state.tick = 10; state.entities[0]!.distance = 0; expect(chooseTarget(headlessSlice, compiled, state, tower)).toBe(2);
  });
  it('releases an occluded target after movement before publishing', () => {
    const content = parseEncounter({ ...blockerSlice, definitions: blockerSlice.definitions.map(item => item.kind === 'work' ? { ...item, requiredWork: 1000 } : item), wave: { id: 'one', spawns: [headlessSlice.wave.spawns[0]] } });
    const sim = createEncounter(content, 'tower_test'); place(sim, -4, 0); sim.dispatch({ type: 'start' });
    advance(sim, 150); // Work at (0,0), behind server.
    expect(sim.capture().towers[0]!.action!.targetId).toBeNull();
    expect(sim.capture().entities[0]!.remaining).toBeGreaterThan(0);
  });
});

describe('actions, outcomes and continuation', () => {
  it.each([['build', 94, 70, 0, 2, 0], ['defend', 80, 100, 2, 0, 2]] as const)('%s produces only its allowed outcomes', (mode, compute, health, debt, completed, resolved) => {
    const sim = createEncounter(headlessSlice, 'tower_test'); place(sim); sim.dispatch({ type: 'set_mode', towerId: 1, mode }); sim.dispatch({ type: 'start' }); advance(sim, 500);
    expect(sim.capture()).toMatchObject({ compute, productHealth: health, debt, totals: { completedWork: completed, resolvedProblems: resolved } });
    expect(restoreEncounter(headlessSlice, sim.capture()).capture()).toEqual(sim.capture());
  });
  it('clears the mixed fixture with one Base and exact economy', () => {
    const sim = createEncounter(headlessSlice, 'tower_test'); place(sim); sim.dispatch({ type: 'start' }); const events = advance(sim, 500);
    expect(sim.capture()).toMatchObject({ phase: 'drained', tick: 211, compute: 104, productHealth: 100, debt: 0, productProgress: 2,
      totals: { completedWork: 2, resolvedProblems: 2, computeEarned: 34, computeSpent: 30, healingReceived: 0 } });
    expect(events.filter(event => event.type === 'tower_action')).toHaveLength(8);
    expect(events.filter(event => event.type === 'work_completed')).toHaveLength(2);
    const end = sim.capture(); expect(advance(sim, 500)).toEqual([]); expect(sim.capture()).toEqual(end);
    expect(restoreEncounter(headlessSlice, end).capture()).toEqual(end);
  });
  it('uses exact readiness ticks with no idle burst and no paused actions', () => {
    const sim = createEncounter(one(), 'tower_test'); place(sim); sim.dispatch({ type: 'start' });
    const first = advance(sim, 1); expect(first.filter(event => event.type === 'tower_action')).toHaveLength(1);
    expect(sim.capture().towers[0]!.action!.readyTick).toBe(31); advance(sim, 29); expect(sim.capture().entities[0]!.remaining).toBe(5);
    sim.dispatch({ type: 'pause' }); const paused = sim.capture(); advance(sim, 60); expect(sim.capture()).toEqual(paused);
    sim.dispatch({ type: 'resume' }); expect(sim.advanceOneTick().events.some(event => event.type === 'work_completed')).toBe(true);
    const delayed = createEncounter(one('problem'), 'tower_test'); place(delayed); delayed.dispatch({ type: 'start' });
    advance(delayed, 60); expect(delayed.capture().towers[0]!.action!.readyTick).toBe(0);
    expect(delayed.advanceOneTick().events.filter(event => event.type === 'tower_action')).toHaveLength(1);
  });
  it('aggregates simultaneous contributions, consumes both cooldowns, and rewards once', () => {
    const sim = createEncounter(one(), 'tower_test'); place(sim, -5, 0); place(sim, -6, 0); sim.dispatch({ type: 'start' });
    const events = sim.advanceOneTick().events;
    expect(events.filter(event => event.type === 'tower_action')).toHaveLength(2);
    expect(events.filter(event => event.type === 'work_completed')).toHaveLength(1);
    expect(sim.capture()).toMatchObject({ compute: 52, productProgress: 1, phase: 'drained', towers: [{ action: { readyTick: 31 } }, { action: { readyTick: 31 } }] });
  });
  it('caps healing but still pays at full health', () => {
    for (const health of [98, 100]) {
      const content = one('work', { product: { maximumHealth: 100, initialHealth: health } });
      const sim = createEncounter(content, 'tower_test'); place(sim); sim.dispatch({ type: 'start' }); advance(sim, 31);
      expect(sim.capture()).toMatchObject({ productHealth: 100, compute: 82, productProgress: 1, totals: { healingReceived: 100 - health } });
      expect(restoreEncounter(content, sim.capture()).capture()).toEqual(sim.capture());
    }
  });
  it('settles completion before same-tick endpoint and never grants partial rewards', () => {
    const short = one('work', { map: { ...headlessSlice.map, routes: [{ ...headlessSlice.map.routes[0]!, points: [{ x: -5, z: 0 }, { x: -4.99, z: 0 }] }] }, definitions: headlessSlice.definitions.map(item => item.kind === 'work' ? { ...item, requiredWork: 5 } : item) });
    const sim = createEncounter(short, 'tower_test'); place(sim, -5, 1); sim.dispatch({ type: 'start' }); const events = sim.advanceOneTick().events;
    expect(events.some(event => event.type === 'work_completed')).toBe(true); expect(events.some(event => event.type === 'work_missed')).toBe(false);
    const partial = one('work', { definitions: headlessSlice.definitions.map(item => item.kind === 'work' ? { ...item, requiredWork: 1000 } : item) });
    const missed = createEncounter(partial, 'tower_test'); place(missed); missed.dispatch({ type: 'start' }); advance(missed, 300);
    expect(missed.capture()).toMatchObject({ compute: 70, debt: 1, productProgress: 0 });
  });
  it.each([0, 1, 15, 30, 31, 60, 61, 100, 150, 211])('restores tower state and identical event suffix at tick %s', tick => {
    const sim = createEncounter(headlessSlice, 'tower_test'); place(sim); sim.dispatch({ type: 'start' }); advance(sim, tick);
    if (sim.capture().phase === 'active') sim.dispatch({ type: 'pause' });
    const restored = restoreEncounter(headlessSlice, JSON.parse(JSON.stringify(sim.capture())));
    expect(restored.capture()).toEqual(sim.capture());
    for (const engine of [sim, restored]) if (engine.capture().paused) engine.dispatch({ type: 'resume' });
    expect(advance(restored, 500)).toEqual(advance(sim, 500)); expect(restored.capture()).toEqual(sim.capture());
  });
  it('rejects corrupt tower references, placement, readiness, outcomes and accounting', () => {
    const sim = createEncounter(headlessSlice, 'tower_test'); place(sim); sim.dispatch({ type: 'start' }); advance(sim, 61);
    const state = sim.capture();
    for (const change of [{ nextTowerId: 1 }, { compute: 999 }, { productProgress: 2 }, { outcomes: [] }, { schemaVersion: 1 }]) expect(() => restoreEncounter(headlessSlice, { ...state, ...change })).toThrow();
    for (const change of [{ definitionId: 'missing' }, { position: { x: 100, z: 0 } }, { targetId: 999 }, { readyTick: 9999 }, { commitmentUntil: 9999 }]) expect(() => restoreEncounter(headlessSlice, { ...state, towers: [{ ...state.towers[0], ...change }] })).toThrow();
    expect(() => restoreEncounter(headlessSlice, { ...state, outcomes: state.outcomes.map(outcome => ({ ...outcome, compute: 999 })) })).toThrow();
  });
});



import { describe, expect, it } from 'vitest';
import { headlessSlice, fragileSlice } from '../../src/content/levels/headlessSlice';
import { parseEncounter } from '../../src/content/schemas/encounter';
import { towerDefinitionSchema } from '../../src/content/schemas/gameplayDefinitions';
import { createEncounter, restoreEncounter } from '../../src/simulation/encounter';
import type { Encounter, EncounterEvent } from '../../src/simulation/encounter';

function advance(sim: Encounter, ticks: number) {
  const events: EncounterEvent[] = [];
  for (let i = 0; i < ticks; i++) events.push(...sim.advanceOneTick().events);
  return events;
}
function start(content: unknown = headlessSlice) { const sim = createEncounter(content, 'test_run'); sim.dispatch({ type: 'start' }); return sim; }
const copy = () => JSON.parse(JSON.stringify(headlessSlice));

describe('encounter content', () => {
  it.each([
    (value: ReturnType<typeof copy>) => { value.product.initialHealth = 101; },
    (value: ReturnType<typeof copy>) => { value.definitions[0].speed = 0; },
    (value: ReturnType<typeof copy>) => { value.definitions[1].id = value.definitions[0].id; },
    (value: ReturnType<typeof copy>) => { value.wave.spawns[0].routeId = 'missing'; },
    (value: ReturnType<typeof copy>) => { value.wave.spawns[0].definitionId = 'missing'; },
    (value: ReturnType<typeof copy>) => { value.wave.spawns[0].offsetTicks = 0.5; },
    (value: ReturnType<typeof copy>) => { value.definitions[0].severityDamage = 20; },
    (value: ReturnType<typeof copy>) => { value.map.routes[0].width = 0; },
    (value: ReturnType<typeof copy>) => { value.map.routes[0].points[1] = value.map.routes[0].points[0]; },
    (value: ReturnType<typeof copy>) => { value.definitions[0].speed = 0.1; value.map.routes[0].points[1].x = 10_000; },
  ])('rejects invalid content before construction', mutate => {
    const content = copy(); mutate(content); expect(() => createEncounter(content, 'test_run')).toThrow();
  });
  it('validates actual Base Copilot coverage contracts without enabling placement yet', () => {
    const definition = { ...headlessSlice.towerDefinitions[0], id: 'base', kind: 'targeted', coverage: { kind: 'cone', angleDegrees: 90 }, baseStats: { cost: 30, footprintRadius: 0.4, range: 5, workPerAction: 1, damagePerAction: 1, cooldownTicks: 30, commitmentTicks: 20 } };
    expect(towerDefinitionSchema.safeParse(definition).success).toBe(true);
    expect(towerDefinitionSchema.safeParse({ ...definition, coverage: { ...definition.coverage, angleDegrees: 361 } }).success).toBe(false);
  });
  it('copies and freezes authored data', () => {
    const content = copy(); const sim = createEncounter(content, 'test_run'); content.definitions[0].speed = 100;
    expect(sim.content.definitions[0]!.speed).toBe(4);
    expect(Object.isFrozen(sim.content.map.routes[0]!.points)).toBe(true);
  });
});

describe('dual-flow lifecycle', () => {
  it('requires manual start and spawns offset-zero traffic on the first active tick', () => {
    const sim = createEncounter(headlessSlice, 'test_run');
    expect(sim.advanceOneTick()).toEqual({ advanced: false, events: [] });
    expect(sim.dispatch({ type: 'start' }).accepted).toBe(true);
    expect(sim.dispatch({ type: 'start' })).toMatchObject({ accepted: false, reason: 'wrong_phase' });
    expect(sim.advanceOneTick().events).toMatchObject([{ type: 'spawned', entityId: 1, kind: 'work', tick: 1 }]);
    expect(sim.capture().entities[0]!.distance).toBeCloseTo(4 / 60);
  });
  it('settles missed work and leaked problems once, with no rewards or immediate bugs', () => {
    const sim = start(); const events = advance(sim, 480);
    expect(sim.capture()).toMatchObject({ phase: 'drained', tick: 480, productHealth: 70, debt: 2, compute: 100, productProgress: 0,
      spawnCursor: 4, nextEntityId: 5, entities: [], totals: { missedWork: 2, leakedProblems: 2, damageTaken: 30 } });
    expect(events.filter(event => event.type === 'spawned')).toHaveLength(4);
    expect(events.filter(event => event.type === 'work_missed')).toHaveLength(2);
    expect(events.filter(event => event.type === 'problem_leaked')).toHaveLength(2);
    expect(events.at(-1)).toMatchObject({ type: 'wave_drained', tick: 480 });
    const final = sim.capture(); expect(advance(sim, 100)).toEqual([]); expect(sim.capture()).toEqual(final);
    expect(sim.dispatch({ type: 'set_speed', speed: 2 }).accepted).toBe(false);
  });
  it('clamps lethal damage, latches failure, and never emits drainage', () => {
    const sim = start(fragileSlice); const events = advance(sim, 600);
    expect(sim.capture()).toMatchObject({ tick: 480, phase: 'failed', productHealth: 0, totals: { damageTaken: 20 } });
    expect(events.filter(event => event.type === 'problem_leaked')).toMatchObject([{ damage: 15 }, { damage: 5 }]);
    expect(events.at(-1)?.type).toBe('product_destroyed');
    expect(events.some(event => event.type === 'wave_drained')).toBe(false);
  });
  it('settles simultaneous endpoints in creation order and stops after fatal damage', () => {
    const content = parseEncounter({ ...fragileSlice, product: { maximumHealth: 1, initialHealth: 1 }, wave: { id: 'fatal_order', spawns: [
      { ...headlessSlice.wave.spawns[1], offsetTicks: 0 }, { ...headlessSlice.wave.spawns[0], offsetTicks: 0 },
    ] } });
    const sim = start(content); const events = advance(sim, 300);
    expect(events.slice(-2)).toMatchObject([{ type: 'problem_leaked', entityId: 1 }, { type: 'product_destroyed' }]);
    expect(sim.capture()).toMatchObject({ phase: 'failed', debt: 0, entities: [{ id: 2, distance: 20 }] });
    expect(restoreEncounter(content, sim.capture()).capture()).toEqual(sim.capture());
  });
  it('does not drain an empty gap before a later scheduled spawn', () => {
    const content = parseEncounter({ ...headlessSlice, wave: { ...headlessSlice.wave, spawns: [headlessSlice.wave.spawns[0], { ...headlessSlice.wave.spawns[1], offsetTicks: 600 }] } });
    const sim = start(content); advance(sim, 300);
    expect(sim.capture()).toMatchObject({ phase: 'active', entities: [], spawnCursor: 1 });
    advance(sim, 301); expect(sim.capture().entities[0]!.id).toBe(2);
  });
  it('sorts authored offsets with stable authored-order ties', () => {
    const content = parseEncounter({ ...headlessSlice, wave: { id: 'unsorted', spawns: [headlessSlice.wave.spawns[1], headlessSlice.wave.spawns[0], headlessSlice.wave.spawns[0]] } });
    const sim = start(content); const events = advance(sim, 61).filter(event => event.type === 'spawned');
    expect(events).toMatchObject([{ entityId: 1, kind: 'work' }, { entityId: 2, kind: 'work' }, { entityId: 3, kind: 'problem' }]);
  });
  it('traverses route corners by distance and clamps short-route overshoot', () => {
    const sim = start(); advance(sim, 150); expect(sim.positions()[0]!.position).toEqual({ x: 0, z: 0 });
    const content = parseEncounter({ ...headlessSlice, map: { ...headlessSlice.map, routes: [{ id: 'main_route', points: [{ x: 0, z: 0 }, { x: 0.01, z: 0 }, { x: 0.01, z: 0.01 }] }] } });
    const short = start(content); const first = short.advanceOneTick();
    expect(first.events.map(event => event.type)).toEqual(['spawned', 'work_missed']);
    expect(short.capture().entities).toEqual([]);
  });
  it('rejects invalid commands without mutations and freezes every gameplay field while paused', () => {
    const sim = start(); advance(sim, 70); sim.dispatch({ type: 'pause' }); const paused = sim.capture();
    for (const command of [{ type: 'set_speed', speed: 2 }, { type: 'start' }, { type: 'place_tower' }, { type: 'resume', extra: true }]) expect(sim.dispatch(command).accepted).toBe(false);
    advance(sim, 600); expect(sim.capture()).toEqual(paused);
    sim.dispatch({ type: 'resume' }); sim.advanceOneTick(); expect(sim.capture().tick).toBe(71);
  });
  it.each([0, 1, 60, 61, 150, 299, 300, 359, 360, 419, 420, 479, 480])('round-trips tick %i and reproduces all future events', tick => {
    const sim = start(); advance(sim, tick);
    if (sim.capture().phase === 'active') sim.dispatch({ type: 'pause' });
    const restored = restoreEncounter(headlessSlice, JSON.parse(JSON.stringify(sim.capture())));
    expect(restored.capture()).toEqual(sim.capture());
    for (const engine of [sim, restored]) if (engine.capture().paused) engine.dispatch({ type: 'resume' });
    expect(advance(restored, 500)).toEqual(advance(sim, 500)); expect(restored.capture()).toEqual(sim.capture());
  });
  it.each([
    { contentSignature: 'wrong' }, { schemaVersion: 1 }, { nextEntityId: 1 }, { spawnCursor: 0 }, { entities: [] },
    { debt: 1 }, { compute: 101 }, { productProgress: 1 }, { productHealth: 99 }, { eventSequence: 0 }, { phase: 'drained' },
  ])('rejects inconsistent restored state %j', change => {
    const sim = start(); advance(sim, 100);
    expect(() => restoreEncounter(headlessSlice, { ...sim.capture(), ...change })).toThrow();
  });
  it('rejects duplicate or corrupted entity progress and changed content', () => {
    const sim = start(); advance(sim, 100); const state = sim.capture();
    expect(() => restoreEncounter(headlessSlice, { ...state, entities: [...state.entities, state.entities[0]] })).toThrow();
    expect(() => restoreEncounter(headlessSlice, { ...state, entities: state.entities.map(entity => ({ ...entity, remaining: 1 })) })).toThrow();
    expect(() => restoreEncounter({ ...headlessSlice, initialCompute: 101 }, state)).toThrow();
    expect(Object.isFrozen(state.entities[0])).toBe(true);
    expect(() => { (state.entities[0] as { distance: number }).distance = 99; }).toThrow();
  });
});


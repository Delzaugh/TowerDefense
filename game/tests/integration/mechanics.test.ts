import { describe, expect, it } from 'vitest';
import { testMap, fragileTestMap } from '../../src/content/levels/testMap';
import { headlessSlice } from '../../src/content/levels/headlessSlice';
import { parseEncounter } from '../../src/content/schemas/encounter';
import { compileWaveRecipe, importWaveRecipe, recipeFromContent, secondsToTicks } from '../../src/content/waveRecipe';
import { createEncounter, restoreEncounter } from '../../src/simulation/encounter';
import { prepareBlueprint, captureBlueprint } from '../../src/simulation/encounter/blueprint';
import { facingToward } from '../../src/simulation/aiming';
import { createEncounterLab } from '../../src/session/createEncounterLab';
import { createMemoryRepository } from '../../src/persistence/saveRepository';
import { createLabSave, parseLabSave } from '../../src/persistence/testLabSave';
import { fakeHost } from '../fixtures/helpers';

const place = { type: 'place_tower', definitionId: 'base_copilot', position: { x: -5, z: 0 }, facing: 37.4 };
const recipe = (rows: unknown) => ({ format: 'tower.wave.recipe', version: 1, rows });
const row = { definitionId: 'bug', routeId: 'main_route', startTick: 0, count: 3, intervalTicks: 30 };

describe('instance coverage', () => {
  it('funds ten diagnostic towers and enforces the authored cap during placement and restoration', () => {
    const sim = createEncounter(testMap, 'ten_towers');
    expect(testMap.initialCompute).toBe(300); expect(headlessSlice.initialCompute).toBe(100);
    for (const z of [-4, 4]) for (const x of [-8, -4, 0, 4, 8]) expect(sim.dispatch({ ...place, position: { x, z } }).accepted).toBe(true);
    const before = sim.capture(); expect(before.compute).toBe(0); expect(before.towers).toHaveLength(10);
    expect(sim.dispatch({ ...place, position: { x: 0, z: 0 } })).toMatchObject({ reason: 'tower_limit' }); expect(sim.capture()).toEqual(before);
    expect(restoreEncounter(testMap, before).capture()).toEqual(before);
    const wider = parseEncounter({ ...testMap, initialCompute: 600, towerLimit: 11 });
    const eleven = prepareBlueprint(wider, captureBlueprint(before, null), 'eleven').encounter;
    expect(eleven.dispatch({ ...place, position: { x: 2, z: 0 } }).accepted).toBe(true);
    const capped = parseEncounter({ ...wider, towerLimit: 10 });
    const signature = createEncounter(capped, 'signature').capture().contentSignature;
    expect(() => restoreEncounter(capped, { ...eleven.capture(), contentSignature: signature })).toThrow('Invalid saved command: tower_limit');
  });
  it('switches only one tower, preserving identity, economy, settings and facing', () => {
    const sim = createEncounter(testMap, 'coverage_test'); sim.dispatch(place); sim.dispatch({ ...place, position: { x: 4, z: 0 } });
    sim.dispatch({ type: 'set_mode', towerId: 1, mode: 'build' });
    const before = sim.capture();
    expect(sim.dispatch({ type: 'set_coverage', towerId: 1, coverageKind: 'cone' }).accepted).toBe(true);
    expect(sim.capture().towers[0]).toEqual({ ...before.towers[0], coverageKind: 'cone' });
    expect(sim.capture().towers[1]).toEqual(before.towers[1]); expect(sim.capture().compute).toBe(240);
    expect(sim.inspectCoverage(sim.capture().towers[0]!, { x: -7, z: 0 })).toBe('outside_cone');
    sim.dispatch({ type: 'set_coverage', towerId: 1, coverageKind: 'area' });
    expect(sim.inspectCoverage(sim.capture().towers[0]!, { x: -7, z: 0 })).toBe('visible');
    expect(restoreEncounter(testMap, sim.capture()).capture()).toEqual(sim.capture());
  });
  it('rejects unsupported coverage, malformed commands and restored choices atomically', () => {
    const sim = createEncounter(headlessSlice, 'coverage_test'); sim.dispatch(place); const before = sim.capture();
    expect(sim.dispatch({ type: 'set_coverage', towerId: 1, coverageKind: 'cone' })).toMatchObject({ reason: 'unsupported_coverage' });
    expect(sim.dispatch({ type: 'set_coverage', towerId: 999, coverageKind: 'area' })).toMatchObject({ reason: 'unknown_tower' });
    expect(sim.dispatch({ type: 'set_coverage', towerId: 1, coverageKind: 'sphere' })).toMatchObject({ reason: 'invalid_command' });
    expect(sim.capture()).toEqual(before);
    expect(() => restoreEncounter(headlessSlice, { ...before, towers: [{ ...before.towers[0], coverageKind: 'cone' }] })).toThrow();
    expect(() => restoreEncounter(headlessSlice, { ...before, schemaVersion: 2 })).toThrow();
    expect(() => parseEncounter({ ...testMap, towerDefinitions: [{ ...testMap.towerDefinitions[0], coverageAlternatives: [{ kind: 'area' }] }] })).toThrow();
  });
  it('keeps coverage/facing planning-only and mode/priority active but never paused', () => {
    const sim = createEncounter(testMap, 'coverage_test'); sim.dispatch(place); sim.dispatch({ type: 'start' });
    expect(sim.dispatch({ type: 'set_coverage', towerId: 1, coverageKind: 'cone' })).toMatchObject({ reason: 'wrong_phase' });
    expect(sim.dispatch({ type: 'set_facing', towerId: 1, facing: 12 })).toMatchObject({ reason: 'wrong_phase' });
    expect(sim.dispatch({ type: 'set_priority', towerId: 1, priority: 'first_spawned' }).accepted).toBe(true);
    sim.dispatch({ type: 'pause' }); const before = sim.capture();
    expect(sim.dispatch({ type: 'set_coverage', towerId: 1, coverageKind: 'cone' })).toMatchObject({ reason: 'paused' });
    expect(sim.capture()).toEqual(before);
  });
  it('changes actual work eligibility, not just preview', () => {
    const area = createEncounter(testMap, 'aim_test'), cone = createEncounter(testMap, 'aim_test');
    for (const sim of [area, cone]) sim.dispatch({ ...place, facing: 0 });
    cone.dispatch({ type: 'set_coverage', towerId: 1, coverageKind: 'cone' });
    for (const sim of [area, cone]) { sim.dispatch({ type: 'start' }); sim.advanceOneTick(); }
    expect(area.capture().entities[0]!.remaining).toBe(5); expect(cone.capture().entities[0]!.remaining).toBe(10);
  });
});
describe('aiming and queue compiler', () => {
  it.each([[1, 0, 0], [0, 1, 90], [-1, 0, 180], [0, -1, 270], [1, -0.00001, 0]])('aims %s,%s at %s degrees', (x, z, angle) => {
    expect(facingToward({ x: 0, z: 0 }, { x, z })).toBe(angle);
  });
  it('ignores center and nonfinite aiming', () => {
    expect(facingToward({ x: 0, z: 0 }, { x: .01, z: 0 })).toBeNull();
    expect(facingToward({ x: 0, z: 0 }, { x: Infinity, z: 0 })).toBeNull();
  });
  it('expands stable ties, preserves tick semantics and freezes output', () => {
    const result = compileWaveRecipe(testMap, recipe([row, { ...row, definitionId: 'coding_task', count: 2, intervalTicks: 0 }]));
    expect(result.schedule.map(item => [item.definitionId, item.spawnTick])).toEqual([['bug', 1], ['coding_task', 1], ['coding_task', 1], ['bug', 31], ['bug', 61]]);
    expect(Object.isFrozen(result.content.wave.spawns)).toBe(true);
    expect(compileWaveRecipe(testMap, recipeFromContent(testMap)).content).toEqual(testMap);
    const sim = createEncounter(result.content, 'queue_test'); sim.dispatch({ type: 'start' }); sim.advanceOneTick(); expect(sim.capture().spawnCursor).toBe(3);
  });
  it.each([[], [{ ...row, count: 0 }], [{ ...row, count: 1001 }], [{ ...row, count: 1000 }, row], [{ ...row, startTick: 36000 }], [{ ...row, definitionId: 'missing' }], [{ ...row, routeId: 'missing' }]].map(rows => ({ rows })))('rejects invalid queue $rows', ({ rows }) => {
    expect(() => compileWaveRecipe(testMap, recipe(rows))).toThrow();
  });
  it('accepts the exact size bound, rounds seconds and bounds JSON import', () => {
    expect(compileWaveRecipe(testMap, recipe([{ ...row, count: 1000, intervalTicks: 0 }])).schedule).toHaveLength(1000);
    expect(secondsToTicks('0.025')).toBe(2); expect(() => secondsToTicks('')).toThrow(); expect(() => secondsToTicks('Infinity')).toThrow();
    expect(importWaveRecipe(JSON.stringify(recipe([row]))).rows[0]).toEqual(row);
    expect(() => importWaveRecipe(' '.repeat(250001))).toThrow();
  });
  it('reruns the identical recipe deterministically', () => {
    const content = compileWaveRecipe(testMap, recipe([row])).content;
    const results = [0, 1].map(() => { const sim = createEncounter(content, 'same_run'); sim.dispatch({ ...place, facing: 0 }); sim.dispatch({ type: 'start' }); for (let i = 0; i < 600; i++) sim.advanceOneTick(); return sim.capture(); });
    expect(results[0]).toEqual(results[1]);
  });
});
describe('repeatable experiment lifecycle', () => {
  it('applies atomically, retains settings, rejects active edits and reconstructs a starting defense', () => {
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'experiment'); lab.dispatch(place);
    lab.dispatch({ type: 'set_coverage', towerId: 1, coverageKind: 'cone' }); lab.placeMarker({ x: -7, z: 0 });
    const before = lab.getSnapshot(); expect(lab.applyRecipe(recipe([]), true)).toBe(false); expect(lab.getSnapshot().snapshot).toEqual(before.snapshot);
    expect(lab.applyRecipe(recipe([row]), true)).toBe(true); expect(lab.content.wave.spawns).toHaveLength(3);
    expect(lab.getSnapshot().snapshot.towers[0]).toMatchObject({ facing: 37.4, coverageKind: 'cone' });
    lab.setAutomatic(false); lab.dispatch({ type: 'start' }); lab.step(60);
    expect(lab.applyRecipe(recipe([row]), false)).toBe(false);
    lab.dispatch({ ...place, position: { x: 4, z: 0 } });
    lab.prepareAgain(); expect(lab.getSnapshot().snapshot).toMatchObject({ tick: 0, compute: 270, productProgress: 0 });
    expect(lab.getSnapshot().snapshot.towers).toHaveLength(1); expect(lab.getSnapshot().marker).toEqual({ x: -7, z: 0 });
  });
  it('rejects an unaffordable blueprint and does not transplant runtime targets or cooldowns', () => {
    const sim = createEncounter(testMap, 'blueprint'); sim.dispatch(place);
    const blueprint = captureBlueprint(sim.capture(), null);
    expect(() => prepareBlueprint(parseEncounter({ ...testMap, initialCompute: 20 }), blueprint, 'fresh')).toThrow('insufficient compute');
    expect(prepareBlueprint(testMap, blueprint, 'fresh').encounter.capture().towers[0]).toMatchObject({ action: { readyTick: 0, targetId: null, commitmentUntil: 0 } });
  });
  it('restores custom content and starting blueprint across fresh sessions', async () => {
    const repository = createMemoryRepository();
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'experiment', repository);
    lab.dispatch(place); lab.applyRecipe(recipe([row]), true); lab.setAutomatic(false); lab.dispatch({ type: 'start' }); for (let i = 0; i < 12; i++) lab.step(60);
    await lab.save();
    const loaded = createEncounterLab(testMap, fakeHost().host, () => 'loaded', repository); await loaded.load();
    expect(loaded.content).toEqual(lab.content); expect(loaded.getSnapshot().snapshot).toEqual(lab.getSnapshot().snapshot);
    loaded.prepareAgain(); expect(loaded.getSnapshot().snapshot).toMatchObject({ phase: 'preparation', compute: 270, tick: 0 });
  });
  it('validates content, recipe, blueprint, preset and save versions before loading', () => {
    const sim = createEncounter(testMap, 'save_test'); sim.dispatch(place);
    const valid = createLabSave(testMap, sim.capture(), null);
    for (const change of [{ version: 1 }, { recipe: recipe([row]) }, { blueprint: { towers: [{ ...valid.blueprint.towers[0], position: { x: 100, z: 0 } }], marker: null } }]) expect(() => parseLabSave(testMap, { ...valid, ...change })).toThrow();
    expect(() => parseLabSave(fragileTestMap, valid)).toThrow();
  });
  it('capture/restore preserves the starting blueprint and clears it on reset', () => {
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'experiment'); lab.dispatch(place);
    lab.dispatch({ type: 'start' }); lab.capture(); lab.dispatch({ ...place, position: { x: 4, z: 0 } });
    lab.restore(); lab.prepareAgain(); expect(lab.getSnapshot().snapshot.towers).toHaveLength(1);
    lab.reset(); lab.prepareAgain(); expect(lab.getSnapshot().snapshot.towers).toHaveLength(0);
  });
  it('failed custom save loading preserves applied content, recipe and current snapshot', async () => {
    const repository = createMemoryRepository(); const lab = createEncounterLab(testMap, fakeHost().host, () => 'experiment', repository);
    lab.applyRecipe(recipe([row]), false); const before = lab.getSnapshot();
    await repository.write({ format: 'tower.test-lab.save', version: 1 }, null); await lab.load();
    expect(lab.getSnapshot().content).toEqual(before.content); expect(lab.getSnapshot().recipe).toEqual(before.recipe); expect(lab.getSnapshot().snapshot).toEqual(before.snapshot);
  });
});


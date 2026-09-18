import { describe, expect, it } from 'vitest';
import { testMap, fragileTestMap } from '../../src/content/levels/testMap';
import { createEncounterLab } from '../../src/session/createEncounterLab';
import { createEncounter } from '../../src/simulation/encounter';
import { createMemoryRepository } from '../../src/persistence/saveRepository';
import type { SaveRecord, SaveRepository } from '../../src/persistence/saveRepository';
import { createLabSave, parseLabSave } from '../../src/persistence/testLabSave';
import { fakeHost } from '../fixtures/helpers';

describe('unified test lab', () => {
  it('uses identical geometry for both health presets', () => { expect(testMap.map).toEqual(fragileTestMap.map); });
  it('runs marker and clock-probe diagnostics on the encounter clock, with no extra gameplay commands', () => {
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'test_run');
    lab.placeMarker({ x: -6, z: 2 });
    expect(lab.getSnapshot().marker).toEqual({ x: -6, z: 2 }); // Non-tower tools keep their own path policy.
    lab.placeMarker({ x: -7, z: 0 });
    expect(lab.getSnapshot()).toMatchObject({ marker: { x: -7, z: 0 }, sight: true, probe: { x: -8, z: 2 } });
    expect(lab.getSnapshot().snapshot.commandSequence).toBe(0);
    lab.placeMarker({ x: -1.5, z: 0 }); expect(lab.getSnapshot().notice).toContain('Rejected: blocked');
    expect(lab.getSnapshot().marker).toEqual({ x: -7, z: 0 });
    lab.setAutomatic(false); lab.dispatch({ type: 'start' }); lab.step(60);
    expect(lab.getSnapshot().probe).toEqual({ x: -6, z: 2 });
    lab.dispatch({ type: 'pause' }); const frozen = lab.getSnapshot(); lab.placeMarker({ x: 7, z: 0 }); lab.step(60); lab.clearMarker();
    expect(lab.getSnapshot().marker).toEqual(frozen.marker); expect(lab.getSnapshot().probe).toEqual(frozen.probe);
  });
  it('captures and restores marker together with gameplay, without adding costs', () => {
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'test_run');
    lab.placeMarker({ x: -7, z: 0 }); lab.capture(); lab.placeMarker({ x: 7, z: 0 }); lab.restore();
    expect(lab.getSnapshot().marker).toEqual({ x: -7, z: 0 }); expect(lab.getSnapshot().snapshot.compute).toBe(300);
    lab.reset(); expect(lab.getSnapshot().marker).toBeNull();
  });
  it('uses the same server blocker for diagnostic sight and marker exclusions', () => {
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'test_run');
    lab.placeMarker({ x: 0, z: 0 }); expect(lab.getSnapshot().sight).toBe(false);
    lab.placeMarker({ x: -7, z: 0 }); expect(lab.getSnapshot().sight).toBe(true);
  });
  it('saves and loads towers, marker, control state and terminal results', async () => {
    const repository = createMemoryRepository();
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'test_run', repository);
    lab.placeMarker({ x: -7, z: 0 }); lab.dispatch({ type: 'place_tower', definitionId: 'base_copilot', position: { x: -5, z: 0 }, facing: 0 });
    lab.dispatch({ type: 'set_speed', speed: 2 }); await lab.save(); const saved = lab.getSnapshot();
    lab.reset(); await lab.load(); expect(lab.getSnapshot().snapshot).toEqual(saved.snapshot); expect(lab.getSnapshot().marker).toEqual(saved.marker);
    lab.dispatch({ type: 'start' }); for (let i = 0; i < 4; i++) lab.step(60);
    expect(lab.getSnapshot().snapshot.phase).toBe('drained'); await lab.save(); lab.reset(); await lab.load();
    expect(lab.getSnapshot().snapshot).toMatchObject({ phase: 'drained', compute: 304, productProgress: 2 });
    expect(lab.getSnapshot().events).toEqual([]);
  });
  it('rejects paused active saves and corrupted/legacy marker envelopes', () => {
    const sim = createEncounter(testMap, 'test_run'); const prep = sim.capture();
    const valid = createLabSave(testMap, prep, null);
    for (const change of [{ version: 99 }, { format: 'tower.foundation.save' }, { marker: { x: -1.5, z: 0 } }, { marker: { x: 99, z: 0 } }]) expect(() => parseLabSave(testMap, { ...valid, ...change })).toThrow();
    expect(() => parseLabSave(fragileTestMap, valid)).toThrow();
    sim.dispatch({ type: 'start' }); sim.dispatch({ type: 'pause' }); expect(() => createLabSave(testMap, sim.capture(), null)).toThrow();
  });
  it('blocks mutation during pending I/O and ignores late reads after disposal', async () => {
    let resolve!: (value: SaveRecord | null) => void;
    const repository: SaveRepository = { read: () => new Promise(done => { resolve = done; }), write: async () => 1, close() {} };
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'test_run', repository);
    const loading = lab.load(); const state = lab.getSnapshot().snapshot;
    expect(lab.getSnapshot().busy).toBe(true); lab.dispatch({ type: 'start' }); lab.placeMarker({ x: 7, z: 0 }); lab.reset();
    expect(lab.applyRecipe(lab.getSnapshot().recipe, false)).toBe(false); lab.prepareAgain();
    expect(lab.getSnapshot().snapshot).toEqual(state); expect(lab.getSnapshot().marker).toBeNull();
    lab.dispose(); const disposed = lab.getSnapshot(); resolve(null); await loading; expect(lab.getSnapshot()).toBe(disposed);
  });
  it('surfaces storage failure and recovers without replacing live state', async () => {
    const repository: SaveRepository = { read: async () => ({ revision: 1, envelope: {} }), write: async () => { throw new Error('Storage unavailable'); }, close() {} };
    const lab = createEncounterLab(testMap, fakeHost().host, () => 'test_run', repository);
    const before = lab.getSnapshot().snapshot;
    await lab.load(); expect(lab.getSnapshot().snapshot).toEqual(before); expect(lab.getSnapshot().busy).toBe(false);
    await lab.save(); expect(lab.getSnapshot().notice).toBe('Storage unavailable'); expect(lab.getSnapshot().snapshot).toEqual(before);
  });
});

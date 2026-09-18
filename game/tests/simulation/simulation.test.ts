import { describe, expect, it } from 'vitest';
import { createSimulation, restoreSimulation } from '../../src/simulation/createSimulation';
import { scenario } from '../fixtures/helpers';

describe('deterministic simulation', () => {
  it('waits for manual start and emits completion exactly once', () => {
    const sim = createSimulation(scenario(3), 'run_test');
    expect(sim.advanceOneTick().advanced).toBe(false);
    expect(sim.dispatch({ type: 'start' }).accepted).toBe(true);
    expect(sim.dispatch({ type: 'start' }).accepted).toBe(false);
    sim.advanceOneTick(); sim.advanceOneTick();
    const result = sim.advanceOneTick();
    expect(result.events).toEqual([{ type: 'route_completed', tick: 3, sequence: 2 }]);
    expect(sim.capture().phase).toBe('complete');
    const end = sim.capture();
    expect(sim.advanceOneTick()).toEqual({ advanced: false, events: [] });
    expect(sim.capture()).toEqual(end);
    expect(sim.probePosition()).toEqual({ x: 8, z: 3 });
  });
  it('hard-freezes time and tactical commands without deferring them', () => {
    const sim = createSimulation(scenario(), 'run_test');
    sim.dispatch({ type: 'start' }); sim.advanceOneTick(); sim.dispatch({ type: 'pause' });
    const paused = sim.capture();
    for (let i = 0; i < 100; i++) expect(sim.advanceOneTick().advanced).toBe(false);
    for (const command of [{ type: 'set_speed', speed: 2 }, { type: 'place_marker', position: { x: -7, z: 0 } }, { type: 'start' }]) {
      expect(sim.dispatch(command)).toEqual({ accepted: false, reason: 'paused', events: [] });
    }
    expect(sim.capture()).toEqual(paused);
    expect(sim.dispatch({ type: 'resume' }).accepted).toBe(true);
    sim.advanceOneTick();
    expect(sim.capture()).toMatchObject({ tick: 2, paused: false, marker: null, speed: 1 });
  });
  it('keeps invalid commands and placements out of state', () => {
    const sim = createSimulation(scenario(), 'run_test');
    const initial = sim.capture();
    expect(sim.dispatch({ type: 'set_speed', speed: 3 })).toMatchObject({ accepted: false, reason: 'invalid_command' });
    expect(sim.dispatch({ type: 'start', hidden: true })).toMatchObject({ reason: 'invalid_command' });
    expect(sim.dispatch({ type: 'place_marker', position: { x: 0, z: 0 } })).toMatchObject({ reason: 'blocked' });
    expect(sim.dispatch({ type: 'place_marker', position: { x: 9.9, z: 0 } })).toMatchObject({ reason: 'outside_buildable' });
    expect(sim.capture()).toEqual(initial);
    expect(sim.dispatch({ type: 'place_marker', position: { x: -7, z: 0 } }).accepted).toBe(true);
    expect(sim.capture().marker).toEqual({ x: -7, z: 0 });
  });
  it('produces the same states and events for the same ordered commands', () => {
    const run = () => {
      const sim = createSimulation(scenario(), 'run_test');
      const events = [...sim.dispatch({ type: 'start' }).events];
      for (let tick = 0; tick < 600; tick++) {
        if (tick === 100) events.push(...sim.dispatch({ type: 'place_marker', position: { x: 7, z: 0 } }).events);
        if (tick === 150) events.push(...sim.dispatch({ type: 'set_speed', speed: 2 }).events);
        events.push(...sim.advanceOneTick().events);
      }
      return { state: sim.capture(), events };
    };
    expect(run()).toEqual(run());
  });
  it('restores a paused internal snapshot and continues without drift or replayed events', () => {
    const config = scenario();
    const original = createSimulation(config, 'run_test');
    original.dispatch({ type: 'start' });
    for (let i = 0; i < 137; i++) original.advanceOneTick();
    original.dispatch({ type: 'pause' });
    const restored = restoreSimulation(config, JSON.parse(JSON.stringify(original.capture())));
    expect(restored.capture()).toEqual(original.capture());
    for (const sim of [original, restored]) {
      sim.dispatch({ type: 'resume' });
      for (let i = 0; i < 463; i++) sim.advanceOneTick();
    }
    expect(restored.capture()).toEqual(original.capture());
  });
  it('detaches input and captured state', () => {
    const sim = createSimulation(scenario(), 'run_test');
    const command = { type: 'place_marker', position: { x: -7, z: 0 } };
    sim.dispatch(command); command.position.x = 0;
    const snapshot = sim.capture();
    expect(Object.isFrozen(snapshot.marker)).toBe(true);
    expect(() => { (snapshot as unknown as { marker: { x: number } }).marker.x = 0; }).toThrow();
    expect(sim.capture().marker?.x).toBe(-7);
  });
  it.each([
    { tick: 1 }, { paused: true }, { eventSequence: 8 }, { marker: { x: 0, z: 0 } },
    { phase: 'complete' }, { schemaVersion: 2 }, { ticksPerSecond: 30 }, { contentSignature: 'wrong' },
  ])('rejects an inconsistent restored snapshot %j', change => {
    const config = scenario();
    const state = createSimulation(config, 'run_test').capture();
    expect(() => restoreSimulation(config, { ...state, ...change })).toThrow();
  });
  it('rejects changed gameplay content even if its author forgot to change the version', () => {
    const state = createSimulation(scenario(), 'run_test').capture();
    expect(() => restoreSimulation(scenario(601), state)).toThrow('content');
  });
  it('returns blocked sight from the same logical obstacle used for placement', () => {
    const sim = createSimulation(scenario(28), 'run_test');
    expect(sim.markerHasSight()).toBeNull();
    sim.dispatch({ type: 'place_marker', position: { x: 0, z: 4 } });
    sim.dispatch({ type: 'start' });
    for (let i = 0; i < 14; i++) sim.advanceOneTick();
    expect(sim.probePosition()).toEqual({ x: 0, z: -3 });
    expect(sim.markerHasSight()).toBe(false);
  });
});

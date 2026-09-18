import { describe, expect, it } from 'vitest';
import { headlessSlice } from '../../src/content/levels/headlessSlice';
import { createEncounterLab } from '../../src/session/createEncounterLab';
import { fakeHost } from '../fixtures/helpers';

describe('encounter diagnostic session', () => {
  it('owns one loop, stable snapshots and complete idempotent cleanup', () => {
    const fake = fakeHost(); const lab = createEncounterLab(headlessSlice, fake.host, () => 'lab_run');
    expect(lab.getSnapshot()).toBe(lab.getSnapshot()); lab.start(); lab.start();
    expect(fake.frameCount()).toBe(1); expect(fake.listenerCount()).toBe(1);
    lab.dispose(); lab.dispose(); expect(fake.frameCount()).toBe(0); expect(fake.listenerCount()).toBe(0);
    const view = lab.getSnapshot(); lab.dispatch({ type: 'start' }); lab.reset(); lab.capture(); lab.setAutomatic(false); lab.step(60);
    expect(lab.getSnapshot()).toBe(view);
  });
  it('steps exact ticks only in manual active unpaused mode', () => {
    const fake = fakeHost(); const lab = createEncounterLab(headlessSlice, fake.host, () => 'lab_run');
    lab.dispatch({ type: 'start' }); lab.step(60); expect(lab.getSnapshot().snapshot.tick).toBe(0);
    lab.setAutomatic(false); lab.step(60); expect(lab.getSnapshot().snapshot.tick).toBe(60);
    lab.dispatch({ type: 'pause' }); lab.step(60); expect(lab.getSnapshot().snapshot.tick).toBe(60);
    lab.dispatch({ type: 'resume' }); lab.step(61); lab.step(-1); expect(lab.getSnapshot().snapshot.tick).toBe(60);
    lab.step(1); expect(lab.getSnapshot().snapshot.tick).toBe(61);
  });
  it('captures/restores actual simulation state without replaying events and resets attempt data', () => {
    const fake = fakeHost(); let id = 0; const lab = createEncounterLab(headlessSlice, fake.host, () => `run_${++id}`);
    lab.setAutomatic(false); lab.dispatch({ type: 'start' }); lab.step(60); lab.capture(); const captured = lab.getSnapshot().snapshot;
    for (let i = 0; i < 7; i++) lab.step(60);
    expect(lab.getSnapshot().snapshot.productHealth).toBe(70);
    lab.restore(); expect(lab.getSnapshot().snapshot).toEqual(captured); expect(lab.getSnapshot().events).toEqual([]);
    for (let i = 0; i < 7; i++) lab.step(60);
    expect(lab.getSnapshot().snapshot).toMatchObject({ phase: 'drained', productHealth: 70, debt: 2 });
    lab.reset(); expect(lab.getSnapshot().snapshot).toMatchObject({ runId: 'run_2', tick: 0, phase: 'preparation', debt: 0, productHealth: 100, nextEntityId: 1 });
    expect(lab.getSnapshot().captured).toBeNull();
  });
  it('pauses on hidden tab and long timing gaps without catch-up', () => {
    const fake = fakeHost(); const lab = createEncounterLab(headlessSlice, fake.host, () => 'lab_run'); lab.start(); lab.dispatch({ type: 'start' });
    fake.frame(0); fake.frame(100); expect(lab.getSnapshot().snapshot.tick).toBe(6);
    fake.hide(true); const frozen = lab.getSnapshot().snapshot; lab.dispatch({ type: 'resume' }); fake.frame(200); expect(lab.getSnapshot().snapshot).toEqual(frozen);
    fake.hide(false); expect(lab.getSnapshot().snapshot.paused).toBe(true);
    lab.dispatch({ type: 'resume' }); fake.frame(300); fake.frame(600); expect(lab.getSnapshot().snapshot).toMatchObject({ paused: true, tick: 6 });
    lab.dispose();
  });
  it('speed affects scheduling, not the duration of a simulation tick', () => {
    const fake = fakeHost(); const lab = createEncounterLab(headlessSlice, fake.host, () => 'lab_run'); lab.start();
    lab.dispatch({ type: 'set_speed', speed: 2 }); lab.dispatch({ type: 'start' }); fake.frame(0); fake.frame(100);
    expect(lab.getSnapshot().snapshot.tick).toBe(12); lab.dispose();
  });
  it('does not schedule a new frame if a subscriber disposes during publication', () => {
    const fake = fakeHost(); const lab = createEncounterLab(headlessSlice, fake.host, () => 'lab_run');
    lab.start(); lab.dispatch({ type: 'start' }); fake.frame(0);
    lab.subscribe(() => lab.dispose()); fake.frame(100);
    expect(fake.frameCount()).toBe(0); expect(fake.listenerCount()).toBe(0);
  });
  it('placement and configuration do not discard fractional clock time', () => {
    const fake = fakeHost(); const lab = createEncounterLab(headlessSlice, fake.host, () => 'lab_run');
    lab.start(); lab.dispatch({ type: 'start' }); fake.frame(0); fake.frame(10);
    lab.dispatch({ type: 'place_tower', definitionId: 'base_copilot', position: { x: -5, z: 0 }, facing: 0 });
    lab.dispatch({ type: 'set_mode', towerId: 1, mode: 'build' });
    fake.frame(20); expect(lab.getSnapshot().snapshot.tick).toBe(1); lab.dispose();
  });
});

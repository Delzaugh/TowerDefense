import { describe, expect, it, vi } from 'vitest';
import { createSession } from '../../src/session/createSession';
import { createMemoryRepository } from '../../src/persistence/saveRepository';
import type { SaveRepository, SaveRecord } from '../../src/persistence/saveRepository';
import { fakeHost, scenario } from '../fixtures/helpers';

describe('session lifecycle', () => {
  const setup = () => { const clock = fakeHost(); const repo = createMemoryRepository(); const session = createSession(scenario(), repo, clock.host, () => 'run_test'); return { clock, repo, session }; };
  it('owns exactly one loop and listener and disposes idempotently', () => {
    const { clock, session } = setup();
    session.start(); session.start();
    expect(clock.frameCount()).toBe(1); expect(clock.listenerCount()).toBe(1);
    session.dispatch({ type: 'start' }); clock.frame(0); clock.frame(100);
    expect(session.getSnapshot().snapshot.tick).toBe(6);
    expect(clock.frameCount()).toBe(1);
    session.dispose(); session.dispose(); session.start();
    expect(clock.frameCount()).toBe(0); expect(clock.listenerCount()).toBe(0);
    expect(session.dispatch({ type: 'resume' })).toMatchObject({ reason: 'disposed' });
  });
  it('caches external snapshots until state actually changes', () => {
    const { session, clock } = setup(); const listener = vi.fn(); session.subscribe(listener);
    const view = session.getSnapshot(); session.start(); clock.frame(0);
    expect(session.getSnapshot()).toBe(view); expect(listener).not.toHaveBeenCalled();
    session.dispatch({ type: 'start' });
    expect(session.getSnapshot()).not.toBe(view); expect(listener).toHaveBeenCalledTimes(1);
    session.dispose();
  });
  it('freezes on hide and requires explicit resume without background catch-up', () => {
    const { clock, session } = setup(); session.start(); session.dispatch({ type: 'start' });
    clock.frame(0); clock.frame(100); clock.hide(true);
    expect(session.getSnapshot().snapshot.paused).toBe(true);
    expect(session.dispatch({ type: 'resume' })).toMatchObject({ reason: 'hidden' });
    clock.frame(50_000); clock.hide(false); clock.frame(60_000);
    expect(session.getSnapshot().snapshot.tick).toBe(6);
    session.dispatch({ type: 'resume' }); clock.frame(70_000); clock.frame(70_100);
    expect(session.getSnapshot().snapshot.tick).toBe(12); session.dispose();
  });
  it('pauses instead of catching up after an unexpected long foreground frame', () => {
    const { clock, session } = setup(); session.start(); session.dispatch({ type: 'start' });
    clock.frame(0); clock.frame(1000);
    expect(session.getSnapshot().snapshot).toMatchObject({ tick: 0, paused: true });
    expect(session.getSnapshot().notice).toContain('Timing gap'); session.dispose();
  });
  it('saves/loads an eligible state and rejects I/O during active pause', async () => {
    const { session } = setup();
    session.dispatch({ type: 'place_marker', position: { x: -7, z: 0 } }); await session.save();
    const saved = session.getSnapshot().snapshot;
    session.dispatch({ type: 'place_marker', position: { x: 7, z: 0 } }); await session.load();
    expect(session.getSnapshot().snapshot).toEqual(saved);
    session.dispatch({ type: 'start' }); session.dispatch({ type: 'pause' });
    await session.save(); await session.load();
    expect(session.getSnapshot().snapshot.phase).toBe('running');
    expect(session.getSnapshot().notice).toContain('before starting'); session.dispose();
  });
  it('retains live state when a stored candidate fails validation', async () => {
    const { session, repo } = setup(); await repo.write({ version: 500 }, null);
    const before = session.getSnapshot().snapshot; await session.load();
    expect(session.getSnapshot().snapshot).toEqual(before);
    expect(session.getSnapshot().notice).not.toContain('Loaded');
    expect((await repo.read())?.envelope).toEqual({ version: 500 }); session.dispose();
  });
  it('ignores late asynchronous reads after disposal and prevents commands during I/O', async () => {
    let finish!: (record: SaveRecord | null) => void;
    const repository: SaveRepository = { read: () => new Promise(resolve => { finish = resolve; }), write: async () => 1, close: vi.fn() };
    const clock = fakeHost(); const session = createSession(scenario(), repository, clock.host, () => 'run_test');
    const listener = vi.fn(); session.subscribe(listener);
    const loading = session.load();
    expect(session.dispatch({ type: 'start' })).toMatchObject({ reason: 'busy' });
    session.dispose(); const calls = listener.mock.calls.length;
    finish(null); await loading;
    expect(listener.mock.calls.length).toBe(calls); expect(repository.close).toHaveBeenCalledTimes(1);
  });
});

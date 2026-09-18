import type { Scenario, Point } from '../content/schemas/scenario';
import { createSimulation, restoreSimulation } from '../simulation/createSimulation';
import type { SimulationSnapshot } from '../simulation/state';
import type { CommandResult } from '../simulation/commands';
import { canSave, createSave, parseSave } from '../persistence/saveSchema';
import type { SaveRepository } from '../persistence/saveRepository';
import { createFixedStepClock } from './fixedStepClock';

export interface FrameHost {
  requestFrame(callback: (time: number) => void): number;
  cancelFrame(id: number): void;
  isHidden(): boolean;
  onVisibilityChange(callback: () => void): () => void;
}
export interface SessionView {
  readonly snapshot: SimulationSnapshot;
  readonly position: Point;
  readonly sight: boolean | null;
  readonly busy: boolean;
  readonly notice: string;
}
type SessionCommandResult = CommandResult | { accepted: false; reason: 'busy' | 'disposed' | 'hidden'; events: readonly [] };

export function createSession(scenario: Scenario, repository: SaveRepository, host: FrameHost, newRunId: () => string) {
  let simulation = createSimulation(scenario, newRunId());
  const clock = createFixedStepClock();
  const listeners = new Set<() => void>();
  let frameId: number | null = null;
  let unsubscribeVisibility: (() => void) | null = null;
  let started = false;
  let disposed = false;
  let busy = false;
  let revision: number | null = null;
  let notice = 'Ready. Place a marker, then start the route probe.';
  const makeView = (): SessionView => Object.freeze({ snapshot: simulation.capture(), position: Object.freeze(simulation.probePosition()), sight: simulation.markerHasSight(), busy, notice });
  let view = makeView();
  function publish() {
    if (disposed) return;
    view = makeView();
    for (const listener of listeners) listener();
  }
  function freezeForInterruption(message: string) {
    const state = simulation.capture();
    if (state.phase === 'running' && !state.paused) simulation.dispatch({ type: 'pause' });
    clock.reset();
    notice = message;
    publish();
  }
  function frame(time: number) {
    frameId = null;
    if (!started || disposed) return;
    const state = simulation.capture();
    if (host.isHidden()) clock.reset();
    else if (state.phase === 'running' && !state.paused) {
      const result = clock.advance(time, state.speed, () => simulation.advanceOneTick().advanced);
      if (result.overloaded) freezeForInterruption('Timing gap detected. The probe is paused; resume when ready.');
      else if (result.steps > 0) {
        if (simulation.capture().phase === 'complete') notice = 'Route complete. This is a probe result, not a level victory.';
        publish();
      }
    } else clock.reset();
    if (started && !disposed) frameId = host.requestFrame(frame);
  }
  function storageAllowed() {
    if (disposed || busy) return false;
    if (!canSave(simulation.capture())) {
      notice = 'Save and load are available before starting or after completion.';
      publish(); return false;
    }
    return true;
  }
  async function storageAction(operation: () => Promise<void>) {
    if (!storageAllowed()) return;
    busy = true; publish();
    try { await operation(); }
    catch (error) { if (!disposed) notice = error instanceof Error ? error.message : 'Storage operation failed.'; }
    finally { busy = false; publish(); }
  }
  return {
    getSnapshot: () => view,
    subscribe(listener: () => void) {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      if (started || disposed) return;
      started = true;
      unsubscribeVisibility = host.onVisibilityChange(() => {
        if (host.isHidden()) freezeForInterruption('Tab hidden. Active simulation is frozen until you resume.');
        else clock.reset();
      });
      if (host.isHidden()) freezeForInterruption('Tab hidden. Resume when visible.');
      frameId = host.requestFrame(frame);
    },
    dispatch(command: unknown): SessionCommandResult {
      if (disposed) return { accepted: false, reason: 'disposed', events: [] };
      if (busy) return { accepted: false, reason: 'busy', events: [] };
      if (host.isHidden()) return { accepted: false, reason: 'hidden', events: [] };
      const previous = simulation.capture();
      const result = simulation.dispatch(command);
      const next = simulation.capture();
      if (previous.paused !== next.paused || previous.phase !== next.phase || previous.speed !== next.speed) clock.reset();
      notice = result.accepted ? `Accepted: ${result.events[0]?.type.replaceAll('_', ' ') ?? 'command'}.` : `Rejected: ${result.reason.replaceAll('_', ' ')}.`;
      publish();
      return result;
    },
    async save() {
      await storageAction(async () => {
        const envelope = createSave(scenario, simulation.capture());
        const nextRevision = await repository.write(envelope, revision);
        if (disposed) return;
        revision = nextRevision;
        notice = `Saved locally (revision ${revision}).`;
      });
    },
    async load() {
      await storageAction(async () => {
        const record = await repository.read();
        if (disposed) return;
        if (!record) { notice = 'No local save exists yet.'; revision = null; return; }
        // Validate candidate completely before swapping the live simulation.
        const envelope = parseSave(scenario, record.envelope);
        const candidate = restoreSimulation(scenario, envelope.snapshot);
        simulation = candidate;
        revision = record.revision;
        clock.reset();
        notice = `Loaded local save (revision ${revision}).`;
      });
    },
    reset() {
      if (!storageAllowed()) return;
      simulation = createSimulation(scenario, newRunId());
      clock.reset(); notice = 'New probe run. The stored save is unchanged.'; publish();
    },
    dispose() {
      if (disposed) return;
      disposed = true; started = false;
      if (frameId !== null) host.cancelFrame(frameId);
      frameId = null;
      unsubscribeVisibility?.(); unsubscribeVisibility = null;
      listeners.clear(); clock.reset(); repository.close();
    },
  };
}

export type Session = ReturnType<typeof createSession>;

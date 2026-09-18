import type { EncounterContent } from '../content/schemas/encounter';
import { createEncounter, restoreEncounter } from '../simulation/encounter';
import type { EncounterEvent, EncounterSnapshot } from '../simulation/encounter';
import type { FrameHost } from './createSession';
import type { Point } from '../content/schemas/scenario';
import type { CoverageTower } from '../simulation/encounter/targeting';
import { createFixedStepClock } from './fixedStepClock';
import { compileRoute, segmentIntersectsRectangle } from '../simulation/geometry';
import { markerRejection } from '../simulation/encounter/diagnostics';
import { pointSchema } from '../content/schemas/scenario';
import { freezeData } from '../content/schemas/data';
import type { SaveRepository } from '../persistence/saveRepository';
import { canSaveLab, createLabSave, parseLabSave } from '../persistence/testLabSave';
import { compileWaveRecipe, recipeFromContent } from '../content/waveRecipe';
import { captureBlueprint, prepareBlueprint } from '../simulation/encounter/blueprint';
import type { Blueprint } from '../simulation/encounter/blueprint';

/** Diagnostic adapter. Captures are memory-only, not player-facing mid-wave saves. */
export function createEncounterLab(content: EncounterContent, host: FrameHost, runId: () => string, repository?: SaveRepository, initialRecipe?: unknown) {
  const initial = compileWaveRecipe(content, initialRecipe ?? recipeFromContent(content));
  content = initial.content;
  let encounter = createEncounter(content, runId());
  let recipe = initial.recipe;
  let startingBlueprint: Blueprint | null = null;
  let capturedBlueprint: Blueprint | null = null;
  let epoch = 0;
  let captured: EncounterSnapshot | null = null;
  let marker: Point | null = null;
  let capturedMarker: Point | null = null;
  let busy = false;
  let revision: number | null = null;
  let probeRoute = compileRoute(content.map.routes[0]!.points);
  let automatic = true;
  let events: readonly EncounterEvent[] = [];
  let notice = 'Place a Copilot, or run without towers to compare the consequences.';
  let disposed = false;
  let started = false;
  let frameId: number | null = null;
  let unsubscribe: (() => void) | null = null;
  const clock = createFixedStepClock();
  const listeners = new Set<() => void>();
  const makeView = () => {
    const snapshot = encounter.capture();
    const probe = freezeData(probeRoute.pointAt(snapshot.tick / 600));
    const sight = marker ? !content.map.obstacles.some(item => item.blocksSight && segmentIntersectsRectangle(marker!, probe, item.footprint)) : null;
    return Object.freeze({ snapshot, content, recipe, epoch, entities: encounter.positions(), automatic, captured, events, notice, marker, probe, sight, busy, revision });
  };
  let view = makeView();
  const publish = () => { if (!disposed) { view = makeView(); for (const listener of listeners) listener(); } };
  const record = (batch: readonly EncounterEvent[]) => { events = Object.freeze([...events, ...batch].slice(-60)); };
  const allowed = () => !disposed && !host.isHidden() && !busy;
  async function storageAction(operation: () => Promise<void>) {
    if (!allowed()) return;
    if (!repository) { notice = 'Storage unavailable in this session.'; publish(); return; }
    if (!canSaveLab(encounter.capture())) { notice = 'Save/load requires preparation or a finished run.'; publish(); return; }
    busy = true; publish();
    try { await operation(); }
    catch (error) { if (!disposed) notice = error instanceof Error ? error.message : 'Local storage failed.'; }
    finally { busy = false; publish(); }
  }
  function interrupt(message: string) {
    if (encounter.capture().phase === 'active' && !encounter.capture().paused) record(encounter.dispatch({ type: 'pause' }).events);
    clock.reset(); notice = message; publish();
  }
  function frame(timestamp: number) {
    frameId = null;
    if (disposed || !started) return;
    const snapshot = encounter.capture();
    if (automatic && !host.isHidden() && snapshot.phase === 'active' && !snapshot.paused) {
      const result = clock.advance(timestamp, snapshot.speed, () => {
        const step = encounter.advanceOneTick(); record(step.events); return step.advanced;
      });
      if (result.overloaded) interrupt('Timing gap: explicitly resume to continue.');
      else if (result.steps) publish();
    } else clock.reset();
    if (started && !disposed) frameId = host.requestFrame(frame);
  }
  function prepare(input: unknown, keepLayout: boolean) {
    if (!allowed()) return false;
    const snapshot = encounter.capture();
    if (snapshot.phase === 'active') { notice = 'Reset the active attempt before applying a queue.'; publish(); return false; }
    try {
      const compiled = compileWaveRecipe(content, input);
      const layout = keepLayout ? (snapshot.phase === 'preparation' ? captureBlueprint(snapshot, marker) : startingBlueprint) : null;
      const candidate = prepareBlueprint(compiled.content, layout ?? { towers: [], marker: null }, runId());
      content = compiled.content; recipe = compiled.recipe; encounter = candidate.encounter; marker = candidate.blueprint.marker;
      startingBlueprint = null; captured = null; capturedBlueprint = null; capturedMarker = null;
      probeRoute = compileRoute(content.map.routes[0]!.points); events = []; epoch++; clock.reset();
      notice = 'Queue applied. Fresh preparation with validated starting layout.'; publish(); return true;
    } catch (error) { notice = error instanceof Error ? error.message : 'Invalid queue.'; publish(); return false; }
  }
  return {
    get content() { return content; },
    applyRecipe: prepare,
    prepareAgain() {
      if (!allowed()) return;
      try {
        const candidate = prepareBlueprint(content, startingBlueprint ?? captureBlueprint(encounter.capture(), marker), runId());
        encounter = candidate.encounter; marker = candidate.blueprint.marker;
        startingBlueprint = null; captured = null; capturedBlueprint = null; capturedMarker = null; events = []; epoch++; clock.reset();
        notice = 'Starting defense restored at tick 0. Queue unchanged; rewards and cooldowns reset.'; publish();
      } catch (error) { notice = error instanceof Error ? error.message : 'Cannot repeat run.'; publish(); }
    },
    previewPlacement: (definitionId: string, point: Point) => encounter.previewPlacement(definitionId, point),
    inspectCoverage: (tower: CoverageTower, point: Point) => encounter.inspectCoverage(tower, point),
    placeMarker(input: unknown) {
      if (!allowed()) return;
      const snapshot = encounter.capture();
      if (snapshot.paused || (snapshot.phase !== 'preparation' && snapshot.phase !== 'active')) { notice = 'Rejected: marker editing is frozen.'; publish(); return; }
      const parsed = pointSchema.safeParse(input);
      const reason = parsed.success ? markerRejection(content, parsed.data) : 'invalid_coordinates';
      if (reason) { notice = `Rejected: ${reason}.`; publish(); return; }
      marker = freezeData({ ...parsed.data! }); notice = 'Accepted: marker placed.'; publish();
    },
    clearMarker() {
      if (!allowed()) return;
      const snapshot = encounter.capture();
      if (snapshot.paused || (snapshot.phase !== 'preparation' && snapshot.phase !== 'active')) return;
      marker = null; notice = 'Sight marker cleared.'; publish();
    },
    getSnapshot: () => view,
    subscribe(listener: () => void) { if (disposed) return () => undefined; listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() {
      if (started || disposed) return;
      started = true;
      unsubscribe = host.onVisibilityChange(() => { if (host.isHidden()) interrupt('Tab hidden: explicitly resume when visible.'); else clock.reset(); });
      frameId = host.requestFrame(frame);
    },
    dispatch(command: unknown) {
      if (!allowed()) return;
      const before = encounter.capture();
      const result = encounter.dispatch(command); record(result.events);
      const after = encounter.capture();
      if (result.accepted && before.phase === 'preparation' && after.phase === 'active') startingBlueprint = captureBlueprint(before, marker);
      if (before.phase !== after.phase || before.paused !== after.paused || before.speed !== after.speed) clock.reset();
      notice = result.accepted ? `Accepted: ${result.events[0]!.type}.` : `Rejected: ${result.reason}.`; publish();
      return result;
    },
    setAutomatic(value: boolean) {
      if (!allowed()) return;
      automatic = value; clock.reset(); notice = value ? 'Automatic clock enabled.' : 'Manual clock: advance exact ticks while active and unpaused.'; publish();
    },
    step(count: number) {
      if (!allowed() || automatic || !Number.isInteger(count) || count < 1 || count > 60) return;
      let advanced = 0;
      for (let i = 0; i < count; i++) { const result = encounter.advanceOneTick(); record(result.events); if (!result.advanced) break; advanced++; }
      clock.reset(); notice = `Advanced ${advanced} tick(s).`; publish();
    },
    capture() {
      if (!allowed()) return;
      captured = encounter.capture(); capturedMarker = marker; capturedBlueprint = startingBlueprint; notice = `Diagnostic snapshot captured at tick ${captured.tick}. Memory only; this is not a player save.`; publish();
    },
    restore() {
      if (!allowed() || !captured) return;
      const candidate = restoreEncounter(content, captured);
      encounter = candidate; marker = capturedMarker; startingBlueprint = capturedBlueprint; epoch++; automatic = false; events = []; clock.reset();
      notice = `Restored tick ${captured.tick}; manual clock selected. Historical events were not replayed.`; publish();
    },
    reset() {
      if (!allowed()) return;
      encounter = createEncounter(content, runId()); captured = null; capturedMarker = null; marker = null; events = []; clock.reset();
      startingBlueprint = null; capturedBlueprint = null; epoch++;
      notice = 'New attempt. Health, resources, debt, IDs and diagnostics reset.'; publish();
    },
    async save() {
      await storageAction(async () => {
        const snapshot = encounter.capture();
        const envelope = createLabSave(content, snapshot, marker, recipe, snapshot.phase === 'preparation' ? captureBlueprint(snapshot, marker) : startingBlueprint ?? { towers: [], marker: null });
        const nextRevision = await repository!.write(envelope, revision);
        if (disposed) return;
        revision = nextRevision; notice = `Saved locally (revision ${revision}).`;
      });
    },
    async load() {
      await storageAction(async () => {
        const record = await repository!.read();
        if (disposed) return;
        if (!record) { revision = null; notice = 'No local test-map save exists.'; return; }
        const envelope = parseLabSave(content, record.envelope);
        const candidate = restoreEncounter(envelope.content, envelope.snapshot);
        content = envelope.content; recipe = envelope.recipe; startingBlueprint = envelope.blueprint; capturedBlueprint = null;
        probeRoute = compileRoute(content.map.routes[0]!.points); epoch++;
        encounter = candidate; marker = envelope.marker; revision = record.revision;
        captured = null; capturedMarker = null; automatic = false; events = []; clock.reset();
        notice = `Loaded local save (revision ${revision}). Manual clock selected.`;
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true; started = false;
      if (frameId !== null) host.cancelFrame(frameId);
      unsubscribe?.(); listeners.clear(); clock.reset(); repository?.close();
    },
  };
}
export type EncounterLabSession = ReturnType<typeof createEncounterLab>;

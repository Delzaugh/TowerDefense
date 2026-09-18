import { useEffect, useState, useSyncExternalStore } from 'react';
import { testMap, fragileTestMap } from '../content/levels/testMap';
import { createEncounterLab } from '../session/createEncounterLab';
import type { EncounterLabSession } from '../session/createEncounterLab';
import { browserHost } from '../session/browserHost';
import { TowerLab } from './TowerLab';
import { createIndexedDbRepository } from '../persistence/saveRepository';
import { canSaveLab } from '../persistence/testLabSave';
import { canonicalJson } from '../content/schemas/data';
import { compileWaveRecipe } from '../content/waveRecipe';
import type { WaveRecipe } from '../content/waveRecipe';
import { WaveEditor } from './WaveEditor';
import { Modal } from './Modal';

function Lab({ session, fixture, onPreset }: { session: EncounterLabSession; fixture: string; onPreset: (value: string, recipe: WaveRecipe) => void }) {
  const view = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const state = view.snapshot;
  const content = view.content;
  const [waveDirty, setWaveDirty] = useState(false);
  const [waveOpen, setWaveOpen] = useState(false);
  const [inspectorHost, setInspectorHost] = useState<HTMLDivElement | null>(null);
  const running = state.phase === 'active';
  const canStep = running && !state.paused && !view.automatic && !view.busy;
  const saveAllowed = canSaveLab(state) && !view.busy;
  const terminal = state.phase === 'drained' || state.phase === 'failed';
  const label = state.paused ? 'Paused' : ({ preparation: 'Preparation', active: 'Active', drained: 'Wave drained', failed: 'Product destroyed' } as const)[state.phase];
  return <main className="test-app">
    <header className="app-bar"><div className="wordmark">TOWER <span>/ TEST MAP</span></div><span className="badge">Unified test map</span>
      <div className="tower-fields preset-control"><label>Product preset<select aria-label="Product preset" title="Changes health, keeps applied queue, resets towers" value={fixture} disabled={running || view.busy} onChange={event => { if (!waveDirty || window.confirm('Changing Product preset discards your unapplied queue draft and resets the tower layout. Continue?')) onPreset(event.target.value, view.recipe); }}><option value="standard">Standard · 100 health</option><option value="fragile">Failure test · 20 health</option></select></label></div>
      <button aria-haspopup="dialog" onClick={() => setWaveOpen(true)}>Edit wave queue{waveDirty ? ' • draft' : ''}</button><span className="hint">{content.wave.spawns.length} scheduled</span>
    </header>
    <section id="test-map" className="workspace encounter-workspace">
      <div className="map-panel">
        <TowerLab key={view.epoch} session={session} inspectorHost={inspectorHost} />
      </div>
      <aside id="run-controls">
        <div ref={setInspectorHost} />
        <p className="eyebrow">SIMULATION</p><h2 data-testid="encounter-phase">{label}</h2>
        <dl>
          <div><dt>Tick</dt><dd data-testid="encounter-tick">{state.tick}</dd></div>
          <div><dt>Simulation time</dt><dd>{(state.tick / 60).toFixed(2)} s · 60 Hz</dd></div>
          <div><dt>Simulation commands</dt><dd>{state.commandSequence}</dd></div>
          <div><dt>Marker sight</dt><dd data-testid="marker-sight">{view.sight === null ? 'No marker' : view.sight ? 'Clear sight' : 'Blocked sight'}</dd></div>
          <div><dt>Product health</dt><dd data-testid="product-health">{state.productHealth} / {content.product.maximumHealth}</dd></div>
          <div><dt>Technical Debt</dt><dd data-testid="debt">{state.debt}</dd></div>
          <div><dt>Compute</dt><dd data-testid="compute">{state.compute}</dd></div>
          <div><dt>Product Progress</dt><dd data-testid="product-progress">{state.productProgress}</dd></div>
          <div><dt>Completed / resolved</dt><dd>{state.totals.completedWork} / {state.totals.resolvedProblems}</dd></div>
          <div><dt>Earned / spent</dt><dd>{state.totals.computeEarned} / {state.totals.computeSpent}</dd></div>
          <div><dt>Spawned / scheduled</dt><dd>{state.spawnCursor} / {content.wave.spawns.length}</dd></div>
          <div><dt>Missed / leaked</dt><dd>{state.totals.missedWork} / {state.totals.leakedProblems}</dd></div>
        </dl>
        {state.phase === 'preparation' && <button className="primary" disabled={view.busy} onClick={() => session.dispatch({ type: 'start' })}>Start encounter</button>}
        {running && <button className="primary" disabled={view.busy} onClick={() => session.dispatch({ type: state.paused ? 'resume' : 'pause' })}>{state.paused ? 'Resume encounter' : 'Pause encounter'}</button>}
        <div className="split">{([1, 2] as const).map(speed => <button key={speed} disabled={state.paused || terminal || view.busy} aria-pressed={state.speed === speed} onClick={() => session.dispatch({ type: 'set_speed', speed })}>{speed}× speed</button>)}</div>
        <h3>Diagnostic clock</h3><label className="clock-option"><input type="checkbox" disabled={view.busy} checked={view.automatic} onChange={event => session.setAutomatic(event.target.checked)} />Advance automatically</label>
        <div className="split"><button disabled={!canStep} onClick={() => session.step(1)}>Step 1 tick</button><button disabled={!canStep} onClick={() => session.step(60)}>Step 60 ticks</button></div>
        <p className="hint">Manual stepping requires an active, unpaused encounter. Pause freezes both clocks.</p>
        <h3>Local save</h3><div className="split"><button disabled={!saveAllowed} onClick={() => { void session.save(); }}>Save locally</button><button disabled={!saveAllowed} onClick={() => { void session.load(); }}>Load save</button></div>
        <p className="hint">Persists towers, full simulation state and marker across reloads. Preparation/finished runs only. Active pause is not a save boundary. Load before overwriting an existing save; conflicting revisions reject.</p>
        <h3>Memory-only diagnostic snapshot</h3><div className="split"><button disabled={view.busy} onClick={session.capture}>Capture state</button><button disabled={!view.captured || view.busy} onClick={session.restore}>Restore capture</button></div>
        <p className="hint">{view.captured ? `Captured tick ${view.captured.tick}. ` : ''}Not a player save. Restore selects manual time; reload or fixture change discards the capture.</p>
        <button className="reset-attempt" disabled={view.busy} onClick={session.reset}>Reset encounter</button>
        <button className="repeat-attempt" disabled={view.busy} onClick={() => { if (!running || window.confirm('Reset this active attempt and restore its starting defense?')) session.prepareAgain(); }}>Prepare same run again</button>
        <p className="hint">Repeat restores the defense recorded at Start, not towers bought during the wave. Reset clears all towers. Both keep the applied queue.</p>
      </aside>
    </section>
    <p className="status" role="status">{view.busy ? 'Working with local storage…' : view.notice}</p>
    {terminal && <p className="status">{state.phase === 'failed' ? 'Failure latched. No further ticks or outcomes can occur.' : 'All scheduled traffic handled. Wave drainage is not Level 1 victory.'}</p>}
    <Modal open={waveOpen} onClose={() => setWaveOpen(false)}><WaveEditor key={canonicalJson(view.recipe)} session={session} onDirty={setWaveDirty} /></Modal>
    <details className="debug-tray"><summary>Event log &amp; diagnostics</summary><section className="diagnostics"><div><h2>Event log</h2><p className="hint">Latest 60 events, oldest first. Restore clears the display, not event sequence state.</p><ol className="event-log">{view.events.map(event => <li key={event.sequence}><code>#{event.sequence} · t{event.tick} · {event.type}{'towerId' in event ? ` · tower ${event.towerId}` : ''}{'entityId' in event ? ` · entity ${event.entityId}` : ''}{'amount' in event ? ` · output ${event.amount}` : ''}{'damage' in event ? ` · −${event.damage} health` : ''}{'compute' in event ? ` · +${event.compute} Compute · +${event.healing} health` : ''}{'debtAdded' in event ? ' · +1 debt' : ''}</code></li>)}</ol></div>
      <details><summary>Inspect current snapshot JSON</summary><pre data-testid="snapshot-json">{JSON.stringify({ simulation: state, marker: view.marker, probe: view.probe }, null, 2)}</pre></details></section>
    <p className="hint">Path-safe tower placement uses a v6 save database. Earlier v1–v5 and foundation saves remain untouched; migration is not automatic.</p></details>
  </main>;
}

export function EncounterLab({ fixture, initialRecipe, onPreset }: { fixture: string; initialRecipe?: WaveRecipe | undefined; onPreset: (value: string, recipe: WaveRecipe) => void }) {
  const [session, setSession] = useState<EncounterLabSession | null>(null);
  useEffect(() => {
    const base = fixture === 'fragile' ? fragileTestMap : testMap;
    const content = initialRecipe ? compileWaveRecipe(base, initialRecipe).content : base;
    const next = createEncounterLab(content, browserHost, () => `run_${crypto.randomUUID().replaceAll('-', '')}`, createIndexedDbRepository(`tower-test-map-${fixture}-v6`), initialRecipe);
    next.start(); setSession(next); return () => next.dispose();
  }, [fixture, initialRecipe]);
  return session ? <Lab session={session} fixture={fixture} onPreset={onPreset} /> : <main>Preparing unified test map…</main>;
}


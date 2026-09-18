import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { EncounterLabSession } from '../session/createEncounterLab';
import { canonicalJson } from '../content/schemas/data';
import { compileWaveRecipe, importWaveRecipe, recipeFromContent, secondsToTicks, millisecondsToTicks, ticksToMilliseconds } from '../content/waveRecipe';
import type { WaveRecipe } from '../content/waveRecipe';
import { testMap } from '../content/levels/testMap';

type Row = { definitionId: string; routeId: string; start: string; count: string; interval: string };
const editRows = (recipe: WaveRecipe): Row[] => recipe.rows.map(row => ({ definitionId: row.definitionId, routeId: row.routeId, start: (row.startTick / 60).toString(), count: row.count.toString(), interval: ticksToMilliseconds(row.intervalTicks).toString() }));
export function WaveEditor({ session, onDirty }: { session: EncounterLabSession; onDirty: (dirty: boolean) => void }) {
  const view = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [rows, setRows] = useState(() => editRows(view.recipe));
  const [keepLayout, setKeepLayout] = useState(true);
  const [json, setJson] = useState(''), [message, setMessage] = useState('');
  const result = useMemo(() => {
    try {
      const recipe = { format: 'tower.wave.recipe', version: 1, rows: rows.map((row, i) => {
        try { if (!row.count.trim()) throw new Error('Count is required.'); return { definitionId: row.definitionId, routeId: row.routeId, startTick: secondsToTicks(row.start), count: Number(row.count), intervalTicks: millisecondsToTicks(row.interval) }; }
        catch (error) { throw new Error(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid values.'}`); }
      }) };
      return { compiled: compileWaveRecipe(view.content, recipe), error: '' };
    } catch (error) { return { compiled: null, error: error instanceof Error ? error.message : 'Invalid queue.' }; }
  }, [rows, view.content]);
  const dirty = !result.compiled || canonicalJson(result.compiled.recipe) !== canonicalJson(view.recipe);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);
  const applied = useMemo(() => compileWaveRecipe(view.content, view.recipe).schedule, [view.content, view.recipe]);
  const update = (index: number, patch: Partial<Row>) => setRows(old => old.map((row, i) => i === index ? { ...row, ...patch } : row));
  function preset(value: string) {
    if (value === 'mixed') { setRows(editRows(recipeFromContent(testMap))); return; }
    const definition = view.content.definitions.find(item => item.kind === (value === 'work' ? 'work' : 'problem'))!;
    setRows([{ definitionId: definition.id, routeId: view.content.map.routes[0]!.id, start: '0', count: '5', interval: value === 'burst' ? '0' : '1000' }]);
  }
  function move(index: number, offset: number) { setRows(old => { const next = [...old]; [next[index], next[index + offset]] = [next[index + offset]!, next[index]!]; return next; }); }
  return <section className="wave-editor" aria-label="Wave queue editor">
    <div className="panel-heading"><div><p className="eyebrow">NEXT RUN</p><h2>Wave queue</h2></div><span data-testid="queue-dirty">{dirty ? 'Unapplied draft' : 'Matches applied queue'}</span></div>
    <p className="hint">Edit a draft freely. Apply it to a fresh preparation; the current run never changes underneath you.</p>
    <fieldset disabled={view.busy}>
      <div className="tower-fields"><label>Quick recipe<select aria-label="Queue preset" value="" onChange={event => preset(event.target.value)}><option value="" disabled>Choose a starting queue…</option><option value="mixed">Default mixed traffic</option><option value="work">Work only · 5 items</option><option value="problems">Problems only · 5 bugs</option><option value="burst">Burst · 5 simultaneous bugs</option></select></label>
        <button disabled={rows.length >= 1000} onClick={() => setRows([...rows, { definitionId: view.content.definitions[0]!.id, routeId: view.content.map.routes[0]!.id, start: '0', count: '1', interval: '1000' }])}>Add queue row</button>
      </div>
      <div className="queue-rows">{rows.map((row, i) => <section className="queue-row" key={i} aria-label={`Queue row ${i + 1}`}>
        <div className="queue-row-heading"><strong>#{i + 1}</strong><div className="queue-row-actions">
          <button aria-label={`Move row ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button><button aria-label={`Move row ${i + 1} down`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>↓</button>
          <button disabled={rows.length >= 1000} aria-label={`Duplicate row ${i + 1}`} onClick={() => setRows([...rows.slice(0, i + 1), { ...row }, ...rows.slice(i + 1)])}>Duplicate</button><button aria-label={`Remove row ${i + 1}`} onClick={() => setRows(rows.filter((_, index) => index !== i))}>Remove</button>
        </div></div>
        <div className="tower-fields">
          <label>Type<select aria-label={`Row ${i + 1} type`} value={row.definitionId} onChange={event => update(i, { definitionId: event.target.value })}>{view.content.definitions.map(item => <option key={item.id} value={item.id}>{item.kind === 'work' ? 'Work' : 'Problem'} · {item.id.replaceAll('_', ' ')}</option>)}</select></label>
          <label>Start (s)<input aria-label={`Row ${i + 1} start`} type="number" min="0" max="600" step="any" value={row.start} onChange={event => update(i, { start: event.target.value })} /></label>
          <label>Count<input aria-label={`Row ${i + 1} count`} type="number" min="1" max="1000" step="1" value={row.count} onChange={event => update(i, { count: event.target.value })} /></label>
          <label>Interval (ms)<input aria-label={`Row ${i + 1} interval`} aria-describedby={`interval-effective-${i}`} type="number" min="0" max="600000" step="any" value={row.interval} onChange={event => update(i, { interval: event.target.value })} /></label>
          {view.content.map.routes.length > 1 && <label>Route<select aria-label={`Row ${i + 1} route`} value={row.routeId} onChange={event => update(i, { routeId: event.target.value })}>{view.content.map.routes.map(route => <option key={route.id} value={route.id}>{route.id}</option>)}</select></label>}
        </div>
        {result.compiled && <p className="hint" id={`interval-effective-${i}`} data-testid={`interval-effective-${i}`}>Effective interval: {ticksToMilliseconds(result.compiled.recipe.rows[i]!.intervalTicks)} ms ({result.compiled.recipe.rows[i]!.intervalTicks} ticks){result.compiled.recipe.rows[i]!.intervalTicks === 0 ? ' · simultaneous burst' : ''}</p>}
      </section>)}</div>
      {result.error ? <p className="queue-error" role="alert">{result.error}</p> : <p className="hint" data-testid="queue-summary">{result.compiled!.schedule.length} spawns · last spawn at tick {result.compiled!.schedule.at(-1)!.spawnTick} · 60 Hz timing: intervals round to the nearest tick (≈16.667 ms). Below half a tick rounds to a simultaneous burst.</p>}
      <label className="clock-option"><input type="checkbox" checked={keepLayout} onChange={event => setKeepLayout(event.target.checked)} />Keep starting towers and marker</label>
      <button className="primary" disabled={!result.compiled || view.snapshot.phase === 'active'} onClick={() => { if (result.compiled && session.applyRecipe(result.compiled.recipe, keepLayout)) setMessage('Draft applied to the map. Ready to start.'); }}>Apply queue &amp; prepare</button>
      {view.snapshot.phase === 'active' && <p className="hint">Use “Prepare same run again” to reset this attempt first, then apply your draft.</p>}
      <details><summary>Preview draft spawn order</summary><p className="hint">Offset 0 spawns on tick 1. Equal-time ties follow row order. Showing the first 50 spawns.</p>
        <ol className="queue-preview">{result.compiled?.schedule.slice(0, 50).map(item => <li key={item.id}>#{item.id} · tick {item.spawnTick} · {item.definitionId.replaceAll('_', ' ')}</li>)}</ol>
      </details>
      <details><summary>Import / export recipe JSON</summary><p className="hint">Copy recipes between experiments. Import changes only the draft; apply when ready.</p>
        <textarea aria-label="Recipe JSON" maxLength={250000} value={json} onChange={event => setJson(event.target.value)} />
        <div className="split"><button disabled={!result.compiled} onClick={() => { setJson(JSON.stringify(result.compiled!.recipe, null, 2)); setMessage('Recipe JSON ready to copy.'); }}>Export recipe</button>
          <button onClick={() => { try { const imported = importWaveRecipe(json); compileWaveRecipe(view.content, imported); setRows(editRows(imported)); setMessage('Recipe imported as a draft.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Invalid JSON.'); } }}>Import recipe</button></div>
      </details>
    </fieldset>
    {message && <p className="hint" aria-live="polite">{message}</p>}
    <details><summary>Applied queue · {view.snapshot.spawnCursor} / {applied.length} spawned</summary><p className="hint">This is the actual attempt, not the draft. Showing the first 50 entries.</p>
      <ol className="queue-preview">{applied.slice(0, 50).map(item => <li key={item.id}>#{item.id} · tick {item.spawnTick} · {item.definitionId.replaceAll('_', ' ')} · {item.id > view.snapshot.spawnCursor ? view.snapshot.phase === 'failed' ? 'not spawned (run failed)' : 'scheduled' : view.snapshot.entities.some(entity => entity.id === item.id) ? 'on map' : 'settled'}</li>)}</ol>
    </details>
  </section>;
}

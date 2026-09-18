import { useState } from 'react';
import type { EncounterLabSession } from '../session/createEncounterLab';
import type { EncounterSnapshot } from '../simulation/encounter';
import { towerStatsSchema, type TowerStats, type TowerStatOverrides } from '../content/schemas/towerStats';
import { resolveTowerStats, resolveActionStats, statRates } from '../simulation/encounter/stats';

const fields = [
  { key: 'range', label: 'Range', min: 0, max: 100, step: 'any', timing: false },
  { key: 'cooldownTicks', label: 'Action interval (ms)', min: 0, max: 60000, step: 'any', timing: true },
  { key: 'damagePerAction', label: 'Damage per action', min: 0, max: 1000000, step: '1', timing: false },
  { key: 'workPerAction', label: 'Work per action', min: 0, max: 1000000, step: '1', timing: false },
  { key: 'commitmentTicks', label: 'Target commitment (ms)', min: 0, max: 60000, step: 'any', timing: true },
] as const;
const display = (value: number) => Number(value.toFixed(3)).toString();

export function TowerStatsPanel({ session, tower, planning, onEdit }: { session: EncounterLabSession; tower: EncounterSnapshot['towers'][number]; planning: boolean; onEdit: () => void }) {
  const definition = session.getSnapshot().content.towerDefinitions.find(item => item.id === tower.definitionId)!;
  return definition.kind === 'targeted' ? <TargetedStatsPanel session={session} tower={tower} planning={planning} onEdit={onEdit} /> : <PassiveStatsPanel session={session} tower={tower} planning={planning} onEdit={onEdit} />;
}
type PanelProps = Parameters<typeof TowerStatsPanel>[0];
function TargetedStatsPanel({ session, tower, planning, onEdit }: PanelProps) {
  const definition = session.getSnapshot().content.towerDefinitions.find(item => item.id === tower.definitionId)!;
  const stats = resolveActionStats(definition, { statOverrides: tower.statOverrides })!, rates = statRates(resolveTowerStats(definition, tower));
  const [draft, setDraft] = useState<Partial<Record<keyof TowerStats, string>>>({});
  if (definition.kind !== 'targeted') return null;
  const values = Object.fromEntries(fields.map(field => {
    const raw = draft[field.key];
    const value = raw === undefined ? stats[field.key] : raw.trim() === '' ? NaN : Number(raw);
    return [field.key, raw !== undefined && field.timing ? value < 0 || value > 60000 ? NaN : Math.round(value * 60 / 1000) : value];
  }));
  const parsed = towerStatsSchema.safeParse({ cost: stats.cost, footprintRadius: stats.footprintRadius, ...values });
  const dirty = Object.keys(draft).length > 0;
  const editable = planning && definition.allowStatTuning === true;
  const error = !parsed.success ? 'Use range > 0–100; whole damage/work 0–1,000,000; action interval rounding to 1–3,600 ticks; commitment 0–3,600 ticks (maximum 60,000 ms).' : null;
  const apply = (overrides: TowerStatOverrides) => {
    if (session.dispatch({ type: 'set_stats', towerId: tower.id, overrides })?.accepted) { setDraft({}); onEdit(); }
  };
  return <details className="tower-stats">
    <summary>Base stats &amp; tuning{Object.keys(tower.statOverrides).length > 0 ? ' · custom' : ''}</summary>
    <p className="hint">Base values belong to the tower type. Test overrides apply before upgrades and external effects; new towers keep their defaults.</p>
    <p className="hint" data-testid="tower-placement-stats">Cost: {stats.cost} Compute · footprint radius: {stats.footprintRadius} map units (diameter {stats.footprintRadius * 2}). Type-defined placement properties; fixed after purchase.</p>
    <div className="tower-fields">
      {fields.map(field => <label key={field.key}>{field.label}
        <input aria-label={`Tower ${field.label.toLowerCase()}`} type="number" min={field.min} max={field.max} step={field.step} disabled={!editable}
          value={draft[field.key] ?? (field.timing ? display(stats[field.key] * 1000 / 60) : stats[field.key].toString())}
          onChange={event => setDraft({ ...draft, [field.key]: event.target.value })} />
        <small>Base: {field.timing ? display(definition.baseStats[field.key] * 1000 / 60) : definition.baseStats[field.key].toString()}{field.timing ? ' ms' : ''}</small>
      </label>)}
    </div>
    <p className="hint">Lower interval = faster actions. Timing rounds to the nearest 60 Hz tick (~16.667 ms). Damage and work share one action interval; zero output disables that target category.</p>
    {dirty && parsed.success && <p className="hint" data-testid="stat-draft-timing">Draft timing: {display(statRates(parsed.data).intervalMs)} ms ({parsed.data.cooldownTicks} ticks); commitment {display(parsed.data.commitmentTicks * 1000 / 60)} ms.</p>}
    {dirty && error && <p className="queue-error" role="alert">{error}</p>}
    <div className="tower-buttons">
      <button disabled={!editable || !dirty || !parsed.success} onClick={() => {
        if (!parsed.success) return;
        const overrides: TowerStatOverrides = {};
        for (const field of fields) if (parsed.data[field.key] !== definition.baseStats[field.key]) overrides[field.key] = parsed.data[field.key];
        apply(overrides);
      }}>Apply stats</button>
      <button disabled={!editable || (Object.keys(tower.statOverrides).length === 0 && !dirty)} onClick={() => apply({})}>Reset stats</button>
    </div>
    <p className="hint" data-testid="tower-stat-rates">Applied: {display(rates.actionsPerSecond)} actions/s · {display(rates.damagePerSecond)} damage/s · {display(rates.workPerSecond)} work/s. Ideal continuous output before travel, targeting, and overkill.</p>
    <p className="hint">In Auto mode, commitment delays target switching while the current target remains eligible. Cost and footprint are unchanged.</p>
    {!editable && <p className="hint">{definition.allowStatTuning ? 'Stat tuning is available only during unpaused preparation.' : 'This tower type does not allow test overrides.'}</p>}
  </details>;
}

function PassiveStatsPanel({ session, tower, planning, onEdit }: PanelProps) {
  const definition = session.getSnapshot().content.towerDefinitions.find(item => item.id === tower.definitionId)!;
  const stats = resolveTowerStats(definition, tower);
  const [range, setRange] = useState<string | null>(null);
  const raw = range ?? String(tower.statOverrides.range ?? definition.baseStats.range);
  const valid = raw.trim() !== '' && Number.isFinite(Number(raw)) && Number(raw) > 0 && Number(raw) <= 100;
  const apply = (overrides: TowerStatOverrides) => { if (session.dispatch({ type: 'set_stats', towerId: tower.id, overrides })?.accepted) { setRange(null); onEdit(); } };
  return <details><summary>Base stats &amp; tuning</summary><p>Cost: {stats.cost} Compute · footprint radius: {stats.footprintRadius} · effective range: {stats.range}</p>
    <label>Range<input aria-label="Tower range" type="number" value={raw} disabled={!planning || !definition.allowStatTuning} onChange={event => setRange(event.target.value)} /></label>
    <button disabled={!planning || !definition.allowStatTuning || !valid || range === null} onClick={() => apply({ range: Number(raw) })}>Apply stats</button>
    <button disabled={!planning || !definition.allowStatTuning} onClick={() => apply({})}>Reset stats</button>
  </details>;
}

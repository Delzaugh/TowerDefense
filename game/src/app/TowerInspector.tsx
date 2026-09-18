import { useState } from 'react';
import type { EncounterLabSession } from '../session/createEncounterLab';
import type { EncounterSnapshot } from '../simulation/encounter';
import { coverageProfiles, resolveCoverage } from '../simulation/encounter/coverage';
import { TowerStatsPanel } from './TowerStatsPanel';
import { resolveQaAura } from '../simulation/encounter/stats';

export function TowerInspector({ session, tower, onEdit }: { session: EncounterLabSession; tower: EncounterSnapshot['towers'][number]; onEdit: () => void }) {
  const view = session.getSnapshot(), state = view.snapshot;
  const editable = !state.paused && !view.busy && (state.phase === 'preparation' || state.phase === 'active');
  const planning = editable && state.phase === 'preparation';
  const definition = view.content.towerDefinitions.find(item => item.id === tower.definitionId)!;
  const coverage = resolveCoverage(view.content, tower)!;
  const action = tower.action, aura = resolveQaAura(definition, tower);
  const [angle, setAngle] = useState<string | null>(null);
  const value = angle ?? tower.facing.toString();
  const valid = value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) < 360;
  const configure = (command: unknown) => { onEdit(); session.dispatch(command); };
  const rotate = (facing: number) => { configure({ type: 'set_facing', towerId: tower.id, facing }); setAngle(null); };
  return <section className="selected-tower" data-testid="selected-tower" aria-label="Selected tower settings">
    <h2>Selected tower {tower.id}</h2>
    <p>{definition.label} · {definition.family === 'copilot' ? 'Copilot' : 'Human'}</p>
    <p className="hint">Changes affect this tower only. {planning ? 'Choose Cone, then drag the tower or its round aim handle.' : 'Coverage and facing are locked outside preparation.'}</p>
    <div className="tower-fields">
      <label>Coverage<select aria-label="Tower coverage" disabled={!planning} value={tower.coverageKind} onChange={event => configure({ type: 'set_coverage', towerId: tower.id, coverageKind: event.target.value })}>
        {coverageProfiles(definition).map(profile => <option key={profile.kind} value={profile.kind}>{profile.kind === 'area' ? 'Area · 360°' : `Cone · ${profile.angleDegrees}°`}</option>)}
      </select></label>
      {definition.kind === 'targeted' && action && <>
        <label>Mode<select aria-label="Tower mode" disabled={!editable} value={action.mode} onChange={event => configure({ type: 'set_mode', towerId: tower.id, mode: event.target.value })}>{definition.controls.modes.map(mode => <option key={mode} value={mode}>{mode === 'auto' ? 'Auto' : mode === 'build' ? 'Build' : 'Defend'}</option>)}</select></label>
        <label>Priority<select aria-label="Tower priority" disabled={!editable} value={action.priority} onChange={event => configure({ type: 'set_priority', towerId: tower.id, priority: event.target.value })}>{definition.controls.priorities.map(priority => <option key={priority} value={priority}>{priority === 'closest_to_product' ? 'Closest to Product' : 'First spawned'}</option>)}</select></label>
      </>}
    </div>
    {tower.coverageKind === 'cone' && definition.canRotate && <div className="tower-fields">
      <label>Facing °<input aria-label="Selected tower facing" type="number" min="0" max="359.9" step="0.1" disabled={!planning} value={value} onChange={event => setAngle(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && valid) rotate(Number(value)); }} /></label>
      <button disabled={!planning || !valid} onClick={() => rotate(Number(value))}>Apply angle</button>
      <button disabled={!planning} onClick={() => rotate((tower.facing + 345) % 360)}>−15°</button>
      <button disabled={!planning} onClick={() => rotate((tower.facing + 15) % 360)}>+15°</button>
      <button disabled={!planning} onClick={() => rotate((tower.facing + 90) % 360)}>Rotate 90°</button>
    </div>}
    <p className="hint">Facing {tower.facing}° · range {coverage.radius}{action && <> · target {action.targetId ?? 'none'} · cooldown {Math.max(0, action.readyTick - state.tick)} ticks · commitment {Math.max(0, action.commitmentUntil - state.tick)} ticks</>}</p>
    {aura && <p data-testid="qa-aura">QA Aura · Enemies {aura.slowPercent}% slower · +{aura.computeBonus} Compute per Work completion. Uses this tower's range and obstacle-blocked coverage. Strongest effect only.</p>}
    {definition.upgrades.length > 0 && <div className="tower-buttons">{definition.upgrades.map(upgrade => <button key={upgrade.id} disabled={!editable || tower.upgrades.includes(upgrade.id) || state.compute < upgrade.cost} onClick={() => configure({ type: 'buy_upgrade', towerId: tower.id, upgradeId: upgrade.id })}>{upgrade.label} · {tower.upgrades.includes(upgrade.id) ? 'Owned' : `${upgrade.cost} Compute`}</button>)}</div>}
    {definition.allowStatTuning && definition.externalEffects.length > 0 && <details><summary>External effect testing</summary><p className="hint">Engineering fixtures; effect duration uses simulation time.</p>{definition.externalEffects.map(effect => <button key={effect.id} disabled={!editable} onClick={() => configure({ type: 'apply_effect', towerId: tower.id, effectId: effect.id, sourceId: 'lab' })}>Test {effect.label}</button>)}</details>}
    {tower.activeEffects.map(effect => <p key={`${effect.sourceId}:${effect.effectId}`} data-testid="active-effect">{definition.externalEffects.find(item => item.id === effect.effectId)!.label} · {Math.max(0, effect.expiresTick - state.tick)} ticks remaining</p>)}
    {!editable && <p className="hint">{state.paused ? 'Paused: resume before changing settings.' : view.busy ? 'Storage operation in progress.' : 'Run finished: prepare another attempt to edit.'}</p>}
    <TowerStatsPanel session={session} tower={tower} planning={planning} onEdit={onEdit} />
  </section>;
}

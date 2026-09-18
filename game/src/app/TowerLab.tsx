import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { EncounterLabSession } from '../session/createEncounterLab';
import { toLogicalPoint } from '../input/pointerInput';
import type { Point } from '../content/schemas/scenario';
import { resolveCoverage } from '../simulation/encounter/coverage';
import { resolveTowerStats, resolveQaAura } from '../simulation/encounter/stats';
import { facingToward } from '../simulation/aiming';
import { TowerInspector } from './TowerInspector';
import { createPortal } from 'react-dom';

export function TowerLab({ session, inspectorHost }: { session: EncounterLabSession; inspectorHost: HTMLDivElement | null }) {
  const view = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const state = view.snapshot, content = session.content;
  const [selectedId, updateSelected] = useState<number | null>(null);
  const [tool, setTool] = useState<'tower' | 'marker' | 'select'>('tower');
  const placing = tool === 'tower', marking = tool === 'marker';
  function setPlacing(value: boolean) { gesture.current = null; setAim(null); setTool(old => value ? 'tower' : old === 'tower' ? 'select' : old); }
  function setMarking(value: boolean) { gesture.current = null; setAim(null); setTool(old => value ? 'marker' : old === 'marker' ? 'select' : old); }
  const [aim, setAim] = useState<number | null>(null);
  function select(id: number) {
    gesture.current = null; setAim(null); updateSelected(id);
    // Reveal the inspector in the desktop scroll pane without moving the map during a drag.
    inspectorHost?.parentElement?.scrollTo({ top: 0 });
  }
  const [chosenDefinition, setChosenDefinition] = useState(content.towerDefinitions[0]!.id);
  const definitionId = content.towerDefinitions.some(item => item.id === chosenDefinition) ? chosenDefinition : content.towerDefinitions[0]!.id;
  const placementStats = resolveTowerStats(content.towerDefinitions.find(item => item.id === definitionId)!);
  const footprint = (tower: { definitionId: string }) => resolveTowerStats(content.towerDefinitions.find(item => item.id === tower.definitionId)!).footprintRadius;
  const hitRadius = (tower: { definitionId: string }) => Math.max(.65, footprint(tower));
  const [position, setPosition] = useState<Point>({ x: -5, z: 0 });
  const gesture = useRef<{ id: number; x: number; y: number; towerId: number | null; rotating: boolean } | null>(null);
  const mapRef = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    // SVG child touch-action alone is not honored by every browser. Suppress scrolling
    // only for touches starting on an editable Cone/handle, never on empty map space.
    const start = (event: TouchEvent) => {
      if ((event.target as Element).closest('[data-aim-handle], [data-rotatable-tower]')) event.preventDefault();
    };
    map?.addEventListener('touchstart', start, { passive: false });
    return () => map?.removeEventListener('touchstart', start);
  }, []);
  const selected = state.towers.find(tower => tower.id === selectedId);
  const draft = { definitionId, position, facing: 0 };
  const rejection = session.previewPlacement(definitionId, draft.position);
  const coverage = !placing && selected ? { ...selected, facing: aim ?? selected.facing } : placing ? draft : null;
  const definition = content.towerDefinitions.find(item => item.id === coverage?.definitionId);
  const profile = coverage ? resolveCoverage(content, coverage) : undefined;
  const editable = !state.paused && !view.busy && (state.phase === 'preparation' || state.phase === 'active');
  const planning = editable && state.phase === 'preparation';
  useEffect(() => {
    const cancel = () => { gesture.current = null; setAim(null); };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    cancel();
    window.addEventListener('keydown', key); document.addEventListener('visibilitychange', cancel);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', cancel); gesture.current = null; };
  }, [state.phase, state.paused, state.commandSequence, view.busy]);
  const cx = coverage?.position.x, cz = coverage?.position.z, cf = coverage?.facing;
  const coverageShapes = useMemo(() => {
    if (cx === undefined || cz === undefined || cf === undefined || !definition || !profile) return null;
    const origin = { x: cx, z: cz };
    const tower = { definitionId: definition.id, position: origin, facing: cf, coverageKind: profile.kind, statOverrides: { range: profile.radius } };
    const sweep = profile.kind === 'area' ? 360 : profile.angleDegrees;
    const start = cf - sweep / 2, nominal: string[] = [], effective: string[] = [];
    if (sweep < 360) { nominal.push(`${cx},${cz}`); effective.push(`${cx},${cz}`); }
    for (let i = 0; i <= 180; i++) {
      const radians = (start + sweep * i / 180) * Math.PI / 180;
      const point = (r: number) => ({ x: cx + Math.cos(radians) * r, z: cz + Math.sin(radians) * r });
      const end = point(profile.radius); nominal.push(`${end.x},${end.z}`);
      let low = 0, high = profile.radius;
      if (session.inspectCoverage(tower, end) === 'visible') low = high;
      else for (let step = 0; step < 14; step++) { const middle = (low + high) / 2; if (session.inspectCoverage(tower, point(middle)) === 'visible') low = middle; else high = middle; }
      const visible = point(low); effective.push(`${visible.x},${visible.z}`);
    }
    return { nominal: nominal.join(' '), effective: effective.join(' ') };
  }, [cx, cz, cf, definition, profile?.kind, profile?.radius, profile?.kind === 'cone' ? profile.angleDegrees : 360, session]);
  function place(point: Point = draft.position, keepPlacing = false) {
    if (!editable) return;
    const result = session.dispatch({ type: 'place_tower', definitionId, position: point, facing: draft.facing });
    const event = result?.events.find(item => item.type === 'tower_placed');
    if (event && 'towerId' in event) { select(event.towerId); setPlacing(keepPlacing); setMarking(false); }
  }
  function updateDraft(point: Point) { setPosition({ x: Math.round(point.x * 10) / 10, z: Math.round(point.z * 10) / 10 }); }
  return <>
    <div className="map-toolbar">
      {content.towerDefinitions.length > 1 && <label>Tower type<select aria-label="Tower type" value={definitionId} disabled={!editable} onChange={event => { setChosenDefinition(event.target.value); setPlacing(true); }}>{content.towerDefinitions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>}
      <button disabled={!editable} aria-pressed={placing} onClick={() => { setPlacing(!placing); setMarking(false); }}>{placing ? 'Cancel map placement' : 'Place on map'}</button>
      <span className="badge" data-testid="tower-count">{state.towers.length} / {content.towerLimit ?? 100} towers</span>
      <p className="hint" id="map-instructions">{!editable
        ? state.paused ? 'Paused: resume to place towers or markers.' : view.busy ? 'Saving/loading: map edits are temporarily locked.' : 'Encounter finished: reset to place towers.'
        : marking ? 'Sight marker: click/tap the map to move the diagnostic marker.'
          : placing ? `Click to place · ${placementStats.cost} Compute. Select a tower to change Area / Cone and settings.`
            : 'Inspect mode: click a tower, or choose Place on map to add another.'}</p>
    </div>
    <svg ref={mapRef} className="probe-map encounter-map tower-map" viewBox="-11 -7 22 14" role="img" tabIndex={0} aria-label="Tower placement map. Arrow keys move the placement cursor; Enter places. Use tower buttons to inspect."
      onKeyDown={event => {
        if (!placing || !editable) return;
        const delta: Record<string, Point> = { ArrowLeft: { x: -.5, z: 0 }, ArrowRight: { x: .5, z: 0 }, ArrowUp: { x: 0, z: -.5 }, ArrowDown: { x: 0, z: .5 } };
        const move = delta[event.key];
        if (move) { event.preventDefault(); updateDraft({ x: Math.max(-10, Math.min(10, position.x + move.x)), z: Math.max(-6, Math.min(6, position.z + move.z)) }); }
        else if (event.key === 'Enter') { event.preventDefault(); place(position, true); }
      }}
      aria-describedby="map-instructions" data-tool={!editable ? 'locked' : marking ? 'marker' : placing ? 'tower' : 'select'}
      onPointerDown={event => {
        if (!event.isPrimary || gesture.current) { gesture.current = null; setAim(null); return; }
        if (event.button !== 0) return;
        const point = toLogicalPoint(event.currentTarget, event.clientX, event.clientY); if (!point) return;
        const handle = (event.target as Element).closest('[data-aim-handle]');
        const hit = handle ? selected : !marking ? state.towers.find(tower => Math.hypot(tower.position.x - point.x, tower.position.z - point.z) <= hitRadius(tower)) : undefined;
        if (hit) { event.preventDefault(); select(hit.id); setPlacing(false); setMarking(false); }
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, towerId: hit?.id ?? null, rotating: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const point = toLogicalPoint(event.currentTarget, event.clientX, event.clientY); if (!point) return;
        const start = gesture.current;
        if (start && start.id === event.pointerId && start.towerId !== null) {
          const tower = state.towers.find(item => item.id === start.towerId);
          if (!planning || tower?.coverageKind !== 'cone' || !content.towerDefinitions.find(item => item.id === tower.definitionId)!.canRotate) return;
          if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) start.rotating = true;
          if (start.rotating) setAim(facingToward(tower.position, point));
        } else if (placing && event.pointerType === 'mouse') updateDraft(point);
      }}
      onPointerCancel={() => { gesture.current = null; setAim(null); }} onLostPointerCapture={() => { gesture.current = null; setAim(null); }}
      onPointerUp={event => {
        const start = gesture.current; gesture.current = null; setAim(null);
        if (!start || start.id !== event.pointerId) return;
        const point = toLogicalPoint(event.currentTarget, event.clientX, event.clientY); if (!point) return;
        if (start.towerId !== null) {
          const tower = state.towers.find(item => item.id === start.towerId);
          const angle = tower ? facingToward(tower.position, point) : null;
          if (start.rotating && planning && tower?.coverageKind === 'cone' && content.towerDefinitions.find(item => item.id === tower.definitionId)!.canRotate && angle !== null && angle !== tower.facing) session.dispatch({ type: 'set_facing', towerId: tower.id, facing: angle });
          return;
        }
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
        if (marking) { session.placeMarker(point); return; }
        const hit = state.towers.find(tower => Math.hypot(tower.position.x - point.x, tower.position.z - point.z) <= hitRadius(tower));
        if (hit) { select(hit.id); setPlacing(false); }
        else if (placing) { updateDraft(point); place({ x: Math.round(point.x * 10) / 10, z: Math.round(point.z * 10) / 10 }, true); }
      }}>
      <defs><pattern id="blocked-coverage" patternUnits="userSpaceOnUse" width="0.3" height="0.3"><path d="M0 0 L.3 .3" stroke="#956956" strokeWidth="0.03" /></pattern><pattern id="test-grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0 L0 0 L0 1" fill="none" stroke="#c6d3c4" strokeWidth=".025" /></pattern></defs>
      <rect x={content.map.buildable.min.x} y={content.map.buildable.min.z} width={content.map.buildable.max.x - content.map.buildable.min.x} height={content.map.buildable.max.z - content.map.buildable.min.z} fill="#e9eee5" />
      <rect x={content.map.buildable.min.x} y={content.map.buildable.min.z} width={content.map.buildable.max.x - content.map.buildable.min.x} height={content.map.buildable.max.z - content.map.buildable.min.z} fill="url(#test-grid)" />
      {coverageShapes && <g pointerEvents="none"><polygon data-testid="coverage-outline" points={coverageShapes.nominal} fill="url(#blocked-coverage)" stroke="#617668" strokeWidth="0.04" strokeDasharray="0.15 .15" /><polygon points={coverageShapes.effective} fill="#c3dfce" stroke="#318165" strokeWidth="0.04" /></g>}
      {content.map.routes.map(route => <g key={route.id}><polyline points={route.points.map(point => `${point.x},${point.z}`).join(' ')} fill="none" stroke="#bdccbe" strokeWidth={route.width} strokeLinecap="round" strokeLinejoin="round" /><rect x={route.points.at(-1)!.x - .35} y={route.points.at(-1)!.z - .35} width=".7" height=".7" fill={state.phase === 'failed' ? '#934b3d' : '#405867'} /><text x={route.points.at(-1)!.x} y={route.points.at(-1)!.z - 1} textAnchor="middle" fontSize="0.4">Product</text></g>)}
      {content.map.obstacles.map(obstacle => <g key={obstacle.id}><rect x={obstacle.footprint.min.x} y={obstacle.footprint.min.z} width={obstacle.footprint.max.x - obstacle.footprint.min.x} height={obstacle.footprint.max.z - obstacle.footprint.min.z} fill="#c5a18c" stroke="#734a37" strokeWidth="0.05" /><text x={(obstacle.footprint.min.x + obstacle.footprint.max.x) / 2} y={obstacle.footprint.max.z + 0.5} textAnchor="middle" fontSize="0.38">Blocked</text></g>)}
      {view.entities.map(entity => <g data-testid="traffic-entity" key={entity.id} transform={`translate(${entity.position.x},${entity.position.z})`}>
        {entity.kind === 'work' ? <rect x="-.3" y="-.3" width=".6" height=".6" fill="#237b68" stroke="white" strokeWidth=".07" /> : <circle r=".33" fill="#b56843" stroke="white" strokeWidth=".07" />}
        <text y="-.6" fontSize=".38" textAnchor="middle">{entity.kind === 'work' ? 'W' : 'P'}{entity.id} · {entity.remaining}{entity.slowPercent > 0 ? ` · −${entity.slowPercent}%` : ''}</text>
      </g>)}
      {state.towers.map(tower => {
        const target = view.entities.find(entity => entity.id === tower.action?.targetId);
        return <g key={tower.id} data-testid="placed-tower" data-rotatable-tower={planning && tower.coverageKind === 'cone' && content.towerDefinitions.find(item => item.id === tower.definitionId)!.canRotate ? 'true' : undefined} style={{ touchAction: planning && tower.coverageKind === 'cone' && content.towerDefinitions.find(item => item.id === tower.definitionId)!.canRotate ? 'none' : 'pan-y' }}>
          <circle cx={tower.position.x} cy={tower.position.z} r={hitRadius(tower)} fill="transparent" />
          {target && <line x1={tower.position.x} y1={tower.position.z} x2={target.position.x} y2={target.position.z} stroke="#356897" strokeWidth="0.08" />}
          <circle cx={tower.position.x} cy={tower.position.z} r={footprint(tower)} fill={tower.id === selectedId ? '#285882' : '#495b69'} stroke="white" strokeWidth=".09" />
          <text x={tower.position.x} y={tower.position.z + .13} fontSize=".36" textAnchor="middle" fill="white">{tower.id}</text>
          {resolveQaAura(content.towerDefinitions.find(item => item.id === tower.definitionId)!, tower) && <text x={tower.position.x} y={tower.position.z + .85} fontSize=".32" textAnchor="middle" pointerEvents="none">QA</text>}
        </g>;
      })}
      {selected?.coverageKind === 'cone' && !placing && <g data-testid="aim-direction">
        <line x1={selected.position.x} y1={selected.position.z} x2={selected.position.x + Math.cos((aim ?? selected.facing) * Math.PI / 180) * 1.6} y2={selected.position.z + Math.sin((aim ?? selected.facing) * Math.PI / 180) * 1.6} stroke="#285882" strokeWidth=".09" pointerEvents="none" />
        {planning && definition?.canRotate && <circle data-aim-handle="true" data-testid="aim-handle" cx={selected.position.x + Math.cos((aim ?? selected.facing) * Math.PI / 180) * 1.6} cy={selected.position.z + Math.sin((aim ?? selected.facing) * Math.PI / 180) * 1.6} r=".4" fill="#fff" stroke="#285882" strokeWidth=".1" style={{ touchAction: 'none', cursor: 'grab' }} />}
        <text x={selected.position.x} y={selected.position.z - .9} fontSize=".4" textAnchor="middle" pointerEvents="none">{aim ?? selected.facing}°{aim !== null ? ' preview' : ''}</text>
      </g>}
      {view.marker && <g pointerEvents="none">
        <line x1={view.marker.x} y1={view.marker.z} x2={view.probe.x} y2={view.probe.z} stroke={view.sight ? '#237b68' : '#995b46'} strokeWidth=".07" strokeDasharray={view.sight ? undefined : '.2 .2'} />
        <path data-testid="sight-marker" d={`M ${view.marker.x} ${view.marker.z - .4} l .4 .4 l -.4 .4 l -.4 -.4 Z`} fill="#237b68" stroke="white" strokeWidth=".06" />
        <text x={view.marker.x} y={view.marker.z + .8} fontSize=".35" textAnchor="middle">Sight marker</text>
      </g>}
      <circle data-testid="clock-probe" cx={view.probe.x} cy={view.probe.z} r=".18" fill="#f4ba52" stroke="#514b37" strokeWidth=".04" pointerEvents="none" />
      {placing && <g pointerEvents="none"><circle cx={draft.position.x} cy={draft.position.z} r={placementStats.footprintRadius} fill="none" stroke={rejection ? '#a34432' : '#237b68'} strokeWidth=".1" strokeDasharray=".1 .1" /><text x={draft.position.x} y={draft.position.z + .9} fontSize=".4" textAnchor="middle">{rejection ? '×' : '+'}</text></g>}
    </svg>
    <div className="map-footer"><span>□ Work · ○ Problem · hatched = occluded</span><span data-testid="placement-reason">{placing ? rejection ? `Cannot place: ${rejection.replaceAll('_', ' ')}` : `Place at ${position.x}, ${position.z} · arrows + Enter` : 'Click a tower to inspect'}</span></div>
    <div className="tower-buttons map-tower-list">{state.towers.map(tower => <button key={tower.id} aria-pressed={tower.id === selectedId} onClick={() => { select(tower.id); setTool('select'); }}>Tower {tower.id}</button>)}</div>
    {selected && inspectorHost && createPortal(<TowerInspector key={`${selected.id}:${selected.facing}`} session={session} tower={selected} onEdit={() => setTool('select')} />, inspectorHost)}
    <details className="map-diagnostics"><summary>Sight &amp; target diagnostics</summary>
      <h3>Live targets</h3><ul className="live-targets">{view.entities.map(entity => <li key={entity.id}>#{entity.id} {entity.kind} · remaining {entity.remaining}{coverage ? ` · ${session.inspectCoverage(coverage, entity.position).replaceAll('_', ' ')}` : ''}{entity.slowPercent > 0 ? ` · QA slow ${entity.slowPercent}%` : ''}{entity.computeBonus > 0 ? ` · completion bonus +${entity.computeBonus} Compute` : ''}</li>)}</ul>
      <p className="hint">Coverage outline is sampled for display; exact simulation queries decide visibility. Selecting or previewing while paused never changes gameplay.</p>
      <section className="marker-tools" aria-label="Geometry diagnostics"><h3>Sight marker &amp; clock probe</h3>
        <p className="hint">Free geometry diagnostic, not a tower. Footprints reject placement; the line tests blocker occlusion, without tower range limits. The yellow probe follows tick / 600 on this route and freezes with the encounter—even if traffic clears early.</p>
        <div className="tower-buttons"><button disabled={!editable} onClick={() => session.placeMarker({ x: -7, z: 0 })}>Place left</button><button disabled={!editable} onClick={() => session.placeMarker({ x: 7, z: 0 })}>Place right</button><button disabled={!editable || !view.marker} onClick={session.clearMarker}>Clear marker</button></div>
        <button className="marker-map-toggle" disabled={!editable} aria-pressed={marking} onClick={() => { setMarking(!marking); setPlacing(false); }}>{marking ? 'Cancel marker placement' : 'Place marker on map'}</button>
        <p className="hint">Map tool: {marking ? 'sight marker' : placing ? 'tower placement' : 'tower selection'}. Marker edits are frozen while paused, finished, or saving.</p>
      </section>
    </details>
  </>;
}


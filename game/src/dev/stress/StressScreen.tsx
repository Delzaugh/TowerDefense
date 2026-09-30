import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeftIcon, PlayIcon, SyncIcon } from '@primer/octicons-react';
import { Button, GameTopBar, Input, SegmentedControl, StatusBadge, Surface } from '../../ui/toolkit';
import { downloadPerformanceReport, getTrackingEnabled, setTrackingEnabled, subscribeTracking } from '../../diagnostics/performance';
import { createStressScene } from './createStressScene';
import type { StressScene, StressStatus } from './createStressScene';
import { BENCHMARK_DURATION_MS } from './benchmark';
import { STRESS_PRESETS, STRESS_SEED, TOWER_COUNTS } from './layout';
import type { StressPreset, StressView } from './layout';
import './stress.css';

const initialStatus: StressStatus = { phase: 'loading', preset: 25, view: 'home', paused: false,
  benchmark: null, message: 'Opening the stress map…', report: null };

export function StressScreen() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<StressScene | null>(null);
  const [status, setStatus] = useState<StressStatus>(initialStatus);
  const [attempt, setAttempt] = useState(0);
  const tracking = useSyncExternalStore(subscribeTracking, getTrackingEnabled);
  useEffect(() => {
    if (!canvas.current) return;
    let active = true;
    setStatus(initialStatus);
    try {
      const current = createStressScene(canvas.current, value => { if (active) setStatus(value); });
      scene.current = current;
      return () => { active = false; current.dispose(); if (scene.current === current) scene.current = null; };
    } catch (error) {
      setStatus({ ...initialStatus, phase: 'error', message: error instanceof Error ? error.message : 'WebGL is unavailable in this browser.' });
    }
    return () => { active = false; };
  }, [attempt]);
  const testing = status.benchmark !== null;
  const available = status.phase === 'ready';
  return <main className="stress-screen" data-testid="stress-screen" data-state={status.phase}>
    <GameTopBar leading={<a className="stress-home-link" href="#/"><ArrowLeftIcon size={16} />Campus</a>}
      location="Performance stress map" context="Development test fixture"
      trailing={<StatusBadge tone={testing ? 'attention' : 'neutral'}>{testing ? 'Benchmark running' : 'Seed ' + STRESS_SEED}</StatusBadge>} />
    <div className="stress-layout">
      <div className="stress-world">
        <canvas ref={canvas} aria-label="3D switchback map with moving enemies and working towers" />
        <div className="stress-world-caption"><strong>{status.preset} movers</strong><span>{TOWER_COUNTS[status.preset]} working towers · {status.view === 'top' ? 'Top view' : 'Home view'}</span></div>
        {status.phase !== 'ready' && <div className="stress-world-notice" role="status"><strong>{status.phase === 'error' ? 'Map unavailable' : 'Preparing the map'}</strong><p>{status.message}</p>
          {status.phase === 'error' && <Button variant="primary" onClick={() => setAttempt(value => value + 1)}>Reload map</Button>}
        </div>}
      </div>
      <aside className="stress-controls" aria-label="Stress test controls">
        <Surface className="stress-card"><span className="stress-eyebrow">REPEATABLE TEST</span><h1>Synthetic rendering and animation fixture</h1>
          <p>A small seeded loop using delivered Copilot, Developer, enemy and work models. It measures rendering and animation load. Gameplay combat and progression are outside this fixture.</p>
          <label className="stress-tracking"><Input type="checkbox" checked={tracking} onChange={event => setTrackingEnabled(event.target.checked)} />Performance tracking</label>
        </Surface>
        <Surface className="stress-card"><h2>Map controls</h2>
          <SegmentedControl label="Moving model count" value={String(status.preset)} disabled={!available || testing}
            onChange={value => scene.current?.setPreset(Number(value) as StressPreset)}
            options={STRESS_PRESETS.map(value => ({ value: String(value), label: String(value) }))} />
          <p className="stress-help">Movers: mixed animated models. Towers: 4–12 working Copilots and Developers.</p>
          <SegmentedControl label="Stress camera" value={status.view} disabled={!available || testing}
            onChange={value => scene.current?.setView(value as StressView)} options={[{ value: 'home', label: 'Home view' }, { value: 'top', label: 'Top view' }]} />
          <div className="stress-actions"><Button disabled={!available || testing} onClick={() => scene.current?.setPaused(!status.paused)}><PlayIcon size={14} />{status.paused ? 'Resume' : 'Pause'}</Button>
            <Button disabled={!available || testing} onClick={() => scene.current?.reset()}><SyncIcon size={14} />Reset seed</Button></div>
        </Surface>
        <Surface className="stress-card"><h2>Automatic benchmark</h2>
          <p>Home view · {BENCHMARK_DURATION_MS / 1000} seconds. Warm up, record 25 movers, raise to 50, 100 and 200, then return to 25 for recovery.</p>
          <p className="stress-help">Running enables tracking. Keep this tab visible and its viewport fixed. Interruptions retain a partial report.</p>
          {testing ? <Button variant="danger" onClick={() => scene.current?.cancelBenchmark()}>Cancel benchmark</Button> :
            <Button variant="primary" disabled={!available} onClick={() => scene.current?.runBenchmark()}>Run benchmark</Button>}
          <p role="status" className="stress-result">{status.message}</p>
          {status.report && <><StatusBadge tone={status.report.status === 'completed' ? 'positive' : 'attention'}>{status.report.status}</StatusBadge>
            <p className="stress-help">{status.report.phases.length} recorded phases · {(status.report.durationMs / 1000).toFixed(1)} seconds</p>
            <Button onClick={() => downloadPerformanceReport(status.report!)}>Download benchmark JSON</Button></>}
        </Surface>
      </aside>
    </div>
  </main>;
}

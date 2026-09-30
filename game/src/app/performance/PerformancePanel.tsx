import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@primer/octicons-react';
import { Button, Input, Select, StatusBadge, Surface } from '../../ui/toolkit';
import {
  downloadPerformanceReport, getPerformanceSnapshot, getTrackingEnabled, resetLiveSamples,
  setTrackingEnabled, startRecording, stopRecording, subscribeTracking,
} from '../../diagnostics/performance';
import type { PerformanceReport, PerformanceStreamSummary } from '../../diagnostics/types';
import './performance.css';

const count = (value: number | undefined | null) => value === null || value === undefined ? '—' : Math.round(value).toLocaleString();
const milliseconds = (value: number | undefined | null) => value === null || value === undefined ? '—' : `${value.toFixed(2)} ms`;
const humanize = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');

function sourceState(stream: PerformanceStreamSummary): string {
  if (!stream.active) return 'Source closed';
  const state = stream.metrics.state;
  if (state && typeof state === 'object') {
    const values = state as Record<string, unknown>;
    if (values.paused === true) return 'Paused';
    if (values.reducedMotion === true) return 'Reduced motion · demand-driven';
  }
  if (!stream.samples) return 'Waiting for samples';
  if (stream.kind === 'renderer' && stream.fps === null) return 'Demand-driven · no continuous cadence';
  return stream.kind === 'renderer' ? 'Rendering' : 'Simulation';
}

function SourceSummary({ stream }: { stream: PerformanceStreamSummary }) {
  const renderer = stream.kind === 'renderer';
  const state = stream.metrics.state && typeof stream.metrics.state === 'object' ? stream.metrics.state as Record<string, unknown> : {};
  const tick = typeof state.tick === 'number' ? state.tick : typeof stream.metadata.tick === 'number' ? stream.metadata.tick : null;
  const metadata = Object.entries(stream.metadata).filter(([, value]) =>
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
  );
  return <>
    <p className="performance-source-status">{sourceState(stream)} <span>· {count(stream.samples)} samples</span></p>
    <dl className="performance-measurements">
      {renderer && <><dt>Sampled render rate</dt><dd>{stream.fps === null ? '—' : `${stream.fps.toFixed(1)} FPS`}</dd></>}
      <dt>{renderer ? 'Render cadence p95 / p99' : 'Sim callback cadence p95 / p99'}</dt>
      <dd>{milliseconds(stream.frameIntervalMs?.p95)} / {milliseconds(stream.frameIntervalMs?.p99)}</dd>
      <dt>{renderer ? 'CPU submission p95 / p99' : 'Simulation CPU p95 / p99'}</dt>
      <dd>{milliseconds(stream.cpuMs?.p95)} / {milliseconds(stream.cpuMs?.p99)}</dd>
      {renderer ? <>
        <dt>Draw calls p95</dt><dd>{count(stream.calls?.p95)}</dd>
        <dt>Triangles p95</dt><dd>{count(stream.triangles?.p95)}</dd>
        <dt>Geometries / textures / programs</dt><dd>{count(stream.metrics.geometries)} / {count(stream.metrics.textures)} / {count(stream.metrics.programs)}</dd>
        {stream.metrics.bufferWidth !== undefined && <><dt>Render buffer · pixel ratio</dt><dd>{count(stream.metrics.bufferWidth)} × {count(stream.metrics.bufferHeight)} · {stream.metrics.pixelRatio?.toFixed(2) ?? '—'}</dd></>}
      </> : <>
        {tick !== null && <><dt>Current logical tick</dt><dd>{count(tick)}</dd></>}
        <dt>Simulated steps / overloads</dt><dd>{count(stream.steps)} / {count(stream.overloads)}</dd>
      </>}
      <dt>Callbacks over 50 / 100 ms</dt><dd>{count(stream.framesOver50ms)} / {count(stream.framesOver100ms)}</dd>
    </dl>
    {stream.samples < 2 && <p className="performance-note">More samples are needed for cadence percentiles.</p>}
    {renderer && <p className="performance-note">CPU submission measures browser work. GPU time is not measured.</p>}
    {metadata.length > 0 && <details className="performance-metadata">
      <summary>Source details</summary>
      <dl className="performance-measurements">{metadata.map(([key, value]) => <div className="performance-metadata-row" key={key}>
        <dt>{humanize(key)}</dt><dd>{typeof value === 'number' ? (key.endsWith('Ms') ? milliseconds(value) : count(value)) : String(value)}</dd>
      </div>)}</dl>
    </details>}
  </>;
}

function EnabledPerformancePanel() {
  const panelId = useId();
  const sourceId = useId();
  const labelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState(getPerformanceSnapshot);
  const [sourceName, setSourceName] = useState('');
  const [label, setLabel] = useState('Manual performance capture');
  const [lastReport, setLastReport] = useState<PerformanceReport | null>(null);
  const refresh = () => setReport(getPerformanceSnapshot());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    const updateVisibility = () => {
      if (timer !== undefined) clearInterval(timer);
      timer = undefined;
      if (document.visibilityState !== 'hidden') {
        setReport(getPerformanceSnapshot());
        timer = setInterval(() => setReport(getPerformanceSnapshot()), 1000);
      }
    };
    updateVisibility();
    const unsubscribe = subscribeTracking(() => {
      if (document.visibilityState !== 'hidden') setReport(getPerformanceSnapshot());
    });
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      if (timer !== undefined) clearInterval(timer);
      document.removeEventListener('visibilitychange', updateVisibility);
      unsubscribe();
    };
  }, []);

  const recording = report.status === 'recording';
  const stressRecording = recording && report.configuration.owner === 'stress-map';
  const stream = report.streams.find(item => item.name === sourceName)
    ?? report.streams.find(item => item.active && item.kind === 'renderer')
    ?? report.streams.find(item => item.active)
    ?? report.streams[0];
  const record = () => {
    if (startRecording(label.trim() || 'Manual performance capture')) setLastReport(null);
    refresh();
  };
  const stop = () => {
    const current = getPerformanceSnapshot();
    if (current.status === 'recording' && current.configuration.owner === 'stress-map') {
      refresh();
      return;
    }
    setLastReport(stopRecording('completed', 'Stopped by user'));
    refresh();
  };

  return <Surface className="performance-panel" role="complementary" aria-label="Performance tracking"
    data-testid="performance-panel" data-expanded={expanded} onKeyDown={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
    <Button className="performance-toggle" variant="quiet" aria-label="Performance panel" aria-expanded={expanded} aria-controls={panelId}
      onClick={() => setExpanded(value => !value)}>
      <span>Performance</span>
      {recording && <StatusBadge tone="attention">Recording</StatusBadge>}
      {expanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
    </Button>
    {expanded && <div id={panelId} className="performance-body">
      <div className="ui-field">
        <label htmlFor={sourceId}>Measurement source</label>
        <Select id={sourceId} value={stream?.name ?? ''} disabled={!report.streams.length} onChange={event => setSourceName(event.currentTarget.value)}>
          {!report.streams.length && <option value="">Waiting for a source</option>}
          {report.streams.map(item => <option value={item.name} key={item.name}>{item.name} · {item.kind}{item.active ? '' : ' · closed'}</option>)}
        </Select>
      </div>
      {stream ? <SourceSummary stream={stream} /> : <p className="performance-note">Measurements appear when a renderer or simulation is active.</p>}
      <div className="performance-browser-work">
        {report.support.longTasks ? `${count(report.longTasks.count)} long tasks · ${milliseconds(report.longTasks.durationMs)}` : 'Long-task measurements unavailable in this browser'}
      </div>
      <div className="ui-field performance-record-label">
        <label htmlFor={labelId}>Capture name</label>
        <Input id={labelId} value={label} maxLength={100} disabled={recording} onChange={event => setLabel(event.currentTarget.value)} />
      </div>
      <div className="performance-actions">
        <Button variant="primary" disabled={recording} onClick={record}>Record</Button>
        <Button disabled={!recording || stressRecording} onClick={stop}>Stop</Button>
        <Button title="Reset live samples while preserving the active capture" onClick={() => { resetLiveSamples(); refresh(); }}>Reset live window</Button>
        <Button onClick={() => downloadPerformanceReport(recording ? getPerformanceSnapshot({ raw: true }) : undefined)}>Download report</Button>
      </div>
      {stressRecording && <p className="performance-note">The stress test map controls this capture. Use Cancel benchmark there to stop.</p>}
      <p className="performance-note"><span role="status">{recording ? `Recording ${report.label}` : lastReport ? `Manual capture: ${lastReport.label} · ${lastReport.status}. Ready to download.` : 'Reports are saved only when you download them.'}</span>{recording && <span aria-hidden="true"> · {(report.durationMs / 1000).toFixed(0)} s</span>}</p>
      <Button variant="quiet" className="performance-disable" onClick={() => setTrackingEnabled(false)}>Disable tracking</Button>
    </div>}
  </Surface>;
}

export function PerformancePanel() {
  const enabled = useSyncExternalStore(subscribeTracking, getTrackingEnabled);
  return enabled ? <EnabledPerformancePanel /> : null;
}

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CodeIcon, CpuIcon, CrosshairsIcon, MeterIcon, PackageIcon, PulseIcon, ZapIcon } from '@primer/octicons-react';
import '@fontsource-variable/mona-sans';
import { TOWERS, getTower } from '../../content/towers/catalog';
import type { TowerReference } from '../../content/towers/catalog';
import type { AnimationChoice, ShowcaseStatus, TowerShowcaseScene } from '../../rendering/showcase/types';
import { getVisualStats } from './visualStats';
import type { TowerShowcaseDialogProps } from './types';

const STAT_ICONS: Record<string, typeof ZapIcon> = { damage: ZapIcon, 'work-throughput': CodeIcon, 'action-cadence': MeterIcon, range: CrosshairsIcon, investment: CpuIcon };
const bundledPortraits = import.meta.glob<string>('./portraits/*.png', { eager: true, import: 'default', query: '?url' });
const portraitCache: Record<string, string> = Object.fromEntries(Object.entries(bundledPortraits).map(([path, url]) => [path.split('/').pop()!.replace('.png', ''), url]));

function Portrait({ tower, source }: { tower: TowerReference; source: string | undefined }) {
  return <span className="codex-portrait-art" style={{ '--tower-accent': tower.accent } as CSSProperties}>
    {source ? <img src={source} alt="" draggable={false} /> : <svg className={tower.modelId ? 'codex-model-symbol' : 'codex-silhouette'} viewBox="0 0 90 82" aria-hidden="true"><path d="m20 24 20-13 29 6 12 17-3 28-25 12-30-8-12-23Z" fill="currentColor"/><path d="m19 34 23-7 29 5-4 27-24 7-21-7Z" fill="#0c1b2a" opacity=".7"/><path d="M31 41v12m22-14v12" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><path d="m28 23 5-9 25-5 9 12" fill="currentColor"/></svg>}
  </span>;
}

function TowerStats({ tower }: { tower: TowerReference }) {
  const stats = getVisualStats(tower);
  return <section className="codex-console codex-stats" aria-labelledby="codex-stats-title">
    <div className="codex-console-heading"><h2 id="codex-stats-title">Stats</h2></div>
    <p className="codex-tower-description">{tower.description}</p>
    {stats.length ? <div className="codex-gauges">{stats.map(stat => {
      const Icon = STAT_ICONS[stat.id] ?? PulseIcon;
      return <div key={stat.id} className={`codex-gauge codex-gauge-${stat.tone}`}>
        <Icon size={24} /><span className="codex-gauge-body"><span className="codex-gauge-label">{stat.label}</span>
          <span className="codex-segments" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} className={index < stat.segments ? 'is-filled' : ''} />)}</span>
          <span className="codex-gauge-description">{stat.description}</span>
        </span>
      </div>;
    })}</div> : <p className="codex-unavailable-copy">Stats not yet defined</p>}
    {tower.abilities.length > 0 && <div className="codex-abilities"><span className="codex-eyebrow">{tower.id === 'analyst' ? 'PASSIVE SUPPORT' : 'SPECIAL ABILITIES'}</span>{tower.abilities.map(ability => <p key={ability}>{ability}</p>)}</div>}
    {tower.stats && <div className="codex-coverage"><svg viewBox="0 0 80 42" aria-hidden="true"><path d="m8 22 31-16 33 16-31 16Z" fill="#82939c" opacity=".14"/><ellipse cx="40" cy="22" rx={10 + tower.stats.range * 2} ry={4 + tower.stats.range * .7} fill="none" stroke="#8abfbd" strokeWidth="1.5" strokeDasharray="3 3"/><path d="m40 14 7 4v8l-7 4-7-4v-8Z" fill="#aaa5ed"/><path d="m33 18 7 4 7-4M40 22v8" fill="none" stroke="#293951"/></svg><span>{tower.id === 'analyst' ? 'Support coverage' : tower.id === 'linter' ? 'Radial coverage' : 'Coverage preview'}<small>Terrain can shape coverage.</small></span></div>}
  </section>;
}

export function TowerShowcase({ selectedTower, onSelectTower, reducedMotion }: Omit<TowerShowcaseDialogProps, 'open' | 'onClose'>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const scene = useRef<TowerShowcaseScene | null>(null);
  const selection = useRef(selectedTower);
  selection.current = selectedTower;
  const motion = useRef(reducedMotion);
  motion.current = reducedMotion;
  const [status, setStatus] = useState<ShowcaseStatus>({ phase: 'loading', animations: [] });
  const [animation, setAnimation] = useState<AnimationChoice>(reducedMotion ? 'rest' : 'idle');
  const [portraits, setPortraits] = useState({ ...portraitCache });
  const [attempt, setAttempt] = useState(0);
  const rosterElement = useRef<HTMLDivElement>(null);
  const tower = getTower(selectedTower);
  const [collection, setCollection] = useState<'core' | 'development'>(tower.collection);
  const roster = TOWERS.filter(item => item.collection === collection);
  const hasDevelopment = TOWERS.some(item => item.collection === 'development');

  useEffect(() => {
    if (!canvas.current || !viewport.current) return;
    const target = canvas.current, region = viewport.current;
    let disposed = false;
    let preview: TowerShowcaseScene | undefined;
    setStatus({ phase: 'loading', animations: [] });
    const deadline = window.setTimeout(() => {
      disposed = true;
      observer.disconnect();
      preview?.dispose();
      if (scene.current === preview) scene.current = null;
      setStatus({ phase: 'error', animations: [], message: 'The preview took too long to open. Please retry.' });
    }, 20_000);
    const observer = new ResizeObserver(() => preview?.resize());
    observer.observe(target); observer.observe(region);
    void import('../../rendering/showcase/createTowerShowcaseScene').then(module => disposed ? undefined : module.createTowerShowcaseScene(target, {
      viewport: region, reducedMotion: motion.current,
      onStatus: value => { if (!disposed) setStatus(value); },
      onAnimationChange: value => { if (!disposed) setAnimation(value); },
      // Delivered portraits avoid GPU readback and PNG encoding during normal browsing.
      ...(TOWERS.some(item => item.modelId && !portraitCache[item.id]) ? {
        onPortrait: (id: string, url: string) => { if (!disposed) { portraitCache[id] = url; setPortraits(value => ({ ...value, [id]: url })); } },
      } : {}),
    })).then(value => {
      if (!value) return;
      if (disposed) { value.dispose(); return; }
      window.clearTimeout(deadline);
      preview = value; scene.current = value; value.setReducedMotion(motion.current); value.setTower(selection.current);
    }).catch(() => { window.clearTimeout(deadline); if (!disposed) setStatus({ phase: 'error', animations: [], message: 'The model preview couldn’t open. You can still browse the collection.' }); });
    return () => { disposed = true; window.clearTimeout(deadline); observer.disconnect(); preview?.dispose(); if (scene.current === preview) scene.current = null; };
  }, [attempt]);
  useEffect(() => { scene.current?.setTower(selectedTower); }, [selectedTower]);
  useEffect(() => { scene.current?.setReducedMotion(reducedMotion); }, [reducedMotion]);
  useEffect(() => {
    rosterElement.current?.querySelector<HTMLButtonElement>(`[data-tower="${selectedTower}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, [selectedTower, collection]);

  function choose(id: string) {
    if (id === selectedTower) return;
    onSelectTower(id);
  }
  function step(direction: number) {
    const index = roster.findIndex(item => item.id === selectedTower);
    const next = roster[(index + direction + roster.length) % roster.length];
    if (next) choose(next.id);
  }
  function onPortraitKey(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = roster.findIndex(item => item.id === id);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? roster.length - 1 : (index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + roster.length) % roster.length;
    const next = roster[nextIndex];
    if (next) { choose(next.id); event.currentTarget.closest('.codex-roster')?.querySelector<HTMLButtonElement>(`[data-tower="${next.id}"]`)?.focus(); }
  }
  function previewKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const angles: Record<string, [number, number]> = { ArrowLeft: [-.15, 0], ArrowRight: [.15, 0], ArrowUp: [0, .1], ArrowDown: [0, -.1] };
    const angle = angles[event.key];
    if (angle) { event.preventDefault(); scene.current?.orbit(...angle); }
    else if (event.key === '+' || event.key === '=') { event.preventDefault(); scene.current?.zoomBy(1.12); }
    else if (event.key === '-') { event.preventDefault(); scene.current?.zoomBy(1 / 1.12); }
    else if (event.key.toLowerCase() === 'r') { event.preventDefault(); scene.current?.resetView(); }
  }
  return <div className="codex-workbench" data-testid="tower-showcase" data-state={status.phase} data-animation={animation}>
    <canvas ref={canvas} key={attempt} className="codex-scene" aria-hidden="true" />
    <div className="codex-room-shade" aria-hidden="true" />
    <div className="codex-workspace">
      <section className="codex-console codex-collection" aria-labelledby="codex-collection-title">
        <div className="codex-console-heading"><h2 id="codex-collection-title">Towers</h2><PackageIcon size={17} /></div>
        {hasDevelopment && <div className="codex-collections" role="group" aria-label="Tower collection"><button type="button" aria-pressed={collection === 'core'} onClick={() => { setCollection('core'); if (tower.collection !== 'core') choose('developer'); }}>Personas</button><button type="button" aria-pressed={collection === 'development'} onClick={() => { setCollection('development'); const first = TOWERS.find(item => item.collection === 'development'); if (first && tower.collection !== 'development') choose(first.id); }}>In development</button></div>}
        <div ref={rosterElement} className="codex-roster" role="group" aria-label="Choose a Tower">{roster.map(item => <button key={item.id} type="button" className="codex-portrait" data-tower={item.id} data-preview={item.modelId ? 'available' : 'coming-soon'} tabIndex={item.id === tower.id ? 0 : -1} aria-pressed={item.id === tower.id} aria-label={item.title} aria-describedby={!item.modelId ? 'codex-missing-model-hint' : undefined} onClick={() => choose(item.id)} onKeyDown={event => onPortraitKey(event, item.id)}>
          <Portrait tower={item} source={portraits[item.id]} /><span className="codex-portrait-name">{item.title === 'Base Copilot' ? 'Base' : item.title === 'Linter Agent' ? 'Linter' : item.title}</span>{!item.modelId && <span className="codex-portrait-status">Preview soon</span>}{item.id === tower.id && <span className="codex-selected-mark"><CheckIcon size={13} /></span>}
        </button>)}</div>
        <span id="codex-missing-model-hint" className="codex-sr-only">Model preview coming soon. Role and stats are available.</span>
        <div className="codex-collection-foot"><span>Browse your specialists</span><button type="button" className="codex-mini-key" aria-label="Previous Tower" onClick={() => step(-1)}><ChevronLeftIcon /></button><button type="button" className="codex-mini-key" aria-label="Next Tower" onClick={() => step(1)}><ChevronRightIcon /></button></div>
      </section>

      <div className="codex-model-heading" aria-live="polite"><span className="codex-eyebrow">{tower.collection === 'development' ? 'IN DEVELOPMENT' : tower.id === 'base' ? 'BASE COPILOT' : 'COPILOT PERSONA'}</span><h2>{tower.title}</h2><p>{tower.role}</p><span className="codex-availability">{tower.availability || '\u00a0'}</span></div>
      <div ref={viewport} className="codex-model-viewport" role="group" aria-label={`${tower.title} model preview`} tabIndex={status.phase === 'ready' ? 0 : -1} onKeyDown={previewKey} aria-describedby="codex-preview-instructions">
        {(status.phase === 'loading' || status.phase === 'missing' || status.phase === 'error') && <div className="codex-preview-message" role="status">
          {status.phase === 'loading' ? <><span className="codex-loader" aria-hidden="true" /><p>Bringing {tower.title} into view…</p></> : status.phase === 'missing' ? <><Portrait tower={tower} source={undefined} /><h3>Model preview coming soon</h3><p>Explore this Tower’s role and capabilities.</p></> : <><PackageIcon size={36} /><h3>Preview unavailable</h3><p>{status.message}</p><button type="button" className="codex-key" onClick={() => setAttempt(value => value + 1)}>Retry preview</button><button type="button" className="codex-key" onClick={() => window.location.reload()}>Reload app</button></>}
        </div>}
        <span className="codex-switch-status" role="status">{status.phase === 'resolving' ? 'Switching Tower…' : status.phase === 'placing' ? 'Arriving at the workbench…' : ''}</span>
      </div>
      <div className="codex-model-tools">
        <p id="codex-preview-instructions"><span className="codex-pointer-hint">Drag to rotate & tilt · Scroll to zoom</span><span className="codex-touch-hint">Drag to rotate & tilt · Pinch to zoom</span><span className="codex-sr-only">. Keyboard arrows rotate and tilt; plus and minus zoom; R resets.</span></p>
      </div>

      <TowerStats key={tower.id} tower={tower} />
    </div>
  </div>;
}

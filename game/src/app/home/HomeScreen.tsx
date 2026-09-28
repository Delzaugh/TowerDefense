import { useEffect, useRef, useState } from 'react';
import { createHomeBoot } from '../boot/createHomeBoot';
import type { HomeBoot } from '../boot/createHomeBoot';
import { readHomePreferences, saveHomePreferences } from '../../persistence/homePreferences';
import type { HomePreferences } from '../../persistence/homePreferences';
import type { CampusViewState } from '../../rendering/campus/types';
import type { HomeStatus } from './homeTypes';
import { HomeView } from './HomeView';
import { TowerShowcaseDialog, preloadTowerShowcase } from '../showcase/TowerShowcaseDialog';

export function HomeScreen() {
  const [canvasKey, setCanvasKey] = useState(0);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [stored, setStored] = useState(() => readHomePreferences(() => window.localStorage));
  const [systemReducedMotion, setSystemReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [status, setStatus] = useState<HomeStatus>({ phase: 'loading', loaded: 0, total: 0, message: 'Opening the campus…' });
  const [view, setView] = useState<CampusViewState>({ view: 'home', zoom: 1 });
  const [browserOpen, setBrowserOpen] = useState(false);
  const [browserEntering, setBrowserEntering] = useState(false);
  const [browserReturning, setBrowserReturning] = useState(false);
  const [selectedTower, setSelectedTower] = useState('developer');
  const [hidden, setHidden] = useState(document.hidden);
  const [hoveredBuildingPoint, setHoveredBuildingPoint] = useState<{ x: number; y: number } | null>(null);
  const boot = useRef<HomeBoot | null>(null);
  const transitionPhase = useRef<'idle' | 'entering' | 'open' | 'returning'>('idle');
  const transitionToken = useRef(0);
  const inspectButton = useRef<HTMLButtonElement>(null);
  const settings = useRef({ paused: !stored.preferences.ambience || hidden || browserOpen || browserEntering || browserReturning,
    reducedMotion: stored.preferences.reducedMotion || systemReducedMotion, interactionEnabled: !hidden && !browserOpen && !browserEntering && !browserReturning });
  settings.current = { paused: !stored.preferences.ambience || hidden || browserOpen || browserEntering || browserReturning,
    reducedMotion: stored.preferences.reducedMotion || systemReducedMotion, interactionEnabled: !hidden && !browserOpen && !browserEntering && !browserReturning };
  const cancelEntry = () => {
    if (transitionPhase.current !== 'entering') return;
    transitionToken.current++;
    transitionPhase.current = 'idle';
    boot.current?.restoreBuildingReveal();
    setBrowserEntering(false);
  };
  const finishReturn = (focus = true) => {
    if (transitionPhase.current !== 'returning') return;
    transitionToken.current++;
    boot.current?.restoreBuildingReveal();
    transitionPhase.current = 'idle';
    setBrowserReturning(false);
    if (focus && !document.hidden) requestAnimationFrame(() => inspectButton.current?.focus());
  };
  const openBrowser = () => {
    if (transitionPhase.current !== 'idle' || document.hidden) return;
    transitionPhase.current = 'entering';
    const token = ++transitionToken.current;
    preloadTowerShowcase();
    setHoveredBuildingPoint(null);
    boot.current?.setSettings({ ...settings.current, paused: true, interactionEnabled: false });
    if (settings.current.reducedMotion) {
      transitionPhase.current = 'open';
      setBrowserOpen(true);
      return;
    }
    setBrowserEntering(true);
    void (boot.current?.playBuildingReveal() ?? Promise.resolve(true)).then(completed => {
      if (token !== transitionToken.current || transitionPhase.current !== 'entering') return;
      if (!completed || document.hidden) { cancelEntry(); return; }
      transitionPhase.current = 'open';
      setBrowserEntering(false);
      setBrowserOpen(true);
    });
  };
  const closeBrowser = () => {
    if (transitionPhase.current !== 'open') return;
    if (settings.current.reducedMotion) {
      boot.current?.restoreBuildingReveal();
      transitionPhase.current = 'idle';
      setBrowserOpen(false);
      requestAnimationFrame(() => inspectButton.current?.focus());
      return;
    }
    transitionPhase.current = 'returning';
    const token = ++transitionToken.current;
    setBrowserOpen(false);
    setBrowserReturning(true);
    void (boot.current?.playBuildingReturn() ?? Promise.resolve(true)).then(() => {
      if (token === transitionToken.current && transitionPhase.current === 'returning') finishReturn();
    });
  };

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const changed = () => setSystemReducedMotion(media.matches);
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);

  useEffect(() => {
    if (!canvas) return;
    const next = createHomeBoot(canvas, {
      settings: settings.current,
      loadFactory: async () => (await import('../../rendering/campus/createCampusScene')).createCampusScene,
      onViewChange: setView,
      onBuildingActivate: building => { if (building === 'copilot-lab') openBrowser(); },
      onBuildingHover: (building, point) => setHoveredBuildingPoint(building === 'copilot-lab' && point ? point : null),
    });
    boot.current = next;
    const unsubscribe = next.subscribe(() => setStatus(next.getSnapshot()));
    const observer = new ResizeObserver(() => next.resize());
    observer.observe(canvas);
    const visibility = () => {
      if (document.hidden) {
        cancelEntry();
        finishReturn(false);
        next.setSettings({ ...settings.current, paused: true, interactionEnabled: false });
        setHoveredBuildingPoint(null);
      }
      setHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', visibility);
    void next.start();
    return () => {
      unsubscribe(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility);
      transitionToken.current++;
      next.restoreBuildingReveal();
      next.dispose(); if (boot.current === next) boot.current = null;
    };
  }, [canvas]);

  useEffect(() => { boot.current?.setSettings(settings.current); }, [stored.preferences, systemReducedMotion, browserOpen, browserEntering, browserReturning, hidden]);
  useEffect(() => {
    if (!browserEntering && !browserReturning) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (browserReturning) finishReturn();
      else { cancelEntry(); requestAnimationFrame(() => inspectButton.current?.focus()); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [browserEntering, browserReturning]);
  useEffect(() => { if (status.phase !== 'ready') setHoveredBuildingPoint(null); }, [status.phase]);
  const preferencesChanged = (preferences: HomePreferences) => {
    const notice = saveHomePreferences(() => window.localStorage, preferences);
    setStored({ preferences, notice });
  };
  return <><HomeView canvasKey={canvasKey} canvasRef={setCanvas} status={status} view={view} preferences={stored.preferences}
    systemReducedMotion={systemReducedMotion} preferenceNotice={stored.notice}
    onRetry={() => {
      cancelEntry();
      if (status.reloadRequired) { window.location.reload(); return; }
      boot.current?.dispose(); setCanvasKey(value => value + 1);
    }} onFallback={() => { cancelEntry(); boot.current?.fallback(); }}
    onView={value => boot.current?.selectView(value)} onZoom={factor => boot.current?.zoomBy(factor)}
    onReset={() => boot.current?.resetView()} onPreferences={preferencesChanged}
    browserOpen={browserOpen} browserEntering={browserEntering} browserReturning={browserReturning}
    inspectButtonRef={inspectButton} onInspectTowers={openBrowser}
    onInspectFocus={focused => boot.current?.setBuildingFocus(focused ? 'copilot-lab' : null)}
    hoveredBuildingPoint={hoveredBuildingPoint} />
    <TowerShowcaseDialog open={browserOpen} onClose={closeBrowser}
      reducedMotion={settings.current.reducedMotion} selectedTower={selectedTower} onSelectTower={setSelectedTower} /></>;
}

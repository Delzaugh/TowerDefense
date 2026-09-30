import { useRef, useSyncExternalStore } from 'react';
import { ArrowUpRightIcon, GearIcon, HomeIcon, NorthStarIcon, PauseIcon, PlayIcon, PlusIcon, DashIcon, XIcon } from '@primer/octicons-react';
import { Button, GameTopBar, IconButton, Surface, SegmentedControl, StatusBadge, ThemePicker } from '../../ui/toolkit';
import type { CampusView } from '../../rendering/campus/types';
import type { HomeViewProps } from './homeTypes';
import { STORY_DURATION } from '../../content/story/octocatAbduction';
import { getTrackingEnabled, getTrackingNotice, setTrackingEnabled, subscribeTracking } from '../../diagnostics/performance';
import './home.css';
import '../performance/performance.css';

const cameraViews = [
  { value: 'home', label: 'Home', icon: <HomeIcon size={16} /> },
  { value: 'top', label: 'Top', icon: <NorthStarIcon size={16} /> },
] as const;

export function HomeView({
  canvasKey, canvasRef, status, view, preferences, systemReducedMotion, preferenceNotice,
  onRetry, onFallback, onView, onZoom, onReset, onPreferences, browserOpen, browserEntering,
  browserReturning, inspectButtonRef, onInspectTowers, onInspectFocus, hoveredBuildingPoint, onPlayStory,
}: HomeViewProps) {
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const performanceTracking = useSyncExternalStore(subscribeTracking, getTrackingEnabled);
  const trackingNotice = getTrackingNotice();
  const ready = status.phase === 'ready';
  const motionReduced = preferences.reducedMotion || systemReducedMotion;
  const progressMax = Math.max(1, status.total);
  const progressValue = Math.min(progressMax, Math.max(0, status.loaded));
  const openSettings = () => settingsDialog.current?.showModal();
  const closeSettings = () => settingsDialog.current?.close();

  return (
    <div className="home-screen" data-testid="home-screen" data-state={status.phase} data-browser-open={browserOpen}
      data-browser-entering={browserEntering} data-browser-returning={browserReturning} inert={browserEntering || browserReturning}>
      <GameTopBar className="home-header" presentation="world" location="Copilot Hub"
        leading={<div className="home-brand" aria-label="Copilot Tower Defense">
          <span className="home-brand-wordmark">COPILOT<small>TOWER DEFENSE</small></span>
        </div>}
        trailing={<>
          <IconButton type="button" aria-label={preferences.ambience ? 'Pause ambience' : 'Resume ambience'}
            title={preferences.ambience ? 'Pause ambience' : 'Resume ambience'} aria-pressed={preferences.ambience} disabled={!ready}
            onClick={() => onPreferences({ ...preferences, ambience: !preferences.ambience })}>
            {preferences.ambience ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          </IconButton>
          <IconButton ref={settingsButton} type="button" aria-label="Settings" title="Settings" onClick={openSettings} aria-haspopup="dialog">
            <GearIcon size={18} />
          </IconButton>
        </>} />

      <main className="home-main">
        <div className="home-stage">
          <canvas key={canvasKey} ref={canvasRef} data-testid="campus-canvas" role="img"
            aria-label="Interactive 3D campus with the Copilot Lab and Copilot" className="home-canvas" />
          <div className="home-stage-vignette" aria-hidden="true" />
          {ready && hoveredBuildingPoint && !browserOpen && !browserEntering && !browserReturning && (
            <Surface className="home-building-hint" style={{ left: hoveredBuildingPoint.x, top: hoveredBuildingPoint.y }} aria-hidden="true">
              Inspect Towers
            </Surface>
          )}
          <SegmentedControl className="home-camera" label="Camera angle" value={view.view} disabled={!ready}
            options={cameraViews} onChange={value => onView(value as CampusView)} />
          <Surface className="home-zoom" role="group" aria-label="Campus zoom controls">
            <IconButton type="button" aria-label="Zoom out" title="Zoom out" disabled={!ready} onClick={() => onZoom(1 / 1.2)}><DashIcon size={16} /></IconButton>
            <Button type="button" variant="quiet" className="home-zoom-reset" aria-label="Reset view" title="Reset view and zoom" disabled={!ready} onClick={onReset}>{Math.round(view.zoom * 100)}%</Button>
            <IconButton type="button" aria-label="Zoom in" title="Zoom in" disabled={!ready} onClick={() => onZoom(1.2)}><PlusIcon size={16} /></IconButton>
          </Surface>

          {status.phase === 'loading' && (
            <Surface className="home-status-panel home-loading" role="status" aria-live="polite">
              <span className="home-eyebrow">OPENING THE CAMPUS</span>
              <h2>A place to begin.</h2>
              <p>{status.message || 'Preparing the campus…'}</p>
              <progress aria-label="Campus loading progress"
                aria-valuetext={status.total > 0 ? `${status.loaded} of ${status.total} assets loaded` : 'Preparing campus assets'}
                max={progressMax} value={progressValue} />
              <span className="home-progress-count">{status.total > 0 ? `${status.loaded} / ${status.total} assets` : 'Preparing assets'}</span>
            </Surface>
          )}
          {status.phase === 'error' && (
            <Surface className="home-status-panel home-recovery" role="alert">
              <StatusBadge tone="attention">Campus unavailable</StatusBadge>
              <h2>The campus could not open</h2>
              <p>{status.message || 'The 3D campus could not load on this device right now.'}</p>
              <p>You can try again or use the rest of the home screen without the 3D view.</p>
              <div className="home-recovery-actions">
                <Button type="button" variant="primary" onClick={onRetry}>{status.reloadRequired ? 'Reload app' : 'Retry'}</Button>
                <Button type="button" onClick={onFallback}>Continue without 3D</Button>
              </div>
            </Surface>
          )}
          {status.phase === 'fallback' && (
            <Surface className="home-status-panel home-recovery" role="status">
              <span className="home-eyebrow">EXPLORE AT YOUR OWN PACE</span>
              <h2>Campus view unavailable</h2>
              <p>The 3D campus is turned off. Your settings and information about the Copilot Lab are still here.</p>
              <Button type="button" onClick={onRetry}>Retry 3D campus</Button>
            </Surface>
          )}
        </div>

        <div className="home-content">
          <Surface className="home-lab-card" role="complementary" aria-labelledby="home-lab-title">
            <div className="home-card-heading"><span className="home-eyebrow">COPILOT HUB</span><StatusBadge tone="positive">Copilot Lab</StatusBadge></div>
            <h2 id="home-lab-title">Meet your Copilots.</h2>
            <p className="home-card-description">Explore the Personas and their capabilities in the Lab.</p>
            <Button ref={inspectButtonRef} type="button" variant="primary" className="home-inspect-button" onClick={onInspectTowers}
              onFocus={() => onInspectFocus(true)} onBlur={() => onInspectFocus(false)} aria-haspopup="dialog">
              Inspect Towers <ArrowUpRightIcon size={16} />
            </Button>
            {onPlayStory && <Button type="button" className="home-story-button" onClick={onPlayStory}
              disabled={browserOpen || browserEntering || browserReturning} aria-haspopup="dialog">
              <PlayIcon size={16} /> Play story scene <span>{STORY_DURATION} sec</span>
            </Button>}
            <p className="home-card-foot">
              {motionReduced ? 'Motion is reduced by your settings.' : ready ? (preferences.ambience ? 'Your Copilot is enjoying the campus.' : 'Campus ambience is paused.') : 'The lab is here when you are ready.'}
            </p>
            {preferenceNotice && <p className="home-preference-notice" role="status">{preferenceNotice}</p>}
          </Surface>
        </div>
      </main>

      {(browserReturning || (!motionReduced && (browserEntering || browserOpen))) &&
        <div className={browserReturning ? 'home-reveal home-reveal-return' : 'home-reveal'} aria-hidden="true">
          <span className="home-reveal-ring" /><span className="home-reveal-label">{browserReturning ? 'BACK TO HUB' : 'ENTERING THE LAB'}</span>
        </div>}

      <dialog ref={settingsDialog} className="home-settings-dialog" aria-labelledby="home-settings-title" onClose={() => settingsButton.current?.focus()}>
        <div className="home-dialog-head">
          <div><span className="home-eyebrow">MAKE THE CAMPUS YOURS</span><h2 id="home-settings-title">Campus settings</h2></div>
          <IconButton type="button" aria-label="Close settings" onClick={closeSettings}><XIcon size={18} /></IconButton>
        </div>
        <div className="home-dialog-body">
          <div className="home-theme-setting"><ThemePicker /></div>
          <label className="home-setting-row">
            <span><strong>Campus ambience</strong><small>Let Copilot and the campus move while this page is open.</small></span>
            <input type="checkbox" checked={preferences.ambience} onChange={event => onPreferences({ ...preferences, ambience: event.currentTarget.checked })} />
          </label>
          <label className="home-setting-row">
            <span><strong>Reduce motion</strong><small>Keep the campus still and camera changes immediate.</small></span>
            <input type="checkbox" checked={preferences.reducedMotion} onChange={event => onPreferences({ ...preferences, reducedMotion: event.currentTarget.checked })} />
          </label>
          {systemReducedMotion && <p className="home-system-motion-note">Your device requests reduced motion. The campus stays still while that setting is on, even if you allow motion here.</p>}
          {preferenceNotice && <p className="home-dialog-notice" role="status">{preferenceNotice}</p>}
          <label className="home-setting-row">
            <span><strong>Performance tracking</strong><small>Show performance measurements and record reports for testing.</small></span>
            <input type="checkbox" checked={performanceTracking} onChange={event => setTrackingEnabled(event.currentTarget.checked)} />
          </label>
          {trackingNotice && <p className="home-dialog-notice" role="status">{trackingNotice}</p>}
          {__STRESS_MAP_ENABLED__ && <div className="home-performance-test">
            <a href="#/stress" className="ui-button" onClick={closeSettings}>Open stress test map <ArrowUpRightIcon size={16} /></a>
            <p>A small test arena with repeatable load levels.</p>
          </div>}
          <div className="home-about">
            <span className="home-eyebrow">ABOUT THE CAMPUS</span>
            <h3>Welcome to Copilot Hub.</h3>
            <p>The Copilot Lab is the first gathering place on a growing campus. Camera controls let you look around; the first mission is still in development.</p>
          </div>
        </div>
        <div className="home-dialog-foot"><Button type="button" variant="primary" onClick={closeSettings}>Done</Button></div>
      </dialog>
    </div>
  );
}

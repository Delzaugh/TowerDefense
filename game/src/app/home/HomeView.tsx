import { useRef } from 'react';
import type { CampusView } from '../../rendering/campus/types';
import type { HomeViewProps } from './homeTypes';
import './home.css';

const cameraViews: ReadonlyArray<{ id: CampusView; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'top', label: 'Top' },
];

function BrandMark() {
  return (
    <svg className="home-brand-mark" viewBox="0 0 46 48" fill="none" aria-hidden="true">
      <path d="m23 2 19 11v22L23 46 4 35V13Z" fill="#223e5a" />
      <path d="m23 6 15 9v18l-15 9-15-9V15Z" stroke="#88b8c9" strokeWidth="1.5" />
      <path d="M14 17h18v15H14Z" fill="#c9e6ec" />
      <path d="M18 22v4m10-4v4" stroke="#274d72" strokeWidth="2" />
      <path d="M23 17v-5m-3 0h6M10 22v6m26-6v6" stroke="#9ac2da" strokeWidth="2" />
    </svg>
  );
}

function ArrowIcon({ paused }: { paused: boolean }) {
  return paused ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
  );
}

export function HomeView({
  canvasKey,
  canvasRef,
  status,
  view,
  preferences,
  systemReducedMotion,
  preferenceNotice,
  onRetry,
  onFallback,
  onView,
  onZoom,
  onReset,
  onPreferences,
  browserOpen,
  browserEntering,
  browserReturning,
  inspectButtonRef,
  onInspectTowers,
  onInspectFocus,
  hoveredBuildingPoint,
}: HomeViewProps) {
  const settingsDialog = useRef<HTMLDialogElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const ready = status.phase === 'ready';
  const motionReduced = preferences.reducedMotion || systemReducedMotion;
  const progressMax = Math.max(1, status.total);
  const progressValue = Math.min(progressMax, Math.max(0, status.loaded));

  function openSettings() {
    settingsDialog.current?.showModal();
  }

  function closeSettings() {
    settingsDialog.current?.close();
  }

  return (
    <div className="home-screen" data-testid="home-screen" data-state={status.phase} data-browser-open={browserOpen}
      data-browser-entering={browserEntering} data-browser-returning={browserReturning} inert={browserEntering || browserReturning}>
      <header className="home-header">
        <div className="home-brand" aria-label="Copilot Tower Defense">
          <BrandMark />
          <span className="home-brand-wordmark">COPILOT<small>TOWER DEFENSE</small></span>
        </div>
        <div className="home-header-actions">
          <span className="home-location"><span aria-hidden="true" />COPILOT HUB</span>
          <button ref={settingsButton} className="home-settings-trigger" type="button" onClick={openSettings} aria-haspopup="dialog">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 17h16M8 4v6m8 4v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            Settings
          </button>
        </div>
      </header>

      <main className="home-main">
        <div className="home-stage">
          <canvas
            key={canvasKey}
            ref={canvasRef}
            data-testid="campus-canvas"
            role="img"
            aria-label="Interactive 3D campus with the Copilot Lab and Copilot"
            className="home-canvas"
          />

          <div className="home-stage-vignette" aria-hidden="true" />
          {ready && hoveredBuildingPoint && !browserOpen && !browserEntering && !browserReturning && (
            <div className="home-building-hint" style={{ left: hoveredBuildingPoint.x, top: hoveredBuildingPoint.y }} aria-hidden="true">
              Inspect Towers
            </div>
          )}

          <div className="home-camera" role="group" aria-label="Camera angle">
            {cameraViews.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={view.view === id} disabled={!ready} onClick={() => onView(id)}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={id === 'home' ? 'm12 3 9 5v8l-9 5-9-5V8l9-5Zm0 10v8M3 8l9 5 9-5' : 'M4 4h16v16H4V4Zm8 0v16M4 12h16'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                {label}
              </button>
            ))}
          </div>

          <div className="home-zoom" role="group" aria-label="Campus zoom controls">
            <button type="button" aria-label="Zoom out" title="Zoom out" disabled={!ready} onClick={() => onZoom(1 / 1.2)}>−</button>
            <button type="button" className="home-zoom-reset" aria-label="Reset view" title="Reset view and zoom" disabled={!ready} onClick={onReset}>{Math.round(view.zoom * 100)}%</button>
            <button type="button" aria-label="Zoom in" title="Zoom in" disabled={!ready} onClick={() => onZoom(1.2)}>+</button>
          </div>

          {status.phase === 'loading' && (
            <div className="home-status-panel home-loading" role="status" aria-live="polite">
              <span className="home-status-kicker">OPENING THE CAMPUS</span>
              <h2>A place to begin.</h2>
              <p>{status.message || 'Preparing the campus…'}</p>
              <progress
                aria-label="Campus loading progress"
                aria-valuetext={status.total > 0 ? `${status.loaded} of ${status.total} assets loaded` : 'Preparing campus assets'}
                max={progressMax}
                value={progressValue}
              />
              <span className="home-progress-count">{status.total > 0 ? `${status.loaded} / ${status.total} assets` : 'Preparing assets'}</span>
            </div>
          )}

          {status.phase === 'error' && (
            <div className="home-status-panel home-recovery" role="alert">
              <span className="home-status-kicker">CAMPUS UNAVAILABLE</span>
              <h2>The campus could not open</h2>
              <p>{status.message || 'The 3D campus could not load on this device right now.'}</p>
              <p>You can try again or use the rest of the home screen without the 3D view.</p>
              <div className="home-recovery-actions">
                <button type="button" className="home-primary-button" onClick={onRetry}>{status.reloadRequired ? 'Reload app' : 'Retry'}</button>
                <button type="button" className="home-secondary-button" onClick={onFallback}>Continue without 3D</button>
              </div>
            </div>
          )}

          {status.phase === 'fallback' && (
            <div className="home-status-panel home-recovery" role="status">
              <span className="home-status-kicker">EXPLORE AT YOUR OWN PACE</span>
              <h2>Campus view unavailable</h2>
              <p>The 3D campus is turned off. Your settings and information about the Copilot Lab are still here.</p>
              <button type="button" className="home-primary-button" onClick={onRetry}>Retry 3D campus</button>
            </div>
          )}
        </div>

        <div className="home-content">
          <aside className="home-lab-card" aria-labelledby="home-lab-title">
            <div className="home-card-heading">
              <span><i aria-hidden="true" />COPILOT LAB</span>
              <span>COPILOT HUB</span>
            </div>
            <div className="home-card-body">
              <div>
                <h2 id="home-lab-title">Space to make progress.</h2>
                <p>A coffee break, a conversation, a little breeze.</p>
              </div>
              <button
                type="button"
                className="home-ambience-button"
                aria-label={preferences.ambience ? 'Pause ambience' : 'Resume ambience'}
                aria-pressed={preferences.ambience}
                disabled={!ready}
                onClick={() => onPreferences({ ...preferences, ambience: !preferences.ambience })}
              >
                <ArrowIcon paused={!preferences.ambience || motionReduced} />
                <strong>{preferences.ambience ? 'PAUSE AMBIENCE' : 'RESUME AMBIENCE'}</strong>
                <small>CAMPUS LIFE</small>
              </button>
            </div>
            <div className="home-card-foot">
              {motionReduced ? 'Motion is reduced by your settings.' : ready ? (preferences.ambience ? 'Your Copilot is enjoying the campus.' : 'Campus ambience is paused.') : 'The lab is here when you are ready.'}
            </div>
            <div className="home-card-action">
              <button ref={inspectButtonRef} type="button" className="home-inspect-button" onClick={onInspectTowers}
                onFocus={() => onInspectFocus(true)} onBlur={() => onInspectFocus(false)} aria-haspopup="dialog">
                Inspect Towers <span aria-hidden="true">↗</span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      {preferenceNotice && <p className="home-preference-notice" role="status">{preferenceNotice}</p>}

      {(browserReturning || (!motionReduced && (browserEntering || browserOpen))) &&
        <div className={browserReturning ? 'home-reveal home-reveal-return' : 'home-reveal'} aria-hidden="true">
          <span className="home-reveal-ring" /><span className="home-reveal-label">{browserReturning ? 'BACK TO HUB' : 'ENTERING THE LAB'}</span>
        </div>}

      <dialog ref={settingsDialog} className="home-settings-dialog" aria-labelledby="home-settings-title" onClose={() => settingsButton.current?.focus()}>
        <div className="home-dialog-head">
          <div><span className="home-eyebrow">MAKE THE CAMPUS YOURS</span><h2 id="home-settings-title">Campus settings</h2></div>
          <button type="button" className="home-dialog-close" aria-label="Close settings" onClick={closeSettings}>×</button>
        </div>
        <div className="home-dialog-body">
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
          <div className="home-about">
            <span className="home-eyebrow">ABOUT THE CAMPUS</span>
            <h3>Welcome to Copilot Hub.</h3>
            <p>The Copilot Lab is the first gathering place on a growing campus. Camera controls let you look around; the first mission is still in development.</p>
          </div>
        </div>
        <div className="home-dialog-foot"><button type="button" className="home-primary-button" onClick={closeSettings}>Done</button></div>
      </dialog>
    </div>
  );
}

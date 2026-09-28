import { Component, Suspense, lazy, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { TowerShowcaseDialogProps } from './types';
import './showcase.css';
import { withDeadline } from '../boot/withDeadline';

const loadShowcase = async () => ({ default: (await import('./TowerShowcase')).TowerShowcase });
const TowerShowcase = lazy(() => withDeadline(loadShowcase()));

/** Warm the lazy screen during the building approach, without delaying entry. */
export function preloadTowerShowcase() {
  void loadShowcase().catch(() => undefined);
  void import('../../rendering/showcase/createTowerShowcaseScene').catch(() => undefined);
}

class ShowcaseBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div className="codex-opening" role="alert"><span className="codex-eyebrow">COPILOT LAB</span><h2>The workbench couldn’t open.</h2><p>Reload the app to download the workbench again.</p><button type="button" className="codex-key" onClick={() => window.location.reload()}>Reload app</button></div> : this.props.children;
  }
}

/** A small, immediately available modal shell; the renderer and catalog stay lazy. */
export function TowerShowcaseDialog({ open, onClose, ...props }: TowerShowcaseDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (open) { dialog.current?.showModal(); back.current?.focus(); }
    else dialog.current?.close();
  }, [open]);
  return <dialog ref={dialog} className="codex-dialog" aria-label="Tower Codex" data-reduced-motion={props.reducedMotion}
    onCancel={event => { event.preventDefault(); onClose(); }} onClose={() => { if (open) onClose(); }}>
    {open && <>
      <header className="codex-header">
        <button ref={back} type="button" className="codex-key codex-back" onClick={onClose}><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 1 1 1.06 1.06L4.81 7H13a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"/></svg>Back to Hub<kbd aria-hidden="true">Esc</kbd></button>
      </header>
      <ShowcaseBoundary><Suspense fallback={<div className="codex-opening" role="status"><span className="codex-eyebrow">COPILOT LAB</span><h2>Opening the workbench…</h2><p>Bringing your Towers into view.</p></div>}><TowerShowcase {...props} /></Suspense></ShowcaseBoundary>
    </>}
  </dialog>;
}

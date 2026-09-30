import { Component, Suspense, lazy, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { TowerShowcaseDialogProps } from './types';
import './showcase.css';
import { withDeadline } from '../boot/withDeadline';
import { ArrowLeftIcon } from '@primer/octicons-react';
import { Button, ThemePicker } from '../../ui/toolkit';

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
    return this.state.failed ? <div className="codex-opening" role="alert"><span className="codex-eyebrow">COPILOT LAB</span><h2>The workbench couldn’t open.</h2><p>Reload the app to download the workbench again.</p><Button onClick={() => window.location.reload()}>Reload app</Button></div> : this.props.children;
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
        <Button ref={back} variant="quiet" className="codex-back" onClick={onClose}><ArrowLeftIcon size={16} />Back to Hub<kbd aria-hidden="true">Esc</kbd></Button>
        <div className="codex-location"><strong>Copilot Lab</strong><span>Tower inspection</span></div>
        <ThemePicker className="codex-theme" />
      </header>
      <ShowcaseBoundary><Suspense fallback={<div className="codex-opening" role="status"><span className="codex-eyebrow">COPILOT LAB</span><h2>Opening the workbench…</h2><p>Bringing your Towers into view.</p></div>}><TowerShowcase {...props} /></Suspense></ShowcaseBoundary>
    </>}
  </dialog>;
}

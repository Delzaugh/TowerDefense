import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MuteIcon, UnmuteIcon, PauseIcon, PlayIcon, SyncIcon, XIcon } from '@primer/octicons-react';
import { Button, IconButton } from '../../ui/toolkit';
import type { StoryFrame, StoryScene } from '../../rendering/story/types';
import { STORY_DURATION, STORY_SHOTS, STORY_SHOT_TIMES, storyFrame } from '../../content/story/octocatAbduction';
import { withDeadline } from '../boot/withDeadline';
import { createStorySound, type StorySound } from './storyAudio';
import './story.css';

const openingFrame: StoryFrame = { time: 0, duration: STORY_DURATION, shot: '', speaker: null, caption: '', finished: false };
const clock = (time: number) => `0:${Math.floor(time).toString().padStart(2, '0')}`;

interface StorySceneDialogProps {
  open: boolean;
  reducedMotion: boolean;
  onClose: () => void;
}

/** The home-screen experiment owns no campaign state. Closing it disposes the entire stage. */
export function StorySceneDialog({ open, reducedMotion, onClose }: StorySceneDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [reloadRequired, setReloadRequired] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [frame, setFrame] = useState<StoryFrame>(openingFrame);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundUnavailable, setSoundUnavailable] = useState(false);
  const sound = useRef<StorySound | null>(null);
  const scene = useRef<StoryScene | null>(null);
  const settings = useRef({ paused: paused || hidden || reducedMotion, reducedMotion });
  settings.current = { paused: paused || hidden || reducedMotion, reducedMotion };

  useLayoutEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.showModal();
    closeButton.current?.focus();
    return () => {
      dialog.current?.close();
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const changed = () => {
      setHidden(document.hidden);
      scene.current?.setPaused(document.hidden || settings.current.paused);
    };
    changed();
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, [open]);

  useEffect(() => {
    if (!open || !canvas) return;
    const controller = new AbortController();
    let active = true;
    let current: StoryScene | null = null;
    let importCompleted = false;
    let lastFrame = openingFrame;
    setPhase('loading'); setProgress({ loaded: 0, total: 0 }); setFrame(openingFrame); setPaused(false);
    setSoundEnabled(false); setSoundUnavailable(false);
    const fail = (reason: unknown) => {
      if (!active || controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : 'The scene could not open.');
      setReloadRequired(!importCompleted);
      setPhase('error');
      controller.abort();
      current?.dispose();
      if (scene.current === current) scene.current = null;
      current = null;
    };
    const start = async () => {
      const { createStoryScene } = await withDeadline(import('../../rendering/story/createStoryScene'));
      importCompleted = true;
      if (!active || controller.signal.aborted) return;
      const pending = createStoryScene(canvas, {
        signal: controller.signal, ...settings.current,
        onProgress: (loaded, total) => { if (active && !controller.signal.aborted) setProgress({ loaded, total }); },
        onFrame: next => {
          if (!active || controller.signal.aborted) return;
          // Keep caption changes immediate while avoiding a React update for every rendered frame.
          if (Math.abs(next.time - lastFrame.time) >= .1 || next.caption !== lastFrame.caption || next.shot !== lastFrame.shot || next.finished !== lastFrame.finished) {
            lastFrame = next; setFrame(next);
          }
        },
        onError: fail,
      }).then(next => {
        if (!active || controller.signal.aborted) { next.dispose(); return null; }
        return next;
      });
      const next = await withDeadline(pending, 30_000);
      if (!next || !active || controller.signal.aborted) return;
      current = next; scene.current = next;
      next.setReducedMotion(settings.current.reducedMotion);
      next.setPaused(settings.current.paused);
      next.resize(); setPhase('ready');
    };
    void start().catch(fail);
    const observer = new ResizeObserver(() => current?.resize());
    observer.observe(canvas);
    return () => {
      active = false; controller.abort(); observer.disconnect(); current?.dispose();
      sound.current?.dispose(); sound.current = null;
      if (scene.current === current) scene.current = null;
    };
  }, [open, canvas, attempt]);

  useEffect(() => {
    scene.current?.setReducedMotion(reducedMotion);
    scene.current?.setPaused(settings.current.paused);
  }, [reducedMotion, paused, hidden]);

  useEffect(() => {
    sound.current?.update(frame.time);
    sound.current?.setPlaying(open && phase === 'ready' && !paused && !hidden && !reducedMotion && !frame.finished);
  }, [frame.time, frame.finished, open, phase, paused, hidden, reducedMotion, soundEnabled]);

  const toggleSound = () => {
    if (sound.current) { sound.current.dispose(); sound.current = null; setSoundEnabled(false); return; }
    const unavailable = () => { setSoundUnavailable(true); setSoundEnabled(false); sound.current?.dispose(); sound.current = null; };
    sound.current = createStorySound(unavailable);
    if (!sound.current) { unavailable(); return; }
    setSoundEnabled(true); setSoundUnavailable(false);
    sound.current.update(frame.time);
    sound.current.setPlaying(!paused && !hidden && !reducedMotion && !frame.finished);
  };

  const seek = (time: number) => {
    sound.current?.update(time);
    scene.current?.seek(time);
    if (time < frame.duration) setFrame(previous => ({ ...previous, time, finished: false }));
  };
  const replay = () => { seek(0); setPaused(false); };
  const nextShot = () => {
    const next = STORY_SHOT_TIMES.find(time => time > frame.time + .2);
    seek(next ?? frame.duration);
  };
  const previousShot = () => {
    const previous = [...STORY_SHOT_TIMES].reverse().find(time => time < frame.time - .2);
    seek(previous ?? 0);
  };
  const storyboardShot = STORY_SHOTS.find(shot => shot.name === frame.shot);
  const subtitles = reducedMotion && storyboardShot
    ? storyFrame((storyboardShot.start + storyboardShot.end) / 2) : frame;

  return <dialog ref={dialog} className="story-dialog" aria-labelledby="story-title" data-reduced-motion={reducedMotion}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    {open && <div className="story-player" data-testid="story-player" data-state={phase}>
      <header className="story-header">
        <div><span className="story-eyebrow">STORY PREVIEW</span><h2 id="story-title">One small feature</h2></div>
        {soundUnavailable && <span className="story-sr-only" role="status">Sound is unavailable. The scene continues silently.</span>}
        <IconButton ref={closeButton} variant="quiet" aria-label="Close story scene" title="Close story scene (Esc)" onClick={onClose}><XIcon size={20} /></IconButton>
      </header>
      <div className="story-stage">
        <canvas key={attempt} ref={setCanvas} className="story-canvas" data-testid="story-canvas" role="img" aria-label="A cinematic scene with Copilot, Octocat and invading enemies" />
        <div className="story-vignette" aria-hidden="true" />
        {phase === 'ready' && frame.caption === 'TO BE CONTINUED' && <div className="story-ending" aria-live="polite"><p>TO BE CONTINUED</p></div>}
        {phase === 'loading' && <div className="story-status" role="status"><span className="story-eyebrow">SETTING THE SCENE</span><h3>Bringing the story into view…</h3><progress aria-label="Story loading progress" max={Math.max(1, progress.total)} value={progress.loaded} /><p>{progress.total ? `${progress.loaded} / ${progress.total} assets` : 'Preparing the stage'}</p></div>}
        {phase === 'error' && <div className="story-status" role="alert"><h3>The story couldn’t open</h3><p>{error}</p><Button variant="primary" onClick={() => reloadRequired ? window.location.reload() : setAttempt(value => value + 1)}>{reloadRequired ? 'Reload app' : 'Retry scene'}</Button></div>}
        {phase === 'ready' && (paused || hidden || reducedMotion || frame.finished) && <span className="story-playback-state">{reducedMotion ? 'Storyboard · reduced motion' : frame.finished ? 'Scene complete' : 'Paused'}</span>}
      </div>
      <div className="story-subtitles" aria-live="polite" aria-atomic="true">
        {phase === 'ready' && subtitles.caption && subtitles.caption !== 'TO BE CONTINUED' && <><span className="story-speaker">{subtitles.speaker || ' '}</span><p>{subtitles.caption}</p></>}
      </div>
      <footer className="story-controls">
        <div className="story-timeline"><label className="story-sr-only" htmlFor="story-seek">Scene timeline</label><input id="story-seek" aria-valuetext={`${clock(frame.time)} of ${clock(frame.duration)}`} type="range" min="0" max={frame.duration} step="0.1" value={frame.time} disabled={phase !== 'ready'} onChange={event => { sound.current?.setPlaying(false); setPaused(true); seek(Number(event.currentTarget.value)); }} /><span>{clock(frame.time)} / {clock(frame.duration)}</span></div>
        <div className="story-actions">
          <div className="story-transport">
            {reducedMotion ? <><Button onClick={previousShot} disabled={phase !== 'ready' || frame.time <= 0}>Previous shot</Button><Button variant="primary" onClick={nextShot} disabled={phase !== 'ready' || frame.finished}>Next shot</Button></> : <Button variant="primary" onClick={() => frame.finished ? replay() : setPaused(value => !value)} disabled={phase !== 'ready'}>{frame.finished ? <SyncIcon size={16} /> : paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}{frame.finished ? 'Replay' : paused ? 'Play' : 'Pause'}</Button>}
            {!frame.finished && !reducedMotion && <IconButton aria-label="Replay scene" title="Replay scene" onClick={replay} disabled={phase !== 'ready'}><SyncIcon size={16} /></IconButton>}
          </div>
          <span className="story-shot" aria-hidden="true">{phase === 'ready' ? frame.shot : ''}</span>
          <div className="story-exit-actions"><IconButton aria-label={soundEnabled ? 'Disable story sound' : 'Enable story sound'} title={soundUnavailable ? 'Sound unavailable on this device' : soundEnabled ? 'Sound on' : 'Sound off'} aria-pressed={soundEnabled} onClick={toggleSound} disabled={phase !== 'ready' || reducedMotion}>{soundEnabled ? <UnmuteIcon size={16} /> : <MuteIcon size={16} />}</IconButton><Button variant="quiet" onClick={onClose}>{frame.finished ? 'Back to Hub' : 'Skip scene'}</Button></div>
        </div>
      </footer>
    </div>}
  </dialog>;
}

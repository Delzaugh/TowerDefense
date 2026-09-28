import * as THREE from 'three';
import { createDigitalResolve, createResolveBudget } from 'tower-presentation';

const GAPS = [56, 68, 49, 63] as const;
const AWAY_SECONDS = 3;

/** One occasional departure/return across the campus, using the shared authored effect. */
export function createCampusLifecycles() {
  const budget = createResolveBudget(64);
  type Participant = {
    actor: THREE.Group;
    mixer: THREE.AnimationMixer;
    effect: NonNullable<ReturnType<typeof createDigitalResolve>>;
    resolve: THREE.AnimationAction;
    place: THREE.AnimationAction;
    ready: boolean;
    active: boolean;
    reset: () => void;
  };
  const participants: Participant[] = [];
  let current: Participant | undefined;
  let remaining = 28, age = 0, next = 0, event = 0, disposed = false;

  const finish = () => {
    if (!current) return;
    current.mixer.stopAllAction();
    current.effect.setState(null);
    current.actor.visible = true;
    current.actor.userData.lifecycle = 'present';
    current.active = false;
    current.reset();
    current = undefined;
  };
  return {
    register(actor: THREE.Group, model: THREE.Object3D, clips: readonly THREE.AnimationClip[], mixer: THREE.AnimationMixer, reset: () => void) {
      const resolve = THREE.AnimationClip.findByName(clips as THREE.AnimationClip[], 'resolve');
      const place = THREE.AnimationClip.findByName(clips as THREE.AnimationClip[], 'place');
      if (!resolve || !place) return undefined;
      const effect = createDigitalResolve(THREE, model, { budget });
      if (!effect) return undefined;
      // Prepare before normal pose playback; source geometry/materials stay shared.
      actor.add(effect.object);
      effect.prepare();
      const participant: Participant = {
        actor, mixer, effect, resolve: mixer.clipAction(resolve), place: mixer.clipAction(place),
        ready: false, active: false, reset,
      };
      participants.push(participant);
      actor.userData.lifecycle = 'present';
      return participant;
    },
    update(delta: number) {
      if (disposed || !Number.isFinite(delta) || delta < 0) return;
      if (!current) {
        remaining -= delta;
        const candidate = participants[next];
        // Wait for this character to stop, rather than dissolve while travelling.
        if (remaining > 0 || !candidate?.ready) return;
        current = candidate;
        next = (next + 1) % participants.length;
        current.active = true;
        current.mixer.stopAllAction();
        age = 0;
      } else age += delta;
      const exit = current.resolve.getClip().duration;
      const entry = current.place.getClip().duration;
      if (age >= exit + AWAY_SECONDS + entry) {
        finish();
        remaining = GAPS[event++ % GAPS.length]!;
        return;
      }
      const placing = age >= exit + AWAY_SECONDS;
      const away = age >= exit && !placing;
      const action = placing ? current.place : current.resolve;
      const phase = placing ? 'place' : away ? 'away' : 'resolve';
      const clip = action.getClip();
      if (current.actor.userData.lifecycle !== phase) {
        current.mixer.stopAllAction();
        action.reset().setLoop(THREE.LoopOnce, 1).play();
        action.clampWhenFinished = true;
        action.paused = true;
      }
      action.time = placing ? age - exit - AWAY_SECONDS : Math.min(age, exit);
      current.mixer.update(0);
      current.actor.visible = !away;
      current.actor.userData.lifecycle = phase;
      current.actor.updateMatrixWorld(true);
      current.effect.setState(clip.name, action.time, clip.duration);
    },
    reset() {
      if (disposed) return;
      finish();
      remaining = 28;
    },
    dispose() {
      if (disposed) return;
      finish();
      disposed = true;
      for (const participant of participants) participant.effect.dispose();
      participants.length = 0;
    },
  };
}

export type CampusLifecycles = ReturnType<typeof createCampusLifecycles>;

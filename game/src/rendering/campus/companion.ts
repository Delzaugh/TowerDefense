import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { CAMPUS_STROLL_ROUTE } from '../../content/maps/campusHome';
import type { CampusLifecycles } from './lifecycle';

/** Presentation-only stroll with occasional authored departure/return. */
export function createCampusCompanion(model: GLTF, lifecycles?: CampusLifecycles) {
  const actor = new THREE.Group();
  actor.name = 'campus_companion';
  // Keep the loaded template pristine before residents clone this same v02 model.
  const scene = clone(model.scene);
  actor.add(scene);
  const clip = THREE.AnimationClip.findByName(model.animations, 'idle');
  if (!clip) throw new Error('Copilot v02 is missing its authored idle clip.');
  const mixer = new THREE.AnimationMixer(scene);
  const idle = mixer.clipAction(clip);
  const lifecycle = lifecycles?.register(actor, scene, model.animations, mixer, () => idle.reset().play());
  idle.play();
  let disposed = false;
  const left = new THREE.Vector3(...CAMPUS_STROLL_ROUTE.left);
  const right = new THREE.Vector3(...CAMPUS_STROLL_ROUTE.right);
  let time = 3.5;
  const smooth = (value: number) => value * value * (3 - 2 * value);
  const pose = () => {
    const leg = 9.5;
    const phase = (time % (2 * leg) + 2 * leg) % (2 * leg);
    const returning = phase >= leg;
    const legTime = phase % leg;
    const progress = smooth(Math.min(legTime / 7, 1));
    const turn = smooth(THREE.MathUtils.clamp((legTime - 7.5) / 1.5, 0, 1));
    actor.position.lerpVectors(returning ? right : left, returning ? left : right, progress);
    actor.rotation.y = returning ? -Math.PI / 2 + Math.PI * turn : Math.PI / 2 - Math.PI * turn;
    if (lifecycle) lifecycle.ready = legTime >= 7 && legTime < 7.5;
  };
  mixer.setTime(time);
  pose();
  return {
    actor,
    update(deltaSeconds: number) {
      if (disposed || lifecycle?.active) return;
      time += deltaSeconds;
      mixer.update(deltaSeconds);
      pose();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    },
  };
}

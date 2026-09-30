import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { CAMPUS_RESIDENTS, type CampusResident } from '../../content/maps/campusResidents';
import { CAMPUS_ROUTINES, CAMPUS_ROUTINE_CYCLE, CAMPUS_ROUTINE_OFFSET, type CampusRoutine } from '../../content/maps/campusRoutines';
import type { CampusLifecycles } from './lifecycle';

const smooth = (t: number) => t * t * (3 - 2 * t);
const turnToward = (from: number, to: number, t: number) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * t;

/** A shared schedule lets two residents arrive, talk and leave together. */
export function routinePose(routine: CampusRoutine, time: number) {
  const phase = ((time % CAMPUS_ROUTINE_CYCLE) + CAMPUS_ROUTINE_CYCLE) % CAMPUS_ROUTINE_CYCLE;
  const steps = CAMPUS_ROUTINES[routine];
  const index = steps.findIndex(step => phase >= step.start && phase < step.end);
  const step = steps[index]!;
  const { points } = step;
  const stopTime = phase - step.start;
  if (points.length === 1) return {
    position: new THREE.Vector3(points[0]![0], 1.28, points[0]![1]), heading: step.facing,
    moving: false, speed: 0, distance: 0, stopTime, activity: step.activity,
    speaking: step.activity === 'conversation' && (Math.floor(stopTime / 3) % 2 === (routine === 'coffee' ? 0 : 1)),
  };
  const lengths = points.slice(1).map((point, i) => Math.hypot(point[0] - points[i]![0], point[1] - points[i]![1]));
  const length = lengths.reduce((a, b) => a + b, 0);
  const progress = stopTime / (step.end - step.start);
  const distance = smooth(progress) * length;
  let remaining = distance, segment = 0;
  while (segment < lengths.length - 1 && remaining > lengths[segment]!) remaining -= lengths[segment++]!;
  const a = points[segment]!, b = points[segment + 1]!;
  let heading = Math.atan2(b[0] - a[0], b[1] - a[1]);
  if (segment > 0 && remaining < .6) {
    const previous = points[segment - 1]!;
    heading = turnToward(Math.atan2(a[0] - previous[0], a[1] - previous[1]), heading, .5 + .5 * smooth(remaining / .6));
  } else if (segment < lengths.length - 1 && lengths[segment]! - remaining < .6) {
    const next = points[segment + 2]!;
    heading = turnToward(heading, Math.atan2(next[0] - b[0], next[1] - b[1]), .5 * smooth(1 - (lengths[segment]! - remaining) / .6));
  }
  heading = turnToward(steps[(index + steps.length - 1) % steps.length]!.facing, heading, smooth(Math.min(1, stopTime / .8)));
  heading = turnToward(heading, step.facing, smooth(THREE.MathUtils.clamp((phase - step.end + .8) / .8, 0, 1)));
  const u = remaining / lengths[segment]!;
  return {
    position: new THREE.Vector3(THREE.MathUtils.lerp(a[0], b[0], u), 1.28, THREE.MathUtils.lerp(a[1], b[1], u)),
    heading, moving: true, speed: 6 * progress * (1 - progress) * length / (step.end - step.start),
    distance, stopTime: 0, activity: step.activity, speaking: false,
  };
}

/** Stops and turns happen on the spot, with a continuous position at loop seams. */
export function residentPose(resident: CampusResident, time: number) {
  if (resident.routine) return routinePose(resident.routine, time + CAMPUS_ROUTINE_OFFSET);
  const start = new THREE.Vector3(...resident.start);
  if (!resident.end) return { position: start, heading: resident.facing, moving: false, speed: 0, distance: 0, stopTime: time, activity: resident.activity, speaking: false };
  const end = new THREE.Vector3(...resident.end);
  const travel = resident.travel ?? 20, pause = resident.pause ?? 8;
  const leg = travel + pause;
  const phase = ((time + resident.phase) % (2 * leg) + 2 * leg) % (2 * leg);
  const returning = phase >= leg, local = phase % leg;
  const progress = Math.min(local / travel, 1);
  const heading = Math.atan2(end.x - start.x, end.z - start.z) + (returning ? Math.PI : 0);
  const turn = smooth(THREE.MathUtils.clamp((local - travel - pause + 2) / 2, 0, 1));
  return {
    position: new THREE.Vector3().lerpVectors(returning ? end : start, returning ? start : end, progress),
    heading: heading + Math.PI * turn,
    moving: local < travel,
    speed: local < travel ? start.distanceTo(end) / travel : 0,
    distance: start.distanceTo(end) * (progress + (returning ? 1 : 0)),
    stopTime: Math.max(0, local - travel),
    activity: resident.activity, speaking: false,
  };
}

/** Clone skeletons per resident; geometry, textures and clips remain shared read-only assets. */
export function createCampusResidents(models: ReadonlyMap<string, GLTF>, lifecycles?: CampusLifecycles) {
  const group = new THREE.Group();
  group.name = 'Campus residents';
  let elapsed = 0, disposed = false;
  const people = CAMPUS_RESIDENTS.map(resident => {
    const gltf = models.get(resident.asset);
    if (!gltf) throw new Error(`The campus is missing ${resident.asset}.`);
    const model = clone(gltf.scene);
    const actor = new THREE.Group();
    actor.name = resident.name;
    actor.userData.residentAsset = resident.asset;
    actor.scale.setScalar(resident.presentationScale ?? 1);
    actor.add(model);
    group.add(actor);
    const mixer = new THREE.AnimationMixer(model);
    const actions = new Map(gltf.animations.filter(clip => ['idle','move','work','wave'].includes(clip.name))
      .map(clip => [clip.name, mixer.clipAction(clip)]));
    const person = { resident, actor, model, mixer, actions, active: '', time: 0 };
    // Coordinated social routines continue uninterrupted; the other Copilots
    // and developers can take a brief break at a stationary route point.
    const lifecycle = !resident.routine && ['copilot_base', 'copilot_developer'].includes(resident.asset)
      ? lifecycles?.register(actor, model, gltf.animations, mixer, () => { person.active = ''; }) : undefined;
    for (const action of actions.values()) action.play().setEffectiveWeight(0);
    return Object.assign(person, { lifecycle });
  });
  const pose = (delta: number) => {
    for (const person of people) {
      const { resident, actor, mixer, actions } = person;
      if (person.lifecycle?.active) {
        actor.userData.speaking = false;
        actor.userData.activity = actor.userData.lifecycle;
        continue;
      }
      person.time += delta;
      const state = residentPose(resident, resident.routine ? elapsed : person.time);
      if (person.lifecycle) person.lifecycle.ready = !state.moving && state.stopTime < (resident.pause ?? Infinity) - 2;
      actor.position.copy(state.position);
      actor.rotation.y = state.heading;
      // Rigid water drift moves the entire toy; no character rig is animated in code.
      if (resident.float) {
        actor.position.x += Math.sin(elapsed * .17) * .32;
        actor.position.y += Math.sin(elapsed * .9) * .018;
        actor.rotation.y += Math.sin(elapsed * .23) * .22;
      }
      const resting = resident.routine
        ? (state.activity === 'conversation' && state.stopTime < 2.5 && actions.has('wave') ? 'wave' : 'idle')
        : resident.activity === 'wave' ? (state.stopTime < 2.5 ? 'wave' : 'idle') : resident.activity ?? 'idle';
      const selected = state.moving && actions.has('move') ? 'move' : actions.has(resting) ? resting : 'idle';
      const action = actions.get(selected);
      if (action && selected !== person.active) {
        const previous = actions.get(person.active);
        action.reset().setEffectiveWeight(1).play();
        if (previous) action.crossFadeFrom(previous, .3, false);
        person.active = selected;
      }
      if (action && selected === 'move' && resident.asset === 'github_octocat_classic_lowpoly') {
        // Authored stride: 0.48 source metres * 0.58517449 scale per gait cycle.
        action.timeScale = state.speed / (.48 * .5851744927) * action.getClip().duration;
      }
      mixer.update(delta);
      actor.userData.activity = resident.routine ? state.activity : state.moving ? 'strolling' : resting;
      actor.userData.speaking = state.speaking;
      actor.updateMatrixWorld(true);
    }
  };
  pose(0);
  return {
    group,
    update(delta: number) { if (!disposed) { elapsed += delta; pose(delta); } },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { mixer, model } of people) { mixer.stopAllAction(); mixer.uncacheRoot(model); }
    },
  };
}

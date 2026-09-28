import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it } from 'vitest';
import { CAMPUS_RESIDENTS } from '../../src/content/maps/campusResidents';
import { CAMPUS_ROUTINES, CAMPUS_ROUTINE_CYCLE } from '../../src/content/maps/campusRoutines';
import { createCampusResidents, residentPose, routinePose } from '../../src/rendering/campus/residents';

describe('campus residents', () => {
  it('joins coffee and noticeboard visits without teleporting, and alternates the conversation', () => {
    for (const routine of ['coffee', 'notices'] as const) {
      for (const step of CAMPUS_ROUTINES[routine]) {
        const before = routinePose(routine, step.end - .00001);
        const after = routinePose(routine, step.end + .00001);
        expect(before.position.distanceTo(after.position)).toBeLessThan(.0001);
        expect(Math.cos(before.heading - after.heading)).toBeGreaterThan(.9999);
      }
    }
    for (let time = 0; time < CAMPUS_ROUTINE_CYCLE; time += .25) {
      const first = routinePose('coffee', time), second = routinePose('notices', time);
      expect(first.position.distanceTo(second.position)).toBeGreaterThan(2);
      if (time >= 60 && time < 78) {
        expect(first.moving || second.moving).toBe(false);
        expect(first.speaking !== second.speaking).toBe(true);
      } else expect(first.speaking || second.speaking).toBe(false);
    }
  });

  it('keeps routes continuous through stops, reversals and loop seams', () => {
    for (const person of CAMPUS_RESIDENTS.filter(person => person.end)) {
      const leg = person.travel! + person.pause!;
      for (const boundary of [person.travel!, leg, leg + person.travel!, 2 * leg]) {
        const before = residentPose(person, boundary - person.phase - .00001);
        const after = residentPose(person, boundary - person.phase + .00001);
        expect(before.position.distanceTo(after.position)).toBeLessThan(.0001);
        expect(Math.cos(before.heading - after.heading)).toBeGreaterThan(.9999);
      }
      expect(residentPose(person, person.travel! + 1 - person.phase).moving).toBe(false);
    }
  });

  it('creates independent skeletons, shares resources, and stops updating after disposal', () => {
    const model = new THREE.Group();
    const bone = new THREE.Bone(); bone.name = 'test_bone'; model.add(bone);
    const mesh = new THREE.SkinnedMesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
    mesh.bind(new THREE.Skeleton([bone])); model.add(mesh);
    const idle = new THREE.AnimationClip('idle', 2, [new THREE.NumberKeyframeTrack('test_bone.position[y]', [0,1,2], [0,.1,0])]);
    const gltf = { scene: model, animations: [idle] } as unknown as GLTF;
    const models = new Map(CAMPUS_RESIDENTS.map(person => [person.asset, gltf]));
    const residents = createCampusResidents(models);
    expect(residents.group.children).toHaveLength(12);
    for (const actor of residents.group.children) {
      const resident = CAMPUS_RESIDENTS.find(item => item.name === actor.name)!;
      const expectedScale = resident.asset === 'copilot_rubber_duck' ? .5 : 1;
      expect(actor.scale.toArray()).toEqual([expectedScale, expectedScale, expectedScale]);
    }
    const meshes: THREE.SkinnedMesh[] = [];
    residents.group.traverse(object => { if (object instanceof THREE.SkinnedMesh) meshes.push(object); });
    expect(new Set(meshes.map(item => item.skeleton.bones[0])).size).toBe(12);
    expect(meshes.every(item => item.geometry === mesh.geometry && item.material === mesh.material)).toBe(true);
    const initial = residents.group.children[0]!.position.clone();
    residents.update(1);
    expect(residents.group.children[0]!.position.distanceTo(initial)).toBeGreaterThan(.1);
    expect(bone.position.y).toBe(0);
    residents.dispose();
    const stopped = residents.group.children[0]!.position.clone();
    residents.update(1);
    expect(residents.group.children[0]!.position.equals(stopped)).toBe(true);
  });
});

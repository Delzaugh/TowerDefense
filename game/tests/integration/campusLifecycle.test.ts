import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createCampusLifecycles } from '../../src/rendering/campus/lifecycle';
import { createCampusCompanion } from '../../src/rendering/campus/companion';
import { createCampusResidents } from '../../src/rendering/campus/residents';
import { CAMPUS_RESIDENTS } from '../../src/content/maps/campusResidents';

function model(): GLTF {
  const scene = new THREE.Group();
  const root = new THREE.Group(); root.name = 'root'; scene.add(root);
  root.userData.resolve_effect = { type: 'digital_blocks', version: 1, clip: 'resolve', assembleClip: 'place', cellSize: .2, maxFragments: 64, edgeColor: '#47D8E8' };
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial());
  mesh.name = 'body'; mesh.position.y = 1; root.add(mesh);
  const pose = new THREE.Object3D(); pose.name = 'eye'; root.add(pose);
  const clip = (name: string, values: number[]) => new THREE.AnimationClip(name, 1.25, [new THREE.NumberKeyframeTrack('eye.position[y]', [0, 1.25], values)]);
  return { scene, animations: [clip('idle', [0, 0]), clip('resolve', [0, 1]), clip('place', [1, 0])] } as GLTF;
}

describe('occasional campus Place / Resolve', () => {
  it('pins Copilot v02 and both delivered models contain the full authored effect contract', () => {
    const source = readFileSync('src/rendering/campus/assets.ts', 'utf8');
    expect(source).toContain("import copilot from 'tower-asset:copilot_base@v02'");
    expect(source).not.toContain('copilot_base@v01');
    for (const id of ['copilot_base_v02', 'copilot_developer_v01']) {
      const bytes = readFileSync(`../assets/runtime/towers/${id}.glb`);
      const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
      expect(gltf.animations.map((clip: { name: string }) => clip.name)).toEqual(expect.arrayContaining(['place', 'resolve', 'idle']));
      const root = gltf.nodes.find((node: { name: string }) => node.name === 'root');
      expect(root.extras.resolve_effect).toMatchObject({ type: 'digital_blocks', clip: 'resolve', assembleClip: 'place' });
    }
  });

  it('samples authored clips once, stays away, reassembles, and leaves a long gap before the next actor', () => {
    const director = createCampusLifecycles();
    const actors = [0, 1].map(() => {
      const gltf = model(), actor = new THREE.Group(); actor.add(gltf.scene);
      const mixer = new THREE.AnimationMixer(gltf.scene), reset = vi.fn();
      const handle = director.register(actor, gltf.scene, gltf.animations, mixer, reset)!;
      handle.ready = true;
      return { actor, gltf, handle, reset };
    });
    director.update(27.9);
    expect(actors.every(a => !a.handle.active)).toBe(true);
    director.update(.2);
    expect(actors[0]!.actor.userData.lifecycle).toBe('resolve');
    director.update(.625);
    expect(actors[0]!.gltf.scene.getObjectByName('eye')!.position.y).toBeCloseTo(.5);
    director.update(.625);
    expect(actors[0]!.actor.visible).toBe(false);
    expect(actors[0]!.actor.userData.lifecycle).toBe('away');
    director.update(3);
    expect(actors[0]!.actor.visible).toBe(true);
    expect(actors[0]!.actor.userData.lifecycle).toBe('place');
    director.update(.625);
    expect(actors[0]!.gltf.scene.getObjectByName('eye')!.position.y).toBeCloseTo(.5);
    director.update(.625);
    expect(actors[0]!.reset).toHaveBeenCalledOnce();
    expect(actors[0]!.handle.active).toBe(false);
    director.update(55);
    expect(actors[1]!.handle.active).toBe(false);
    director.update(1);
    expect(actors[1]!.handle.active).toBe(true);
    expect(actors[0]!.handle.active).toBe(false);
    director.dispose();
  });

  it('waits for a stop, restores visibility on reset, and disposes patched materials', () => {
    const gltf = model(), actor = new THREE.Group(); actor.add(gltf.scene);
    const mesh = gltf.scene.getObjectByName('body') as THREE.Mesh;
    const original = mesh.material;
    const director = createCampusLifecycles();
    const handle = director.register(actor, gltf.scene, gltf.animations, new THREE.AnimationMixer(gltf.scene), vi.fn())!;
    const patched = mesh.material as THREE.Material;
    const disposed = vi.spyOn(patched, 'dispose');
    director.update(100);
    expect(handle.active).toBe(false);
    handle.ready = true;
    director.update(.1); director.update(1.5);
    expect(actor.visible).toBe(false);
    director.reset();
    expect(actor.visible).toBe(true);
    expect(handle.active).toBe(false);
    expect(actor.userData.lifecycle).toBe('present');
    director.dispose(); director.dispose(); director.update(100);
    expect(mesh.material).toBe(original);
    expect(disposed).toHaveBeenCalledOnce();
    expect(handle.active).toBe(false);
  });

  it('freezes route motion during the effect and keeps loaded templates unmodified', () => {
    const gltf = model(), sourceMesh = gltf.scene.getObjectByName('body') as THREE.Mesh;
    const original = sourceMesh.material;
    const director = createCampusLifecycles();
    const companion = createCampusCompanion(gltf, director);
    const residents = createCampusResidents(new Map(CAMPUS_RESIDENTS.map(p => [p.asset, gltf])), director);
    expect(sourceMesh.material).toBe(original);
    let triggered = false;
    for (let i = 0; i < 500; i++) {
      director.update(.1); companion.update(.1); residents.update(.1);
      if (companion.actor.userData.lifecycle === 'resolve') { triggered = true; break; }
    }
    expect(triggered).toBe(true);
    const position = companion.actor.position.clone();
    const heading = companion.actor.rotation.y;
    for (let i = 0; i < 50; i++) { director.update(.1); companion.update(.1); residents.update(.1); }
    expect(companion.actor.position.equals(position)).toBe(true);
    expect(companion.actor.rotation.y).toBe(heading);
    director.reset(); companion.update(0); residents.update(0);
    expect(companion.actor.visible).toBe(true);
    director.dispose(); companion.dispose(); residents.dispose();
  });
});

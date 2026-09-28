import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createCampusAtmosphere, digitalCurrentState } from '../../src/rendering/campus/atmosphere';
import { disposeSceneResources } from '../../src/rendering/campus/resources';

describe('campus atmosphere', () => {
  it('keeps neighboring edges and residents attached throughout the gentle float', () => {
    const island = new THREE.Group();
    const first = new THREE.Group(), second = new THREE.Group();
    second.position.x = 2;
    const firstPort = new THREE.Object3D(), secondPort = new THREE.Object3D();
    firstPort.position.set(1, 1.2, 0); secondPort.position.set(-1, 1.2, 0);
    first.add(firstPort); second.add(secondPort); island.add(first, second);
    const resident = new THREE.Object3D(); resident.position.set(1, 1.28, 0); island.add(resident);
    const ambience = createCampusAtmosphere(island);
    const heights = [];
    for (let i = 0; i < 240; i++) {
      ambience.update(.5);
      island.updateMatrixWorld(true);
      const port = firstPort.getWorldPosition(new THREE.Vector3());
      expect(port.distanceTo(secondPort.getWorldPosition(new THREE.Vector3()))).toBeLessThan(.000001);
      expect(resident.getWorldPosition(new THREE.Vector3()).distanceTo(port)).toBeCloseTo(.08, 6);
      expect(island.position.y).toBeGreaterThanOrEqual(.25);
      expect(island.position.y).toBeLessThanOrEqual(.95);
      expect(island.quaternion.angleTo(new THREE.Quaternion())).toBeLessThan(.002);
      heights.push(island.position.y);
    }
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(.5);
    expect(firstPort.position.toArray()).toEqual([1, 1.2, 0]);
    expect(resident.position.toArray()).toEqual([1, 1.28, 0]);
    ambience.dispose(); disposeSceneResources([ambience.background]);
  });

  it('limits simultaneous currents and leaves long quiet intervals on every route', () => {
    let quiet = 0;
    for (let t = 0; t < 36; t += .1) {
      const states = Array.from({ length: 6 }, (_, i) => digitalCurrentState(i, t));
      expect(states.filter(state => state.opacity > 0).length).toBeLessThanOrEqual(2);
      if (states[0]!.opacity === 0) quiet += .1;
      expect(states.every(state => state.opacity >= 0 && state.opacity <= 1)).toBe(true);
    }
    expect(quiet).toBeGreaterThan(25);
  });

  it('freezes under reduced motion, resumes without a time jump, and disposes GPU resources', () => {
    const island = new THREE.Group();
    const ambience = createCampusAtmosphere(island, true);
    const { material, geometry } = ambience.background;
    const initial = island.position.clone();
    ambience.update(4);
    expect(island.position.equals(initial)).toBe(true);
    expect(Array.from(material.uniforms.fades!.value as Float32Array).every(value => value === 0)).toBe(true);
    ambience.setReducedMotion(false);
    ambience.update(2);
    const movingPose = island.position.clone();
    expect(movingPose.equals(initial)).toBe(false);
    const heads = Array.from(material.uniforms.heads!.value as Float32Array);
    ambience.setReducedMotion(true);
    ambience.resize(400, 500);
    ambience.update(60);
    expect(island.position.equals(movingPose)).toBe(true);
    expect(Array.from(material.uniforms.heads!.value as Float32Array)).toEqual(heads);
    ambience.setReducedMotion(false);
    expect(island.position.equals(movingPose)).toBe(true);
    const disposeMaterial = vi.spyOn(material, 'dispose'), disposeGeometry = vi.spyOn(geometry, 'dispose');
    ambience.dispose(); ambience.update(10);
    expect(island.position.equals(movingPose)).toBe(true);
    disposeSceneResources([ambience.background]);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
  });
});

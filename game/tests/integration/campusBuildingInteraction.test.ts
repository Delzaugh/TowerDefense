import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createCampusBuildingInteraction } from '../../src/rendering/campus/buildingInteraction';

describe('campus building hit testing', () => {
  it('follows the island transform and rejects an occluded Lab', () => {
    const scene = new THREE.Scene();
    const island = new THREE.Group();
    island.position.x = 3;
    scene.add(island);
    const building = new THREE.Group();
    building.name = 'campus_lab';
    building.userData.building = { id: 'copilot-lab' };
    building.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial()));
    island.add(building);
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
    camera.position.set(3, 0, 10);
    camera.lookAt(3, 0, 0);
    const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } as HTMLCanvasElement;
    const interaction = createCampusBuildingInteraction(scene, camera, canvas);
    expect(interaction.hitAt(50, 50)).toBe('copilot-lab');
    interaction.setHovered('copilot-lab');
    interaction.refresh();
    expect(interaction.hitAt(50, 50)).toBe('copilot-lab');
    const blocker = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), new THREE.MeshBasicMaterial());
    blocker.position.set(3, 0, 3);
    scene.add(blocker);
    expect(interaction.hitAt(50, 50)).toBeNull();
    blocker.visible = false;
    expect(interaction.hitAt(50, 50)).toBe('copilot-lab');
    interaction.setEnabled(false);
    expect(interaction.hitAt(50, 50)).toBeNull();
    interaction.dispose();
  });
});

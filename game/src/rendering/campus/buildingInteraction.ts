import * as THREE from 'three';
import type { CampusBuildingId } from './types';

/** Hit tests the rendered scene, so nearby campus geometry can occlude the Lab. */
export function createCampusBuildingInteraction(scene: THREE.Scene, camera: THREE.Camera, canvas: HTMLCanvasElement) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const box = new THREE.Box3();
  const building = scene.getObjectByName('campus_lab');
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0xa5f2dc, side: THREE.BackSide, transparent: true, opacity: .8, depthWrite: false,
  });
  // A back-face shell follows the authored meshes and leaves shared model materials untouched.
  const outline = building?.clone(true);
  outline?.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.material = outlineMaterial;
    object.scale.multiplyScalar(1.035);
    object.castShadow = false;
    object.receiveShadow = false;
    object.renderOrder = 3;
  });
  const footprint = new THREE.Mesh(
    new THREE.CircleGeometry(1, 48),
    new THREE.MeshBasicMaterial({ color: 0x8af0d6, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide }),
  );
  if (outline) outline.visible = false;
  footprint.visible = false;
  if (outline) outline.userData.interactionOverlay = true;
  footprint.userData.interactionOverlay = true;
  footprint.rotation.x = -Math.PI / 2;
  footprint.renderOrder = 2;
  if (outline && building?.parent) building.parent.add(outline);
  scene.add(footprint);

  let hovered: CampusBuildingId | null = null;
  let focused: CampusBuildingId | null = null;
  let enabled = true;

  const findBuilding = (object: THREE.Object3D): CampusBuildingId | null => {
    for (let current: THREE.Object3D | null = object; current; current = current.parent) {
      if (current.userData.building?.id === 'copilot-lab') return 'copilot-lab';
    }
    return null;
  };
  const hitAt = (x: number, y: number): CampusBuildingId | null => {
    if (!enabled) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    pointer.set((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, camera);
    const nearest = raycaster.intersectObjects(scene.children, true).find(({ object }) => {
      for (let current: THREE.Object3D | null = object; current; current = current.parent) {
        if (!current.visible || current.userData.interactionOverlay) return false;
      }
      return true;
    });
    return nearest ? findBuilding(nearest.object) : null;
  };
  const refresh = () => {
    const active = enabled && (focused ?? hovered) === 'copilot-lab';
    if (!building || !outline || !active) {
      if (outline) outline.visible = false;
      footprint.visible = false;
      return;
    }
    scene.updateMatrixWorld(true);
    box.setFromObject(building);
    if (box.isEmpty()) { outline.visible = false; footprint.visible = false; return; }
    box.expandByScalar(.16);
    outline.visible = true;
    footprint.visible = true;
    footprint.position.set((box.min.x + box.max.x) / 2, box.min.y + .025, (box.min.z + box.max.z) / 2);
    footprint.scale.set((box.max.x - box.min.x) * .62, (box.max.z - box.min.z) * .62, 1);
  };
  return {
    hitAt,
    focusAt() {
      if (!building) return null;
      scene.updateMatrixWorld(true);
      box.setFromObject(building);
      return box.isEmpty() ? null : box.getCenter(new THREE.Vector3());
    },
    refresh,
    setHovered(value: CampusBuildingId | null) { hovered = value; refresh(); },
    setFocused(value: CampusBuildingId | null) { focused = value; refresh(); },
    setEnabled(value: boolean) { enabled = value; if (!value) hovered = null; refresh(); },
    dispose() {
      outline?.removeFromParent();
      scene.remove(footprint);
      outlineMaterial.dispose();
      footprint.geometry.dispose();
      (footprint.material as THREE.Material).dispose();
    },
  };
}

import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

/** Dispose a parsed model and every clone through one ownership set. */
export function disposeSceneResources(roots: readonly THREE.Object3D[], models: Iterable<GLTF> = []): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const skeletons = new Set<THREE.Skeleton>();
  const instances = new Set<THREE.InstancedMesh>();
  const visit = (root: THREE.Object3D) => root.traverse(object => {
    if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Line) && !(object instanceof THREE.Points) && !(object instanceof THREE.Sprite)) return;
    geometries.add(object.geometry);
    const assigned = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of assigned) if (material) materials.add(material);
    if (object instanceof THREE.SkinnedMesh) skeletons.add(object.skeleton);
    if (object instanceof THREE.InstancedMesh) instances.add(object);
  });
  for (const root of roots) visit(root);
  for (const gltf of models) {
    visit(gltf.scene);
    for (const root of gltf.scenes) visit(root);
  }
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) textures.add(value);
    }
    material.dispose();
  }
  for (const skeleton of skeletons) skeleton.dispose();
  for (const instance of instances) instance.dispose();
  for (const geometry of geometries) geometry.dispose();
  const images = new Set<unknown>();
  for (const texture of textures) {
    const image: unknown = texture.image;
    texture.dispose();
    if (image && !images.has(image)) {
      images.add(image);
      if (typeof (image as { close?: unknown }).close === 'function') (image as { close(): void }).close();
    }
  }
}

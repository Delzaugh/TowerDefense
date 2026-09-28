import * as THREE from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

/** Small reusable effect textures; no image downloads or per-frame allocations. */
function effectTexture(kind: 'steam' | 'speech') {
  const width = 64, height = 64;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    let color = [255, 255, 255], alpha = 0;
    if (kind === 'steam') alpha = Math.pow(Math.max(0, 1 - Math.hypot(x - 31.5, y - 31.5) / 32), 1.7);
    else {
      // Rounded cream bubble with a short tail and three charcoal dots.
      const dx = Math.max(Math.abs(x - 31.5) - 20, 0), dy = Math.max(Math.abs(y - 36) - 13, 0);
      const body = dx * dx + dy * dy < 100;
      const tail = y >= 3 && y < 16 && x >= 21 && x <= 21 + (y - 3) * 1.1;
      alpha = body || tail ? 1 : 0;
      color = [243, 232, 211];
      if ([18, 32, 46].some(cx => Math.hypot(x - cx, y - 37) < 3.5)) color = [64, 86, 105];
    }
    pixels.set([...color, Math.round(alpha * 255)], offset);
  }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Authored plant clips plus visual-only weather, water and social cues. */
export function createCampusAmbient(campus: THREE.Group, models: ReadonlyMap<string, GLTF>, residents: THREE.Group, initiallyReduced = false) {
  const group = new THREE.Group();
  group.name = 'Campus ambience';
  let elapsed = 0, disposed = false, reduced = initiallyReduced;
  campus.updateMatrixWorld(true);

  const plants: Array<{ mixer: THREE.AnimationMixer; root: THREE.Object3D }> = [];
  for (const [index, instance] of campus.children.entries()) {
    const clip = models.get(instance.name)?.animations.find(clip => clip.name === 'idle');
    if (!clip) continue;
    let morph: THREE.Mesh | undefined;
    instance.traverse(object => { if (object instanceof THREE.Mesh && object.morphTargetInfluences) morph = object; });
    // Imported placement and mesh names can match; bind morph tracks directly.
    const root = morph ?? instance;
    const mixer = new THREE.AnimationMixer(root);
    mixer.clipAction(clip).play();
    mixer.setTime(reduced ? 0 : index * .47 % clip.duration);
    plants.push({ mixer, root });
  }

  const steamTexture = effectTexture('steam');
  const steam: Array<{ puff: THREE.Sprite; origin: THREE.Vector3; drift: THREE.Vector3; phase: number; kiosk: boolean }> = [];
  for (const instance of campus.children.filter(object => ['campus_cafe_table', 'campus_coffee_kiosk'].includes(object.name))) {
    const kiosk = instance.name === 'campus_coffee_kiosk';
    const anchor = instance.getObjectByName('anchor_steam');
    if (!kiosk && !anchor) continue;
    // Serving cup on the authored kiosk; the plume drifts clear of its awning.
    const origin = kiosk ? instance.localToWorld(new THREE.Vector3(.8, 1.73, .81)) : anchor!.getWorldPosition(new THREE.Vector3());
    const drift = new THREE.Vector3(0, 0, kiosk ? 1.8 : .2).applyQuaternion(instance.quaternion);
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTexture, color: 0xfff1df, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
      puff.name = 'Coffee steam';
      group.add(puff);
      steam.push({ puff, origin, drift, phase: i / 6, kiosk });
    }
  }

  const ripples: Array<{ mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>; origin: THREE.Vector3; phase: number }> = [];
  const ringGeometry = new THREE.RingGeometry(.94, 1, 32);
  for (const pond of campus.children.filter(object => object.name === 'campus_pond')) {
    const origin = pond.localToWorld(new THREE.Vector3(0, .318, 0));
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color: 0xd0efeb, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      mesh.name = 'Pond ripple';
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(origin);
      group.add(mesh);
      ripples.push({ mesh, origin, phase: i / 3 });
    }
  }

  // A fixed pool of low-poly leaves gusts near the woodland and park canopies.
  const leafSources = campus.children.filter(object => object.name === 'campus_tile_forest' || object.name === 'campus_tree_autumn_bare');
  const leafCount = leafSources.length * 8;
  const leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(.38, .2), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), leafCount);
  leaves.name = 'Drifting leaves';
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  leaves.frustumCulled = false;
  const leafPose = new THREE.Object3D();
  const leafColor = new THREE.Color();
  for (let i = 0; i < leafCount; i++) leaves.setColorAt(i, leafColor.setHex(i % 3 === 0 ? 0xc6a36a : i % 3 === 1 ? 0x7caa8f : 0x9fbda3));
  group.add(leaves);

  const speechTexture = effectTexture('speech');
  const conversations = residents.children.filter(actor => ['copilot-civic', 'octocat-plaza'].includes(actor.name)).map(actor => {
    const cue = new THREE.Sprite(new THREE.SpriteMaterial({ map: speechTexture, transparent: true, depthWrite: false, toneMapped: false }));
    cue.name = 'Conversation';
    cue.scale.set(1.65, 1.1, 1);
    group.add(cue);
    return { actor, cue };
  });

  const poseEffects = () => {
    for (const { puff, origin, drift, phase, kiosk } of steam) {
      const t = (elapsed * .16 + phase) % 1;
      puff.position.copy(origin).addScaledVector(drift, t);
      puff.position.x += Math.sin(t * 5 + phase) * .15;
      puff.position.y += t * (kiosk ? 2.8 : 1.9);
      puff.position.z += Math.cos(t * 4 + phase) * .08;
      const width = kiosk ? .45 + t * 1.45 : .3 + t * .95;
      puff.scale.set(width, width * 1.35, 1);
      (puff.material as THREE.SpriteMaterial).opacity = Math.sin(t * Math.PI) * (kiosk ? .62 : .46);
    }
    for (const { mesh, phase } of ripples) {
      const t = (elapsed / 5 + phase) % 1;
      const size = .2 + t * 2.25;
      mesh.scale.set(size, size * .54, 1);
      mesh.material.opacity = Math.sin(t * Math.PI) * .34;
    }
    for (let i = 0; i < leafCount; i++) {
      const source = leafSources[Math.floor(i / 8)]!;
      const forest = source.name === 'campus_tile_forest';
      const phase = (elapsed + Math.floor(i / 8) * 4.1 + (i % 8) * .63) % 24;
      const t = phase / 11;
      leafPose.position.copy(source.position);
      leafPose.position.x += (forest ? (i % 2 ? 8 : -8) : 0) + Math.sin(i * 2.4) + t * 3;
      leafPose.position.z += (forest ? Math.sin(i * 4) * 9 : Math.sin(i) * .6) + Math.sin(t * 5 + i) * .8;
      leafPose.position.y = 1.25 + (1 - Math.min(t, 1)) * (3.3 + (i % 3) * .45);
      leafPose.rotation.set(t * 7 + i, t * 4, Math.sin(t * 6 + i));
      leafPose.scale.setScalar(t < 1 ? Math.min(1, t * 10, (1 - t) * 8) : 0);
      leafPose.updateMatrix();
      leaves.setMatrixAt(i, leafPose.matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;
    for (const { actor, cue } of conversations) {
      cue.visible = Boolean(actor.userData.speaking);
      cue.position.copy(actor.position);
      // Keep the sprite body above each character's authored UI anchor. The
      // Octocat anchor is 1.93 m high, so the previous 1.7 m centre overlapped
      // its head at the isometric camera angle.
      cue.position.y += actor.name === 'octocat-plaza' ? 2.6 : 3.1;
    }
  };
  poseEffects();
  group.visible = !reduced;
  return {
    group,
    update(delta: number) {
      if (disposed || reduced || !Number.isFinite(delta) || delta < 0) return;
      elapsed += delta;
      for (const plant of plants) plant.mixer.update(delta * .75);
      poseEffects();
    },
    setReducedMotion(value: boolean) { reduced = value; group.visible = !value; },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const { mixer, root } of plants) { mixer.stopAllAction(); mixer.uncacheRoot(root); }
      // Geometry, materials and textures are released once by the scene owner.
      if (!steam.length) steamTexture.dispose();
      if (!conversations.length) speechTexture.dispose();
      if (!ripples.length) ringGeometry.dispose();
    },
  };
}

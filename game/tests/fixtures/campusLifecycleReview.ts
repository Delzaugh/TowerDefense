/** Local-only visual fixture: actual exports and the same campus lifecycle presenter. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import copilot from 'tower-asset:copilot_base@v02';
import developer from 'tower-asset:copilot_developer@v01';
import { createCampusLifecycles } from '../../src/rendering/campus/lifecycle';

async function main() {
  const canvas = document.querySelector('canvas')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xdce6eb);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff3df, 0x263248, 1.65));
  const sun = new THREE.DirectionalLight(0xfff4e6, 2.1); sun.position.set(-6, 14, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9 });
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0xb9c5c5, roughness: .92 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const camera = new THREE.OrthographicCamera(-8, 8, 6, -6, .1, 100);
  camera.position.set(8, 7, 14); camera.lookAt(0, 1.4, 0);
  const director = createCampusLifecycles();
  const loader = new GLTFLoader();
  const models = await Promise.all([loader.loadAsync(copilot.url), loader.loadAsync(developer.url)]);
  const actors = [models[0]!, models[1]!, models[0]!].map((gltf, index) => {
    const model = clone(gltf.scene), actor = new THREE.Group();
    actor.add(model); scene.add(actor);
    const mixer = new THREE.AnimationMixer(model);
    const idle = mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, 'idle')!);
    const handle = director.register(actor, model, gltf.animations, mixer, () => { idle.reset().play(); mixer.update(0); })!;
    handle.ready = true; idle.play(); mixer.update(0);
    actor.position.x = (index - 1) * 4;
    model.traverse(object => { if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; } });
    return actor;
  });
  const render = () => {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    const half = Math.max(6, 8 * height / width);
    camera.left = -half * width / height; camera.right = half * width / height; camera.top = half; camera.bottom = -half;
    camera.updateProjectionMatrix(); renderer.render(scene, camera);
    document.querySelector('output')!.textContent = `Copilot ${copilot.version} (${copilot.sha256.slice(0, 12)}) · Developer ${developer.version} (${developer.sha256.slice(0, 12)})\n` + actors.map((actor, i) => {
      const fragments = actor.getObjectByName('resolve_cube_fragments') as THREE.InstancedMesh | undefined;
      return `${i === 1 ? 'Developer' : 'Copilot ' + (i === 0 ? 'A' : 'B')}: ${actor.userData.lifecycle}, visible=${actor.visible}, cubes=${fragments?.count ?? 0}`;
    }).join('\n');
  };
  document.getElementById('next')!.onclick = () => { director.update(120); render(); };
  document.getElementById('step')!.onclick = () => { director.update(.625); render(); };
  document.getElementById('away')!.onclick = () => { director.update(3); render(); };
  document.getElementById('reset')!.onclick = () => { director.reset(); render(); };
  window.addEventListener('resize', render);
  render();
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
}
void main();

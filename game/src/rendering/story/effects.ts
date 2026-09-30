import * as THREE from 'three';
import { captureProgress, STORY_BEATS, storyPose, storyProgress } from '../../content/story/octocatAbduction';

/** Presentation-only signals and force lines; never deform character meshes. */
export function createStoryEffects() {
  const group = new THREE.Group();
  group.name = 'Story expressive cues';
  const badgeCanvas = document.createElement('canvas');
  badgeCanvas.width = badgeCanvas.height = 128;
  const context = badgeCanvas.getContext('2d')!;
  context.fillStyle = '#fff4db'; context.strokeStyle = '#753c30'; context.lineWidth = 7;
  context.beginPath(); context.roundRect(10, 8, 108, 96, 25); context.fill(); context.stroke();
  context.beginPath(); context.moveTo(50, 104); context.lineTo(61, 122); context.lineTo(75, 104); context.fill();
  context.fillStyle = '#c95536'; context.font = '900 80px sans-serif'; context.textAlign = 'center'; context.fillText('!', 64, 83);
  const texture = new THREE.CanvasTexture(badgeCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false, toneMapped: false }));
  badge.name = 'Copilot exclamation'; badge.renderOrder = 2;
  group.add(badge);

  const energy = new THREE.MeshBasicMaterial({ color: 0xffc276, transparent: true, opacity: .85, depthWrite: false });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffe5ac, transparent: true, opacity: .55, depthWrite: false });
  const tetherGeometry = new THREE.CylinderGeometry(.025, .025, 1, 6);
  const tethers = [new THREE.Mesh(tetherGeometry, energy), new THREE.Mesh(tetherGeometry, energy)];
  group.add(...tethers);
  const pulse = new THREE.Mesh(new THREE.RingGeometry(.92, 1.015, 48), glow);
  pulse.rotation.x = -Math.PI / 2; group.add(pulse);
  const lockRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, .018, 5, 48, Math.PI * 1.3), energy);
  lockRing.rotation.x = Math.PI / 2; group.add(lockRing);
  const restraintGeometry = new THREE.TorusGeometry(.55, .012, 5, 40);
  const restraints = [.63, .95].map(y => {
    const band = new THREE.Mesh(restraintGeometry, energy);
    band.rotation.x = Math.PI / 2; band.scale.set(1.25, .75, 1);
    band.userData.height = y; group.add(band); return band;
  });
  const sparks = new THREE.InstancedMesh(new THREE.OctahedronGeometry(.045), energy, 12);
  group.add(sparks);
  const transform = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0), from = new THREE.Vector3(), to = new THREE.Vector3(), direction = new THREE.Vector3();
  const fallback = new THREE.Vector3();
  let anchor: THREE.Object3D | undefined;
  let carrier: THREE.Group | undefined;
  let towAnchors: (THREE.Object3D | undefined)[] = [];
  return { group, badge, bind(copilot: THREE.Object3D, captureCarrier: THREE.Group) {
    anchor = copilot.getObjectByName('anchor_ui'); carrier = captureCarrier;
    towAnchors = ['anchor_tow_left', 'anchor_tow_right'].map(name => carrier!.getObjectByName(name));
  }, update(time: number, reduced: boolean) {
    const notice = time >= 14.2 && time < 16.5;
    badge.visible = notice;
    if (notice) {
      const p = storyProgress(time, 14.2, 14.55);
      const out = 1 - storyProgress(time, 16.1, 16.5);
      const pop = reduced ? 1 : (p + Math.sin(p * Math.PI) * .18) * out;
      if (anchor) anchor.getWorldPosition(badge.position);
      else badge.position.fromArray(storyPose('copilot', time).position).add(fallback.set(0, 2.1, 0));
      badge.position.y += .18 + (reduced ? 0 : .04 * Math.sin((time - 14.2) * 5));
      badge.scale.setScalar(.72 * pop);
    }
    const lock = captureProgress(time);
    const cat = storyPose('octocat', time);
    const deploy = storyProgress(time, 21, 23);
    if (carrier) {
      carrier.visible = time >= 10 && time < STORY_BEATS.exit;
      // Slide the tray just below foot level, then lift. An overhead arrival would
      // pass its solid floor through the captive's head and torso.
      carrier.position.fromArray(cat.position);
      carrier.position.z -= 4 * (1 - deploy);
      carrier.position.y -= .045;
    }
    pulse.visible = time >= 21 && time < 24.2;
    pulse.position.set(cat.position[0], .035, cat.position[2]);
    pulse.scale.setScalar(1.1 + .55 * (1 - deploy));
    glow.opacity = .5 * (1 - storyProgress(time, 23.2, 24.2));
    lockRing.visible = lock > 0;
    lockRing.position.fromArray(cat.position).add(fallback.set(0, .18, 0));
    lockRing.rotation.z = reduced ? 0 : time * .35;
    energy.opacity = lock > 0 ? .7 * lock : .65;
    for (const band of restraints) {
      band.visible = lock > 0;
      band.position.fromArray(cat.position).add(fallback.set(0, band.userData.height as number, 0));
    }
    tethers.forEach((tether, i) => {
      tether.visible = lock > 0;
      const bug = storyPose(i === 0 ? 'bug-left' : 'bug-right', time);
      from.fromArray(bug.position).add(fallback.set(-.25, .75, i === 0 ? .4 : -.4));
      if (towAnchors[i]) towAnchors[i]!.getWorldPosition(to);
      else to.fromArray(cat.position).add(fallback.set(i === 0 ? -1.58 : 1.58, .65, 0));
      direction.subVectors(to, from);
      tether.position.copy(from).add(to).multiplyScalar(.5);
      tether.scale.y = direction.length();
      tether.quaternion.setFromUnitVectors(up, direction.normalize());
    });
    const burst = Math.max(0, Math.min(1, (time - 22.85) / .65));
    sparks.visible = time >= 22.85 && time < 23.5;
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI * 2 / 12;
      transform.position.set(cat.position[0] + Math.cos(angle) * (1.1 + burst * .65), .5 + Math.sin(i * 3) * .2 + burst * .65, Math.sin(angle) * (.65 + burst * .45));
      transform.scale.setScalar(1 - burst); transform.rotation.set(i, time * 2, i * .7); transform.updateMatrix();
      sparks.setMatrixAt(i, transform.matrix);
    }
    sparks.instanceMatrix.needsUpdate = true;
  } };
}

// Run against the game Vite development server to inspect the actual registered GLBs.
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve('game/node_modules/playwright'));
const { PNG } = require(path.resolve('game/node_modules/playwright-core/lib/utilsBundle.js'));
function changedPixels(first, second) {
  const a = PNG.sync.read(first), b = PNG.sync.read(second);
  let changed = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if ([0,1,2].some(c => Math.abs(a.data[i+c] - b.data[i+c]) > 2)) changed++;
  }
  return changed;
}
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
await fs.mkdir('output/campus-life', { recursive: true });
try {
  await page.goto(process.env.CAMPUS_REVIEW_URL ?? 'http://127.0.0.1:5186/');
  await page.getByTestId('home-screen').filter({ has: page.getByTestId('campus-canvas') }).waitFor();
  await page.waitForFunction(() => document.querySelector('[data-testid="home-screen"]')?.dataset.state === 'ready');
  const report = await page.evaluate(async () => {
    const THREE = await import('/node_modules/.vite/deps/three.js');
    const { loadCampusModels } = await import('/src/rendering/campus/loadModels.ts');
    const { createCampusResidents } = await import('/src/rendering/campus/residents.ts');
    const { CAMPUS_HOME_PLACEMENTS } = await import('/src/content/maps/campusHome.ts');
    const { CAMPUS_ROUTINE_CYCLE } = await import('/src/content/maps/campusRoutines.ts');
    const models = await loadCampusModels(new AbortController().signal, () => {});
    const residents = createCampusResidents(models);
    const campus = new THREE.Group();
    for (const p of CAMPUS_HOME_PLACEMENTS) {
      const object = models.get(p.id).scene.clone(true);
      object.position.fromArray(p.position); object.rotation.y = p.rotation;
      object.userData = { tile: !!p.tile, id: p.id }; campus.add(object);
    }
    campus.updateMatrixWorld(true);
    const surfaces = campus.children.filter(o => o.userData.tile || o.userData.id.startsWith('campus_walk_') || ['campus_canyon_decor','campus_pond'].includes(o.userData.id));
    const obstacles = [];
    for (const object of campus.children.filter(o => !o.userData.tile && !o.userData.id.startsWith('campus_walk_') && o.userData.id !== 'campus_pond')) {
      object.traverse(mesh => {
        if (!mesh.isMesh) return;
        const g = mesh.geometry, triangles = [];
        for (let i = 0; i < (g.index?.count ?? g.attributes.position.count); i += 3) {
          const points = [0,1,2].map(k => new THREE.Vector3().fromBufferAttribute(g.attributes.position, g.index ? g.index.getX(i+k) : i+k).applyMatrix4(mesh.matrixWorld));
          triangles.push(new THREE.Triangle(...points));
        }
        obstacles.push({ id: object.userData.id, box: new THREE.Box3().setFromObject(mesh), triangles });
      });
    }
    const collisions = [], unsupported = [], overlaps = [];
    const ray = new THREE.Raycaster();
    for (let t = 0; t <= CAMPUS_ROUTINE_CYCLE; t += .5) {
      if (t) residents.update(.5);
      const boxes = [];
      for (const actor of residents.group.children) {
        const box = new THREE.Box3().setFromObject(actor, true);
        box.min.y = Math.max(box.min.y, actor.position.y + .14);
        box.expandByScalar(-.04);
        boxes.push({ name: actor.name, box });
        for (const obstacle of obstacles) {
          if (box.intersectsBox(obstacle.box) && obstacle.triangles.some(triangle => box.intersectsTriangle(triangle))) {
            if (!collisions.some(c => c.actor === actor.name && c.prop === obstacle.id)) collisions.push({ actor: actor.name, prop: obstacle.id, time: t });
          }
        }
        ray.set(new THREE.Vector3(actor.position.x, actor.position.y + .12, actor.position.z), new THREE.Vector3(0,-1,0));
        const ground = ray.intersectObjects(surfaces, true)[0];
        if ((!ground || Math.abs(ground.point.y - actor.position.y) > .15) && !unsupported.some(c => c.actor === actor.name)) unsupported.push({ actor: actor.name, time: t, floor: ground?.point.y, y: actor.position.y });
      }
      for (let a = 0; a < boxes.length; a++) for (let b = a+1; b < boxes.length; b++) {
        if (boxes[a].box.intersectsBox(boxes[b].box) && !overlaps.some(o => o.a === boxes[a].name && o.b === boxes[b].name)) overlaps.push({ a: boxes[a].name, b: boxes[b].name, time: t });
      }
    }
    residents.dispose();
    const { disposeSceneResources } = await import('/src/rendering/campus/resources.ts');
    disposeSceneResources([campus,residents.group], models.values());
    return { samples: CAMPUS_ROUTINE_CYCLE * 2 + 1, residents: residents.group.children.length, collisions, unsupported, overlaps };
  });
  await fs.writeFile('output/campus-life/placement-audit.json', JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await page.screenshot({ path: 'output/campus-life/overview.png' });
  await page.getByRole('button', { name: 'Pause ambience', exact: true }).click();
  await page.getByRole('button', { name: 'Resume ambience', exact: true }).waitFor();
  // Allow the button's 160 ms CSS transition and React effect to settle.
  await page.waitForTimeout(250);
  const first = await page.getByTestId('campus-canvas').screenshot({ path: 'output/campus-life/paused-first.png' });
  await page.waitForTimeout(500);
  const second = await page.getByTestId('campus-canvas').screenshot({ path: 'output/campus-life/paused-second.png' });
  // Ignore one-level GPU/background quantization; actual actor movement changes hundreds of pixels.
  report.pausedChangedPixels = changedPixels(first, second);
  if (report.pausedChangedPixels > 5) throw new Error('Paused canvas changed.');
  await page.getByRole('button', { name: 'Resume ambience', exact: true }).click();
  await page.waitForTimeout(1000);
  const resumed = await page.getByTestId('campus-canvas').screenshot();
  report.resumedChangedPixels = changedPixels(second, resumed);
  if (report.resumedChangedPixels < 200) throw new Error('Campus did not resume.');
  await fs.writeFile('output/campus-life/placement-audit.json', JSON.stringify(report,null,2));
  if (report.collisions.length || report.unsupported.length || report.overlaps.length) process.exitCode = 1;
} finally { await browser.close(); }

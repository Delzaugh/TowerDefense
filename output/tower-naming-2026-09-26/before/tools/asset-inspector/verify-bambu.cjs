const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { mkdtemp, readFile } = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || require.resolve('playwright', { paths: [process.cwd(), path.dirname(process.execPath), path.resolve(path.dirname(process.execPath), '..')] }));

(async () => {
  const { createInspectorServer } = await import(pathToFileURL(path.join(__dirname, 'server.mjs')));
  const server = createInspectorServer(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  const output = await mkdtemp(path.join(os.tmpdir(), 'tower-bambu-'));
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base + '/?asset=problem_bug&version=v01');
    await page.waitForFunction(() => window.inspectorState?.().entries.length === 1 && !window.inspectorState().loading);
    const modelBytes = await readFile(path.resolve(__dirname, '../../assets/runtime/enemies/problem_bug_v01.glb'));
    await page.locator('#clip-select').selectOption({ label: 'move' });
    await page.locator('#timeline').fill('0.35'); await page.locator('#timeline').dispatchEvent('input');
    const before = await page.evaluate(() => window.inspectorState());
    await page.locator('#bambu-open').click();
    await page.locator('#bambu-height').fill('100');
    const downloadEvent = page.waitForEvent('download'); await page.locator('#bambu-download').click();
    const download = await downloadEvent, sample = path.join(output, download.suggestedFilename()); await download.saveAs(sample);
    await page.waitForFunction(() => document.getElementById('bambu-status').textContent.startsWith('Downloaded'));
    assert(download.suggestedFilename().includes('move_0.350s'));
    assert.deepEqual(await page.evaluate(() => window.inspectorState()), before, 'Export must not change the viewer');
    assert.deepEqual(await readFile(path.resolve(__dirname, '../../assets/runtime/enemies/problem_bug_v01.glb')), modelBytes);
    const bytes = await readFile(sample), json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    assert.equal(bytes.readUInt32LE(8), bytes.length);
    assert(!json.skins && !json.animations);
    assert(json.images.every(image => image.bufferView !== undefined && !image.uri));
    assert(json.meshes.every(mesh => mesh.primitives.every(p => p.attributes.COLOR_0 === undefined && p.attributes.TEXCOORD_0 !== undefined)));
    assert.equal(json.asset.extras.heightMm, 100);
    await page.screenshot({ path: path.join(output, 'export-dialog-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.locator('#bambu-download').isVisible());
    assert(await page.locator('#bambu-dialog').evaluate(el => el.scrollWidth <= el.clientWidth));
    await page.screenshot({ path: path.join(output, 'export-dialog-phone.png') });
    await page.locator('#bambu-close').click(); await page.setViewportSize({ width: 1400, height: 1000 });

    // Compare the actual loaded output with independently evaluated source poses,
    // including skinning and a nonzero morph state. Sample image colours at vertices.
    const checks = await page.evaluate(async () => {
      const THREE = await import('./vendor/three.module.js');
      const { GLTFLoader } = await import('./vendor/GLTFLoader.js');
      const { buildBambuGlb } = await import('./export-bambu.js');
      const loader = new GLTFLoader(), catalog = await (await fetch('./api/models')).json();
      const check = (condition, message) => { if (!condition) throw new Error(message); };
      async function load(id) {
        const model = catalog.find(m => m.contract.id === id);
        return loader.loadAsync('./runtime/' + model.path);
      }
      const results = [];
      for (const id of ['problem_bug', 'work_coding_task', 'copilot_base', 'problem_missing_details', 'golden_compiler']) {
        const source = await load(id);
        const morph = id === 'work_coding_task';
        const clip = source.animations.find(c => c.tracks.some(t => t.name.endsWith('.morphTargetInfluences'))) || source.animations.find(c => c.name === 'move');
        if (clip) {
          const mixer = new THREE.AnimationMixer(source.scene), action = mixer.clipAction(clip); action.play(); action.time = clip.duration * .65; mixer.update(0);
        }
        source.scene.updateMatrixWorld(true);
        const sourcePoints = [], sourceColors = [], sourceTextures = [];
        source.scene.traverseVisible(mesh => {
          if (!mesh.isMesh) return;
          const g = mesh.geometry, count = g.index?.count ?? g.attributes.position.count;
          for (let i = 0; i < count; i += 3) {
            const indices = [0, 1, 2].map(j => g.index ? g.index.getX(i + j) : i + j);
            const points = indices.map(j => mesh.getVertexPosition(j, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld));
            if (points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).lengthSq() === 0) continue;
            sourcePoints.push(...points);
            for (const j of indices) sourceColors.push(mesh.material.vertexColors ? new THREE.Color().fromBufferAttribute(g.attributes.color, j).multiply(mesh.material.color).getHex() : null);
          }
          if (mesh.material.map) sourceTextures.push([mesh.material.map.image.width, mesh.material.map.image.height]);
        });
        if (morph) {
          let changed = false;
          source.scene.traverse(o => { if (o.morphTargetInfluences?.some(v => v > 0)) changed = true; });
          check(changed, 'Morph test must exercise a nonzero shape key');
        }
        const bounds = new THREE.Box3().setFromPoints(sourcePoints), center = bounds.getCenter(new THREE.Vector3());
        const scale = .1 / (bounds.max.y - bounds.min.y);
        const result = await buildBambuGlb(source.scene, { heightMm: 100 });
        const parsed = await loader.parseAsync(result.buffer, '');
        const targetPoints = [], targetColors = [], targetTextures = [];
        parsed.scene.traverse(mesh => {
          if (!mesh.isMesh) return;
          const image = mesh.material.map.image, canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
          const context = canvas.getContext('2d'); context.drawImage(image, 0, 0); const pixels = context.getImageData(0, 0, image.width, image.height).data;
          targetTextures.push([image.width, image.height]);
          for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
            targetPoints.push(new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position, i));
            const uv = new THREE.Vector2().fromBufferAttribute(mesh.geometry.attributes.uv, i);
            const x = Math.max(0, Math.min(image.width - 1, Math.round(uv.x * image.width - .5))), y = Math.max(0, Math.min(image.height - 1, Math.round(uv.y * image.height - .5))), offset = (y * image.width + x) * 4;
            targetColors.push((pixels[offset] << 16) | (pixels[offset + 1] << 8) | pixels[offset + 2]);
          }
        });
        check(targetPoints.length === sourcePoints.length, id + ': triangle count changed');
        let maxError = 0, colourError = 0;
        for (let i = 0; i < targetPoints.length; i++) {
          const p = sourcePoints[i]; p.set(p.x - center.x, p.y - bounds.min.y, p.z - center.z).multiplyScalar(scale);
          maxError = Math.max(maxError, p.distanceTo(targetPoints[i]));
          if (sourceColors[i] !== null) for (const shift of [0, 8, 16]) colourError = Math.max(colourError, Math.abs((sourceColors[i] >> shift & 255) - (targetColors[i] >> shift & 255)));
        }
        check(maxError < 1e-7, id + ': pose/scale mismatch ' + maxError);
        check(colourError <= 1, id + ': texture colours changed ' + colourError);
        check(Math.abs(result.dimensionsMm[1] - 100) < 1e-6, id + ': height mismatch');
        if (sourceTextures.length) check(JSON.stringify(sourceTextures) === JSON.stringify(targetTextures), id + ': original texture resolution changed');
        if (id === 'problem_bug') window.bambuPreview = parsed.scene;
        results.push({ id, triangles: result.triangles, maxPositionError: maxError, maxColourByteError: colourError });
      }
      // Synthetic gradient exercises interpolation, with asymmetric RGB corners
      // so UV inversion and accidental averaging cannot pass.
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3));
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true }));
      const { buffer } = await buildBambuGlb(mesh);
      const roundTrip = await loader.parseAsync(buffer, ''), image = roundTrip.scene.children[0].material.map.image;
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
      const pixel = ctx.getImageData(11, 11, 1, 1).data;
      check([...pixel].slice(0, 3).every(v => Math.abs(v - 156) <= 1), 'Gradient must interpolate in linear space before sRGB encoding');
      for (const heightMm of [0, NaN, Infinity, 2001]) {
        let failed = false; try { await buildBambuGlb(mesh, { heightMm }); } catch { failed = true; }
        check(failed, 'Invalid height accepted');
      }
      let catalogExports = 0;
      for (const model of catalog) {
        const source = await loader.loadAsync('./runtime/' + model.path);
        const result = await buildBambuGlb(source.scene, { heightMm: 100 });
        check(result.triangles > 0 && result.dimensionsMm.every(Number.isFinite), model.path + ': invalid export');
        const data = new DataView(result.buffer);
        check(data.getUint32(8, true) === result.buffer.byteLength, model.path + ': invalid GLB length');
        source.scene.traverse(o => {
          o.geometry?.dispose(); o.skeleton?.dispose();
          for (const material of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) {
            for (const value of Object.values(material)) if (value?.isTexture) { value.image?.close?.(); value.dispose(); }
            material.dispose();
          }
        });
        catalogExports++;
      }
      return { poses: results, catalogExports };
    });
    // Rest export while comparison, isolation and palette previews are active.
    await page.locator('#review-open').click();
    await page.locator('summary').filter({ hasText: 'Palette · preview only' }).click();
    await page.locator('#comparison-select').selectOption('towers/copilot_base_v01.glb'); await page.locator('#compare-asset').click();
    await page.waitForFunction(() => window.inspectorState().entries.length === 2 && !window.inspectorState().loading);
    await page.locator('#review-close').click();
    await page.locator('#active-model').selectOption('enemies/problem_bug_v01.glb');
    await page.locator('#review-open').click();
    await page.locator('#palette-select').selectOption('red'); await page.locator('#palette-color').fill('#00ff00'); await page.locator('#palette-color').dispatchEvent('input');
    await page.locator('summary').filter({ hasText: 'Inspect structure' }).click();
    await page.locator('#part-select').selectOption('0');
    await page.locator('#review-close').click();
    await page.locator('#bambu-open').click(); await page.locator('#bambu-pose').selectOption('rest'); await page.locator('#bambu-height').fill('80');
    const restDownloadEvent = page.waitForEvent('download'); await page.locator('#bambu-download').click(); const restDownload = await restDownloadEvent;
    await restDownload.saveAs(path.join(output, restDownload.suggestedFilename()));
    assert(restDownload.suggestedFilename().includes('80mm_rest'));
    const restBytes = await readFile(path.join(output, restDownload.suggestedFilename()));
    const restJson = JSON.parse(restBytes.subarray(20, 20 + restBytes.readUInt32LE(12)).toString());
    const expectedRest = await page.evaluate(async metadata => {
      const { GLTFLoader } = await import('./vendor/GLTFLoader.js');
      const { buildBambuGlb } = await import('./export-bambu.js');
      const source = await new GLTFLoader().loadAsync('./runtime/enemies/problem_bug_v01.glb');
      const result = await buildBambuGlb(source.scene, { heightMm: 80, metadata });
      return [...new Uint8Array(result.buffer)];
    }, restJson.asset.extras);
    assert.deepEqual(restBytes, Buffer.from(expectedRest), 'Preview colours and comparison offsets must not affect saved-colour export');
    await page.waitForFunction(() => document.getElementById('bambu-status').textContent.startsWith('Downloaded'));
    await page.locator('#bambu-close').click();
    // Hash mismatch must fail instead of exporting a different revision.
    await page.route('**/runtime/enemies/problem_bug_v01.glb*', async route => {
      const response = await route.fetch(), bytes = await response.body(); bytes[bytes.length - 1] ^= 1; await route.fulfill({ response, body: bytes });
    });
    await page.locator('#bambu-open').click(); await page.locator('#bambu-download').click();
    await page.waitForFunction(() => document.getElementById('bambu-status').textContent.includes('changed on disk'));
    assert(await page.locator('#bambu-download').isEnabled()); await page.locator('#bambu-close').click();
    await page.unrouteAll();
    await page.evaluate(async () => {
      const THREE = await import('./vendor/three.module.js');
      const canvas = document.createElement('canvas'); canvas.id = 'bambu-preview'; canvas.style = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:20'; document.body.append(canvas);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setSize(1400, 1000); renderer.setClearColor('#172631');
      const scene = new THREE.Scene(); scene.add(window.bambuPreview); scene.add(new THREE.HemisphereLight(0xffffff, 0x8090a0, 2));
      const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(1, 2, 3); scene.add(light);
      const camera = new THREE.PerspectiveCamera(35, 1.4, .001, 10); camera.position.set(.22, .17, .28); camera.lookAt(0, .05, 0); renderer.render(scene, camera);
      window.renderBambuRear = () => { camera.position.set(-.22, .17, -.28); camera.lookAt(0, .05, 0); renderer.render(scene, camera); };
    });
    await page.screenshot({ path: path.join(output, 'bug-export-roundtrip.png') });
    await page.evaluate(() => window.renderBambuRear());
    await page.screenshot({ path: path.join(output, 'bug-export-rear.png') });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed: true, checks, output, sample }, null, 2));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });

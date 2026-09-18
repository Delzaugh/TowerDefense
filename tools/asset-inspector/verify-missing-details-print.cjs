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
  const output = await mkdtemp(path.join(os.tmpdir(), 'tower-missing-details-print-'));
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, acceptDownloads: true });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/?asset=problem_missing_details&version=v01');
    await page.waitForFunction(() => window.inspectorState?.().entries.length === 1 && !window.inspectorState().loading);
    const samples = [];
    for (const pose of ['rest', 'seated']) {
      if (pose === 'seated') { await page.locator('#clip-select').selectOption({ label: 'seated' }); await page.locator('#timeline').fill('0'); await page.locator('#timeline').dispatchEvent('input'); }
      await page.locator('#bambu-open').click(); await page.locator('#bambu-pose').selectOption(pose === 'rest' ? 'rest' : 'current');
      const pending = page.waitForEvent('download'); await page.locator('#bambu-download').click(); const download = await pending;
      const file = path.join(output, download.suggestedFilename()); await download.saveAs(file); samples.push(file);
      const bytes = await readFile(file), json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
      assert(json.asset.extras.revision >= 9, 'Must export the joined, embossed question mark');
      assert(!json.asset.extras.surfaceDecals, 'Raised lettering must not be flattened');
      await page.locator('#bambu-close').click();
    }
    const bytes = await readFile(samples[0]);
    const evidence = await page.evaluate(async values => {
      const THREE = await import('./vendor/three.module.js');
      const { GLTFLoader } = await import('./vendor/GLTFLoader.js');
      const printed = await new GLTFLoader().parseAsync(new Uint8Array(values).buffer, '');
      const inkBounds = new THREE.Box3(); let inkTriangles = 0;
      printed.scene.traverse(o => {
        if (!o.isMesh) return;
        const image = o.material.map.image, canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
        const geometry = o.geometry;
        for (let i = 0; i < geometry.attributes.position.count; i += 3) {
          const uv = new THREE.Vector2().fromBufferAttribute(geometry.attributes.uv, i);
          const x = Math.round(uv.x * image.width - .5), y = Math.round(uv.y * image.height - .5), offset = (y * image.width + x) * 4;
          if (pixels[offset] !== 121 || pixels[offset + 1] !== 85 || pixels[offset + 2] !== 34) continue;
          inkTriangles++;
          for (let j = 0; j < 3; j++) inkBounds.expandByPoint(new THREE.Vector3().fromBufferAttribute(geometry.attributes.position, i + j));
        }
      });
      const depthMm = (inkBounds.max.z - inkBounds.min.z) * 1000;
      if (!(inkTriangles > 70 && depthMm > .5)) throw new Error('Brown question mark must retain raised faces and side walls in the actual download');
      const canvas = document.createElement('canvas'); canvas.style = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:20'; document.body.append(canvas);
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); renderer.setSize(1000, 1000); renderer.setClearColor('#e7e9eb');
      const scene = new THREE.Scene(); scene.add(printed.scene); scene.add(new THREE.HemisphereLight(0xffffff, 0x909090, 2));
      const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(1, 2, 3); scene.add(light);
      const camera = new THREE.OrthographicCamera(-.065, .065, .065, -.065, .001, 10); camera.position.set(0, .05, 1); camera.lookAt(0, .05, 0); renderer.render(scene, camera);
      window.showPrintOblique = () => { camera.position.set(.25, .12, .5); camera.lookAt(0, .05, 0); renderer.render(scene, camera); };
      return { inkTriangles, depthMm };
    }, [...bytes]);
    await page.screenshot({ path: path.join(output, 'embossed-question-front.png') });
    await page.evaluate(() => window.showPrintOblique()); await page.screenshot({ path: path.join(output, 'embossed-question-oblique.png') });
    assert.deepEqual(errors, []); console.log(JSON.stringify({ passed: true, evidence, output, samples }, null, 2));
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });

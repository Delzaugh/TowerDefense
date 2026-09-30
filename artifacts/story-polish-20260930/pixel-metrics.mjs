import { readFile, writeFile, readdir, copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const game = path.resolve(root, '../../game');
const require = createRequire(import.meta.url);
const { PNG } = require(process.argv[2]);
const inspector = await readFile(path.join(game, '../.agents/skills/threejs-qa-release/scripts/inspect-threejs-canvas.mjs'), 'utf8');
// Reuse the exact existing inspector pixel computation, on the explicitly selected story canvas.
const start = inspector.indexOf('function computePixelMetrics(png)');
const end = inspector.indexOf('// Playwright', start);
if (start < 0 || end < 0) throw new Error('Inspector metric function not found');
const computePixelMetrics = new Function('round', `${inspector.slice(start, end)}; return computePixelMetrics;`)((value, digits) => Number(value.toFixed(digits)));
const manifest = JSON.parse(await readFile(path.join(root, 'evidence.json'), 'utf8'));
const final = path.join(root, 'final');
const files = await readdir(final, { recursive: true });
const audience = await Promise.all(files.filter(file => file.endsWith('story-audience-captures.json')).map(async file => ({
  directory: path.dirname(path.join(final, file)), ...JSON.parse(await readFile(path.join(final, file), 'utf8')),
})));
const reports = [];
for (const declared of manifest.captures) {
  const source = audience.find(source => source.mode === declared.mode);
  const capture = source?.captures.find(capture => capture.seconds === declared.seconds);
  if (!capture || capture.diagnostics?.state.time !== declared.seconds) throw new Error(`Unacknowledged ${declared.mode}/${declared.state}`);
  const bytes = await readFile(path.join(source.directory, capture.canvasFile));
  const png = PNG.sync.read(bytes);
  let min = 255, max = 0, alphaPixels = 0;
  const colors = new Set();
  const stride = Math.max(1, Math.floor(png.width * png.height / 4096));
  for (let pixel = 0; pixel < png.width * png.height; pixel += stride) {
    const [r, g, b, a] = png.data.subarray(pixel * 4, pixel * 4 + 4);
    min = Math.min(min, r, g, b); max = Math.max(max, r, g, b);
    if (a > 0) alphaPixels++;
    colors.add(`${r >> 4},${g >> 4},${b >> 4},${a >> 6}`);
  }
  const limits = declared.mode === 'desktop' ? { calls: 300, triangles: 750000, geometries: 300, textures: 60 }
    : { calls: 150, triangles: 300000, geometries: 200, textures: 40 };
  const rows = Object.entries(limits).map(([metric, limit]) => ({ metric, limit, actual: capture.diagnostics[metric], ok: capture.diagnostics[metric] <= limit }));
  const result = {
    ok: alphaPixels > 256 && (max - min > 8 || colors.size > 3),
    reason: 'nonblank', alphaPixels, variance: max - min, colorBuckets: colors.size,
    metrics: computePixelMetrics(png),
    renderBudget: { tier: declared.mode, rows, withinBudget: rows.every(row => row.ok), note: 'Skill starting-point budgets; no GPU timing inferred' },
  };
  if (!result.ok) result.reason = 'low-variance';
  const report = { version: 1, runId: manifest.runId, mode: declared.mode, state: declared.state,
    requestedState: declared.state, appliedState: declared.state, seconds: declared.seconds,
    method: manifest.captureMethod, screenshotPath: path.resolve(game, declared.report).replace(/\.json$/, '.png'), screenshotCssPixels: { width: png.width, height: png.height },
    canvasBounds: capture.canvasBounds, viewport: capture.viewport, gpu: source.gpu,
    diagnostics: capture.diagnostics, result };
  const filename = path.resolve(game, declared.report);
  await writeFile(filename, JSON.stringify(report, null, 2));
  await copyFile(path.join(source.directory, capture.canvasFile), filename.replace(/\.json$/, '.png'));
  reports.push(report);
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${declared.mode}/${declared.state} entropy=${result.metrics.colorEntropyBits} edges=${result.metrics.edgeDensity} contrast=${result.metrics.luminance.contrast} calls=${capture.diagnostics.calls} gpu=${source.gpu.renderer}`);
}
const motionFile = files.find(file => file.endsWith('story-motion-metrics.json') && path.dirname(file) !== '.');
if (!motionFile) throw new Error('Motion evidence missing');
const motionDirectory = path.dirname(path.join(final, motionFile));
const motion = JSON.parse(await readFile(path.join(final, motionFile), 'utf8'));
await copyFile(path.join(final, motionFile), path.join(final, 'story-motion-metrics.json'));
await copyFile(path.join(motionDirectory, 'video.webm'), path.join(final, 'story-video.webm'));
const { chromium } = require(path.join(game, 'node_modules/@playwright/test'));
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 300 } });
  for (const [name, from, to] of [['creep', 11, 13], ['lift', 23, 25], ['haul', 31, 33]]) {
    const frames = motion.motionFrames.filter(frame => frame.beforeCapture.state.time >= from && frame.beforeCapture.state.time <= to + .2);
    const figures = frames.map(frame => `<figure><img src="${pathToFileURL(path.join(motionDirectory, frame.canvasFile)).href}"><figcaption>Requested ${frame.requestedSeconds}s; observed ${frame.beforeCapture.state.time.toFixed(2)}–${frame.afterCapture.state.time.toFixed(2)}s</figcaption></figure>`).join('');
    const actualRange = `${frames[0].beforeCapture.state.time.toFixed(2)}–${frames.at(-1).afterCapture.state.time.toFixed(2)}s`;
    const html = `<!doctype html><meta charset="utf-8"><title>${name} live motion evidence</title><style>body{margin:20px;background:#0b1420;color:#eef4fc;font:15px system-ui}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}img{width:100%;display:block}figcaption{padding:6px;font-size:12px}h1{font-size:20px}</style><h1>${name}: uninterrupted scene observations, actual ${actualRange}</h1><p>Target interval ${from}–${to}s. No seeking. Each timestamp bracket surrounds both UI and canvas capture calls; screenshot overhead advances playback.</p><main>${figures}</main>`;
    const htmlFile = path.join(final, `contact-${name}.html`);
    await writeFile(htmlFile, html);
    await page.goto(pathToFileURL(htmlFile).href);
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await page.screenshot({ path: path.join(final, `contact-${name}.png`), fullPage: true });
  }
} finally { await browser.close(); }
await writeFile(path.join(final, 'pixel-summary.json'), JSON.stringify({ runId: manifest.runId, reports, motionGpu: motion.gpu }, null, 2));
if (reports.some(report => !report.result.ok)) process.exitCode = 1;

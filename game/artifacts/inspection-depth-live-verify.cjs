const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const base = 'https://delzaugh.github.io/TowerDefense/';
const expectedRelease = '9428f87c419ae370';
const expectedSource = '95c60cd1cdc05cdb80c49cc8de84d592cfcc962d';
(async () => {
  let info;
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const response = await fetch(`${base}build-info.json?release=${expectedRelease}&check=${Date.now()}`, { headers: { 'cache-control': 'no-cache' } });
    if (!response.ok) throw Error(`Build metadata: HTTP ${response.status}`);
    info = await response.json();
    if (info.release === expectedRelease && info.sourceRevision === expectedSource) break;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (info.release !== expectedRelease || info.sourceRevision !== expectedSource) throw Error(`Live release is ${info.release}`);
  const files = info.manifest.filter(file => file.path !== '.nojekyll');
  const results = [];
  for (let index = 0; index < files.length; index += 6) {
    const batch = await Promise.all(files.slice(index, index + 6).map(async file => {
      const response = await fetch(`${base}${file.path}?release=${expectedRelease}`, { headers: { 'cache-control': 'no-cache' } });
      if (!response.ok) throw Error(`${file.path}: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
      if (bytes.length !== file.bytes || sha256 !== file.sha256) throw Error(`File differs: ${file.path}`);
      return { path: file.path, bytes: bytes.length, sha256 };
    }));
    results.push(...batch);
  }
  const report = { url: base, release: info.release, sourceRevision: info.sourceRevision, verified: results.length, contentBytes: results.reduce((sum, file) => sum + file.bytes, 0), checkedAt: new Date().toISOString(), files: results };
  fs.writeFileSync(path.join(__dirname, 'inspection-depth-live-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, files: undefined }));
})().catch(error => { console.error(error); process.exitCode = 1; });

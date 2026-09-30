const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..');const prefix=path.relative(root,__dirname).replaceAll('\\','/');
const p=path.join(__dirname,'validation/visual_review.json');const r=JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const dir='validation/side-detail-evaluation-r45';const s=JSON.parse(fs.readFileSync(path.join(__dirname,dir,'inspector-state.json'),'utf8'));
if(s.entries[0].revision!==r.sha256)throw Error('Capture differs from reviewed export');
r.reviewedAt=new Date().toISOString();
r.checks.referenceFidelity.findings+=' Side-detail review confirms missing distinct crown ridge, slab-like shoulder, insufficient lower cheek/jaw volume and stacked cartridge construction. Both sides repeat these shortcomings. See side-detail-evaluation-r45/README.md.';
r.checks.construction.status='failed';r.checks.construction.findings='The amber capsules exist, but projecting socket lips hide them in matched oblique views. Cartridge wrap/cutback and bridge/shoulder junctions need reconstruction to match the reference part hierarchy. Mirrored major positions are consistent; the principal defect is not one-sided missing geometry.';
r.secondPass.findings+=' Both exact profiles and symmetric oblique angles were inspected for part hierarchy and amber visibility; these confirm further source refinement is required.';
for(const n of ['left','right','oblique-a','oblique-b']){const file=prefix+'/'+dir+'/'+n+'.png';r.evidence.push({path:file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),view:n,mode:'shaded'});}
fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');
fs.appendFileSync(path.join(__dirname,'decisions.md'),'\n## 2026-09-30 — Side part/detail review\nUser provides current profile and illustrative reference and requests side-to-side detail review. Both actual sides are consistent, but crown ridge, shoulder form, lower cheek/jaw masses and wraparound cartridge construction are underdeveloped. Amber exists but is occluded too early in side-oblique views. 552 triangles in six small amber markers suggest reallocation toward primary forms within the 4500 ceiling. Evaluation recorded in validation/side-detail-evaluation-r45/README.md. Production assets unchanged.\n');

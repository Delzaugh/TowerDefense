"""Portable canonical sources, GLBs, provenance and removable campus; excludes staging/cache/history."""
from pathlib import Path
import json,zipfile,hashlib
root=Path(__file__).resolve().parents[2]
kit=json.loads((root/'assets/kits/github-campus-v01.json').read_text())
model_count=len(kit['assets'])
paths=set()
for asset in kit['assets']:
    paths.add(root/asset['runtime'])
    folder=(root/asset['manifest']).parent
    for p in folder.iterdir():
        if p.is_file() and p.suffix in ('.blend','.py','.json','.md','.svg','.png'):paths.add(p)
    for p in (folder/'validation').iterdir():
        if p.is_file() and p.suffix in ('.json','.png'):paths.add(p)
    if asset['id']=='gh_sign':
        for p in (folder/'references').rglob('*'):
            if p.is_file() and p.suffix in ('.svg','.json','.md','.txt'):paths.add(p)
for folder in ['tools/asset-pipeline','tools/asset-inspector','tools/asset-presentation','prototypes/github-campus']:
    for p in (root/folder).rglob('*'):
        if p.is_file() and not any(part in ('__pycache__','.staging','revisions') for part in p.parts):paths.add(p)
for p in (root/'tools/github-campus-kit').iterdir():
    if p.is_file() and p.suffix in ('.py','.mjs','.cjs','.json','.ps1'):paths.add(p)
paths.update([root/'assets/kits/github-campus-v01.json',root/'assets/README.md',root/'docs/design/Visual_Asset_Guide.md',root/'docs/design/GitHub_Campus_Kit.html',root/'docs/research/github-offices-2026-09-30/sources.json',root/'docs/research/github-offices-2026-09-30/image-index.json',root/'docs/research/github-offices-2026-09-30/brand-colors.json',root/'docs/research/github-offices-2026-09-30/mural-research.md'])
destination=root/'exports/github-campus-v01.zip';destination.parent.mkdir(exist_ok=True)
catalog={'schemaVersion':1,'assets':[{'id':a['id'],'version':'v01','manifest':a['manifest']} for a in kit['assets']]}
readme='''GitHub campus v01 — 29 editable environment models and a disposable prototype.

Open .blend files under blender/environment/gh_*/v01/ in Blender. All palette images are packed.
Use self-contained GLBs under assets/runtime/environment/ in any glTF 2.0 application.
Full measured dimensions, counts, hashes and source links: assets/kits/github-campus-v01.json.

To preview, extract the whole archive, install/use Node.js, then run:
  node prototypes/github-campus/serve.mjs
Open http://127.0.0.1:5199/. Drag to orbit, scroll/pinch to zoom, right-drag to pan.
Use tour, floor and roof controls; Asset library inspects every model.
Delete prototypes/github-campus/ to remove the study; reusable art stays intact.

The full photo/PDF research pack remains in the original workspace. Source registry is included here.
These are authored low-poly interpretations, not measured as-built reconstructions.
Static scenery, with no collision-based walk simulation. GitHub marks and referenced artwork retain their owners' rights; no new license is inferred. Source photos are excluded from the model pack and were not used as textures.
Three.js license is in tools/asset-inspector/vendor/THREE_LICENSE.txt.
Recipes and original source decisions are preserved; guarded re-export uses tools/asset-pipeline.
''' 
with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    z.writestr('README.txt',readme)
    z.writestr('assets/asset_catalog.json',json.dumps(catalog,indent=2)+'\n')
    for p in sorted(paths):
        relative=p.relative_to(root).as_posix()
        if relative=='docs/design/GitHub_Campus_Kit.html':
            html=p.read_text().replace('href="../research/github-offices-2026-09-30/report.html">Research and photographs','href="../research/github-offices-2026-09-30/sources.json">Research source registry').replace('<a href="../../exports/github-campus-v01.zip">Download complete pack</a>','')
            z.writestr(relative,html)
        else:z.write(p,relative)
with zipfile.ZipFile(destination) as z:
    assert z.testzip() is None
    assert len([n for n in z.namelist() if n.startswith('assets/runtime/') and n.endswith('.glb')])==model_count
    assert len([n for n in z.namelist() if n.endswith('.blend')])==model_count
    assert len(json.loads(z.read('assets/asset_catalog.json'))['assets'])==model_count
sha=hashlib.sha256(destination.read_bytes()).hexdigest()
report={'passed':True,'file':destination.relative_to(root).as_posix(),'sha256':sha,'bytes':destination.stat().st_size,'files':len(paths)+2,'GLBs':model_count,'editableBlends':model_count}
(root/'artifacts/github-campus/package-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))

# GitHub campus study

A disposable interactive campus assembled from the 36 canonical `gh_*` models. It combines public references to the historic Brannan warehouse, orange collaboration containers, Rapt Studio's oak library, rooftop concrete chess furniture and the contemporary green atrium. The layout is an interpretation, not an as-built site plan.

Run from the Tower workspace:

```powershell
node prototypes/github-campus/serve.mjs
```

Open **http://127.0.0.1:5199/**. The server binds only to loopback and serves an explicit allowlist of prototype pages, Three.js vendor files and the 36 catalog-registered GLBs. It does not serve arbitrary workspace files.

Drag to orbit, scroll to zoom, and right-drag or Shift-drag to pan. Touch supports one-finger orbit and two-finger pinch. The tour opens Campus, Warehouse, Library, Atrium, Terrace and Asset library. Warehouse cutaway reveals one furnished floor at a time. Roofs and daylight/dusk can be toggled. Asset library presents each reusable model independently. The Library includes three photo-informed bookshelf and work lounge modules. Choose Explore shelves to look more closely, then click or tap the hidden Octocat when you find it. Three graphic murals appear beside the library, in the atrium and on the terrace. The existing bronze Thinktocat uses its polished canonical export.

Stop the local server with Ctrl+C, then delete this whole `prototypes/github-campus/` folder to discard the prototype. The production models remain under `blender/environment/gh_*/v01/`, `assets/runtime/environment/gh_*_v01.glb`, and the asset catalog. The research pack remains under `docs/research/github-offices-2036-09-30/`.

The prototype's only procedural geometry is its landscape base and the neutral asset-display pedestal. Buildings, floors, furniture, stairs, decoration and vegetation use the actual canonical GLBs. Repeated clones share geometries, materials and embedded textures; compatible mesh pieces are merged inside each named model branch to reduce draw calls while retaining cutaway controls.

Browser verification lives in `artifacts/verification.json` and view captures in `artifacts/`. Re-run with `node prototypes/github-campus/verify.mjs` after all 36 exports exist. This is a static design review, not a collision or occupancy simulation; there is no gameplay, account sign-in, backend or third-party service.



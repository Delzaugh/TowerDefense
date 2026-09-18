# Tower asset delivery

The versioned manifest is the contract. `assets/README.md` owns storage rules, `assets/asset_catalog.json` resolves IDs to manifests, and the visual guide owns shared style and animation meanings. Every asset uses `blender/<category>/<id>/<version>/<id>_<version>.blend` and `assets/runtime/<category>/<id>_<version>.glb`. Catalog, manifest location, source, runtime and recipe identities must agree; the shared validator enforces them.

Run from the project root with Node:

```text
node tools/asset-pipeline/asset.mjs init prop_server_rack environment
node tools/asset-pipeline/asset.mjs check
node tools/asset-pipeline/asset.mjs export problem_bug
node tools/asset-pipeline/asset.mjs export problem_bug --build
node tools/asset-pipeline/asset.mjs validate problem_bug
node tools/asset-pipeline/asset.mjs render problem_bug
node tools/asset-pipeline/asset.mjs milestone problem_bug approved_silhouette
node tools/asset-inspector/server.mjs
node tools/asset-pipeline/asset.mjs preview problem_bug
```

`init` creates the catalog entry, manifest, decision record and working folders. Complete the brief, source and clip/anchor requirements before exporting. It deliberately does not invent a finished Blender model. Categories are enemies, towers, work, product and environment. `v01` is the default; export/validate/render/preview also accept a version argument. The manifest schema is `asset.schema.json`; runtime validation is implemented in `contracts.mjs`.

`export` reads the current editable `.blend` in an isolated Blender process. The source needs a `root` object with all export content beneath it. Studio cameras/lights must be outside that hierarchy. Save applied transforms and rest pose. Animated sources use named NLA tracks and actions matching the manifest. Source files are never saved by the exporter.

`--build` first runs the asset's own recipe into an isolated staging directory. The current source hash must match `source.authoritativeHash`; otherwise rebuilding is refused to protect manual edits. Recipes receive `ASSET_BUILD_DIR`, `ASSET_SOURCE_NAME` and `ASSET_MANIFEST`; they must save the requested source there and must not replace canonical files. Model geometry and rig behavior remain in the recipe; the shared exporter owns GLB delivery. Do not change the recorded hash just to defeat this guard.

Delivery creates a candidate under the manifest folder's `.staging/`, checks it in the actual Three.js loader, and writes a hash-bound report and view/clip screenshots. Blocking failures preserve the previous runtime and source. Successful promotion retains the previous source, manifest and GLB as a milestone, increments the revision, and records source/export hashes together. A per-asset lock prevents concurrent deliveries; files are checked again before promotion. Ordinary refinement keeps v01; breaking interfaces require a new version or coordinated runtime change.

`validate` checks the current canonical export. `render` runs the same checks and captures neutral Three.js evidence of the actual GLB, including fixed views and clip midpoints. These are runtime inspection renders, not Blender beauty renders. The report lives at `<manifest folder>/validation/report.json` and screenshots beside it. Source/display dimensions are never silently corrected. Reports explicitly leave artistic approval pending.

Checks cover container integrity, self-contained resources, used geometry/materials, camera/light exclusion, loaded triangle/material/mesh/texture/bone budgets, texture dimensions, required anchors and clip names, identity root/mesh transforms, rest grounding, optional size bounds, skin weights/indices, finite sampled geometry/animation, stationary root and loop endpoints. Orientation/silhouette, attachment quality, foot sliding, crossings and animation appeal still need visual review. Metre scale is checked in Blender; glTF itself carries no authoring-unit metadata.

The inspector launcher reuses a compatible server from this workspace; `preview` prints its actual URL and starts one when needed. It binds localhost and resolves catalog links such as `?asset=problem_bug&version=v01`. Both discovery and GLB serving are restricted to registered runtime files. Refresh reloads the current GLB by hash while preserving compatible camera/animation context. Compare registered runtime assets/versions with the same lighting and authored scale. Source snapshots remain offline in revisions/; they have no inspector route.

Palette editing in the inspector is preview-only. For vertex colors, the authoring source emits a custom `_PALETTE_ROLE` scalar attribute and mesh extras `palette_roles: { attribute: "_palette_role", scale: 1, roles: { shell: 1, ... } }`. Base colors remain in `COLOR_0`; role IDs remain separate from color management. Use a FLOAT attribute on Blender face corners, and export custom attributes. The manifest's palette colors let validation catch lost or altered base colors. Imported assets without this mapping expose whole-material tint only. Copy the refinement note to apply precise role values to the source and re-export; the browser never writes a runtime GLB.

For a solid-colour texture atlas, declare `texturePalettes` in the manifest. A retained authoring `palette` must set `storage: "texture"`; omission retains legacy vertex-colour validation:

```json
"texturePalettes": [{
  "material": "bug_palette",
  "size": [32, 4],
  "roles": {
    "shell": {"color": "#3267AF", "rect": [0, 0, 4, 4]},
    "red": {"color": "#E51C30", "rect": [24, 0, 4, 4]}
  }
}]
```

Each entry identifies exactly one uniquely named material's sRGB base-colour map. `size` is the exported image's width/height; `rect` is `[x, y, width, height]` in pixels with a **top-left image origin**, independent of UV orientation. Declare non-overlapping solid-colour regions, including their padding, rather than arbitrary image regions or gradients. Multiple named materials/atlases are supported. Mappings are explicit; no role is guessed from an imported texture's RGB values. Existing vertex palettes continue unchanged.

Manifest checks reject invalid colours, duplicate material selectors, overlapping/out-of-bounds rectangles and oversized dimensions. Runtime delivery checks require the declared material, sRGB base map, dimensions and matching swatch pixels (one byte of colour tolerance). Missing or mismatched texture mappings in the Inspector show an explanation and keep fallback controls available. UVs must already target the intended swatches; use asset-specific UV/role checks when available.

Inspector edits clone the base texture with an independent image source, preserving colour space, UV channel, transform, sampling and alpha. Emission maps are not recoloured implicitly. Reset/reload disposes preview resources and restores the original. Copied notes include `texturePaletteEdits` with the exact rectangle and original/new colours. Apply those edits to the packed image in the authoritative Blender source, update manifest swatch colours, save/repack and use ordinary guarded export. Editing a neighbouring PNG alone does not update an image already packed in a saved `.blend`.

Dependencies: Node on PATH; Blender on PATH or `BLENDER_PATH` (Windows installations are discovered under Program Files); Playwright installed in the project or configured runtime, or `PLAYWRIGHT_MODULE_PATH`; browser channel `BROWSER_CHANNEL` (default `msedge`). Three.js and its license are checked in under `tools/asset-inspector/vendor/`. No CDN or external service is required. Configure `PORT` for a fixed preview port; otherwise the server uses 4174–4184.

Verification:

```text
node tools/asset-pipeline/verify.mjs
node tools/asset-pipeline/verify-palette-migration.mjs
node tools/asset-inspector/verify.cjs
node tools/asset-inspector/verify-review.cjs
node tools/asset-inspector/verify-catalog.cjs
node tools/asset-inspector/verify-texture-palettes.cjs
node tools/asset-pipeline/validate-catalog.mjs
```

The pipeline smoke test uses a temporary isolated project for a create/refine/export cycle. It also rejects an over-budget candidate and a stale procedural source, proving that canonical files remain intact. Inspector checks exercise real input, clips, comparison/reload, phone/touch and review controls. Catalog checks load every registered model and reject unregistered files and retired routes. Full catalog validation writes per-asset reports and assets/validation_catalog.json.

Imported assembly offsets can be recorded in contract.groundY when grounded is false. Keep those authored origins stable instead of silently grounding modular parts. Small palette atlases may use exportSettings.paletteSampler = linear to preserve non-mipmapped linear sampling for declared base-colour palettes; auxiliary maps retain their own samplers.

Discrete visual-state previews may set `exportSettings.samplingInterpolation` to `STEP` to preserve hard transitions in sampled shape-key animation. Omission keeps Blender's `LINEAR` default. Use this only when all sampled animation in that asset should switch discretely.

For assets combining smooth body motion with discrete morph states, leave `samplingInterpolation` at `LINEAR` and set `exportSettings.morphSamplingInterpolation` to `STEP`. This applies only to exported weight channels and retains the Blender-sampled values and times.

## Guarded palette migration

Small palette textures are the default under the shared visual guide. Keep vertex colours when they better serve continuous gradients, procedural variation or a documented practical benefit.

Run `node tools/asset-pipeline/asset.mjs export <id> --palette` for a delivered opaque semantic vertex palette. This reads the current authoritative Blender source, captures a fresh runtime baseline, stages a packed tiny palette image and UV channel, then verifies exact exported topology, positions, normals, skin weights, old UV channels, morphs (including sparse accessors), rig, anchors, animation and material/emission response before promotion. Unsupported colour graphs, alpha or conflicting role colours are rejected. Existing detail/emission textures retain their bytes, UV channel and sampling. Canonical source/runtime/manifest files remain unchanged on failure; a successful conversion retains a milestone.

The result declares `palette.storage: "texture"`, per-material `texturePalettes` and `exportSettings.paletteTextureWorkflow: true`. Ordinary export uses the packed image as authored. Future guarded `--build` calls automatically apply texture delivery to the recipe output; components inherited from a solid textured source can repack their used roles. The source-hash guard still applies. Do not run `--palette` twice or combine it with `--build`.

For migrated assets, `node tools/asset-pipeline/review-palette.cjs <id>` creates a before/after board, clip and phone-scale evidence, verifies Inspector role controls, and measures image differences. Personally inspect the board and record the hash-bound review in `validation/palette_visual_report.json` and the asset decisions. A generated board is not by itself visual approval. Images are packed in the .blend; the staging PNG is not a canonical external dependency.

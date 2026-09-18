# Asset Inspector

One Three.js inspector for registered runtime models. [Asset storage policy](../../assets/README.md) defines permitted paths; [asset_catalog.json](../../assets/asset_catalog.json) is the sole model list. Both enumeration and GLB requests resolve the catalog and validate the manifest. Unregistered files, source-art folders and revision snapshots cannot be served.

Newly scaffolded entries appear after their first runtime export exists. An unfinished draft does not prevent completed models from loading. A missing previously delivered export remains an error.

## Open

Run from the project root:

```text
node tools/asset-pipeline/asset.mjs preview copilot_shield
```

The launcher reuses a compatible server for this workspace or starts one on ports 4174–4184. It prints the actual URL. For a foreground server, use node tools/asset-inspector/server.mjs. Set PORT for a specific port. Binding is localhost only.

The Bambu export route requires server protocol 4. The launcher skips older running servers and prints the updated inspector URL; use that URL if an old tab cannot load the new export module.

Links identify a registered asset and version, for example ?asset=copilot_shield&version=v01. Current registered runtime-relative paths are also accepted, but there is no fallback search or alias translation. Unknown selections show a load error.

Three.js modules and their license are local in vendor/. No build step, CDN or internet service is required.

## Review

- Browse the registered category folders; filter by ID/filename. Select a model or use + to compare.
- Drag to orbit; wheel/pinch to zoom; right-drag/two-finger drag to pan. Use seven fixed views, fit/reset, orthographic/perspective, grid, wireframe and auto-rotation.
- Play discovered clips, pause, restart, return to rest, scrub and step at the manifest's authoring rate. Loop/one-shot defaults follow each clip contract. Static assets have no invented clips.
- Refresh reloads current runtime hashes and preserves compatible camera and animation context. Failed or obsolete loads cannot replace a valid displayed scene.
- Review & colors provides studio/gameplay-like lighting, light/dark backgrounds, optional ground/shadows, phone-width and small-silhouette tests, skeleton/anchor overlays and exported-mesh isolation.
- Comparisons load registered runtime assets or deliberately published versions at authored scale. Source snapshots remain archived under each asset's revisions folder.
- Explicit semantic IDs support independent vertex-colour previews for assets that use them. Models without those IDs expose clearly labeled whole-material tint. Color and roughness edits are temporary and must be applied to Blender and exported to become asset changes.
- Named solid texture swatches are supported through the manifest's `texturePalettes` mapping. Migrated assets expose their declared roles, including seven on Bug. Changing a role edits an isolated base-colour texture preview; other swatches, separate emission maps and other loaded assets remain intact. Reset and refresh restore the saved image. Copy changes includes the material, image size, role, pixel rectangle and original/new sRGB colour for a Blender refinement. Unmapped atlases retain whole-material tint.
- Copy a refinement note or save a matching viewport screenshot and JSON note. Notes include identity/version/revision/hash, view/camera, clip/time, selected mesh, appearance and temporary changes. No message is sent.

Statistics describe imported rest geometry before comparison offsets. Models are never automatically grounded or rescaled. The displayed budget comes from the manifest; blocking delivery validation belongs to the asset pipeline.

## Export for Bambu

Use **Export for Bambu** in the toolbar to download the selected asset as a static, textured GLB. Choose current pose or rest pose and a height in millimetres (default 100). Current pose is captured at Download; pause/scrub first for a precise frame. The whole asset is exported with saved colours, regardless of mesh isolation or temporary palette previews. Comparison offsets, overlays and aura effects are excluded.

The exporter independently reloads and checks the displayed runtime hash, evaluates skinning/morphs, centres the model horizontally and puts its lowest point at Y=0. GLB stays Y-up and stores positions in metres, as required by glTF; the requested millimetre height is converted accordingly. Only the download is transformed. Source files and registered runtime GLBs are never modified.

Vertex colours are baked into an embedded PNG atlas, with padded 32-pixel tiles per triangle and linear-to-sRGB conversion. Existing base-colour images retain their resolution and UV mapping; material tint is included. The download contains no rig, animation or shader effects. Texture baking approximates smooth vertex-colour gradients. Instancing, transparent/cutout surfaces, and materials combining vertex colours with a base-colour image currently produce an explicit error.

Open the downloaded GLB using Bambu Studio's Texture-to-Color Painting import (available in the 2.7.1 public release), map colours to available filaments, and save the project as 3MF. Verify the imported size and sliced result. This does not make game geometry watertight or otherwise guarantee printability. Actual Bambu import compatibility requires a user check; automated verification covers GLB structure, pose, dimensions, texture colours and browser downloads.

## Verification

```text
node tools/asset-inspector/verify.cjs
node tools/asset-inspector/verify-review.cjs
node tools/asset-inspector/verify-catalog.cjs
node tools/asset-inspector/verify-texture-palettes.cjs
node tools/asset-inspector/verify-bambu.cjs
node tools/asset-inspector/verify-missing-details-print.cjs
```

Tests cover actual browser mouse/touch input, camera, animations, reload/races, static and animated comparisons, material controls, notes and screenshots. Catalog tests load every registered GLB, reject unregistered files and retired routes, and check the runtime/source layout.

Playwright resolves from the project/runtime or PLAYWRIGHT_MODULE_PATH. BROWSER_CHANNEL defaults to msedge. Tests use temporary-port servers and keep screenshots outside runtime.

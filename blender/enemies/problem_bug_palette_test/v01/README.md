# Bug palette experiment result

Completed 2026-09-13. Candidate: problem_bug_palette_test v01 revision 2. Original: problem_bug v01 revision 6, preserved byte-for-byte in its source and runtime files. The experiment is registered for Inspector review and is not assigned to gameplay.

**Follow-up, 2026-09-13:** texture palette editing is now implemented. The candidate exposes seven named texture swatches in Review & colors, supports isolated previews/reset and detailed copied notes, and uses standard delivery checks for its manifest `texturePalettes` declaration. Source, PNG and GLB colours remain unchanged. The comparison below records the original experiment before this editor support; its whole-material-only limitation has been resolved. Shared cross-asset palette design and broad asset conversion remain separate work.

## Finding

A tiny palette texture reproduces this Bug's vertex colours with no visible loss and reduces the current uncompressed GLB by 5.34%. It preserves one material and one draw call. It does not demonstrate a frame-rate improvement. The current Inspector loses independent colour-role previews on the texture version, so a broad conversion should first establish texture-aware palette controls and validation.

## Comparison

| Measurement | Vertex-colour Bug | Textured Bug |
| --- | ---: | ---: |
| GLB size | 336,116 bytes | 318,160 bytes |
| Triangles | 2,334 | 2,334 |
| Exported vertices | 4,612 | 4,612 |
| Meshes / materials / bones | 1 / 1 / 16 | 1 / 1 / 16 |
| Base-colour data | 55,344 bytes of float RGB | 36,896 bytes of float UVs |
| Palette image | None | 32 x 4 pixels; 124 embedded PNG bytes |
| Estimated RGBA8 base texture storage | None | 512 bytes, excluding driver overhead |
| Draw calls: one Bug | 1 | 1 |
| Draw calls: 100 separate skinned copies | 100 | 100 |
| Inspector colour options | 7 semantic roles | 1 whole-material tint |

The GLB saves 17,956 bytes (about 17.5 KiB). Loaded vertex attribute arrays shrink by 18,448 bytes; a small texture is added. Copies in the probe share geometry/material data, so those resource savings must not be multiplied by the number of copies.

The draw-call probe uses the checked-in Three.js runtime in headless Edge, with identical opaque material settings and no shadow pass. It measures one model and 100 separately skinned copies with culling disabled. It is not a mobile benchmark or the complete game scene, and no FPS advantage is claimed. Texture sampling adds work while vertex bandwidth decreases; the practical balance requires device profiling. This also compares the existing float-colour export, not every possible compressed or quantized vertex-colour representation.

## Fidelity and visual review

- Exported positions, normals, indices, skin weights/indices, bone binds, anchors/rest transforms and every animation channel/time/value byte match the baseline.
- All 4,612 exported vertex UVs map to their expected role's swatch centre. Embedded sRGB PNG colours match all expected role colours. Maximum linear-colour difference from baseline float values: 0.0000000136.
- Eight matched pipeline screenshots cover isometric/front/side/rear/top views and move/hit/resolve poses. Maximum rendered channel difference is 2/255, with 1/255 or less in seven views. These are rounding-level differences, not byte-identical images.
- Personally inspected the side-by-side isometric board, close oblique view, front, rear, two move phases, hit and resolve poses, and a 390-pixel-wide small-silhouette view in the actual shared Inspector. Shell facets, eye/collar boundaries, red dorsal seam and leg accents retain their appearance. No new texture seams or colour bleeding were visible. Small-scale silhouette and accent readability match the baseline.
- Guarded delivery and experiment checks pass with no Three.js warnings or errors. Artistic acceptance remains the user's judgment.

## Authoring trade-offs

The candidate stores eight swatches in a packed sRGB atlas; seven are used on the current mesh. Face-corner UVs point to each swatch's centre. Linear sampling without mipmapped minification and padded solid swatches avoid mixing adjacent colours. There is no shared cross-asset palette dependency in this pilot: it preserves the Bug's existing colours in a reusable palette layout.

The editable source keeps semantic role IDs but removes vertex-colour data. Editing a swatch changes all mapped regions after saving/repacking the image and re-exporting the Blender source. Reassigning a region requires changing its UV mapping. The packed image is authoritative for the saved source; changing the neighbouring PNG alone does not update a saved .blend.

The baseline Blender material connects vertex colour to emission, but the shipped GLB contains uniform white emission at 0.08. The candidate explicitly preserves that shipped emission. Connecting the new atlas to emission would change appearance and was intentionally excluded from the base-colour experiment.

The Inspector currently understands semantic editing through vertex colours. It exposes only whole-material tint on this candidate even though role IDs remain. The experiment audit checks exported UV/swatch fidelity because the standard manifest.palette field currently declares a vertex-colour contract. No shared validator was weakened or altered.

## Recommendation

Palette conversion is technically viable for the Bug and gives a small delivery-size benefit. Keep the original as the active gameplay asset while evaluating the candidate. Before converting the other bespoke assets, add texture-aware role editing/validation and settle a shared palette layout. Preserve selective emission and meaningful material exceptions on each asset. Treat visual cohesion and editing convenience as the main reasons to standardize; do not use this result as proof that textures are universally faster or smaller.

## Review and files

- [Live candidate](http://127.0.0.1:4175/?asset=problem_bug_palette_test&version=v01)
- [Live original](http://127.0.0.1:4175/?asset=problem_bug&version=v01)
- In Review & colors, add the other Bug through the registered-asset comparison control.
- [Side-by-side Inspector screenshots](validation/inspector/comparison.png)
- [Editable source](problem_bug_palette_test_v01.blend)
- [Registered GLB](../../../../assets/runtime/enemies/problem_bug_palette_test_v01.glb)
- [Guarded delivery report](validation/report.json)
- [Export parity, UV/swatch and image comparison audit](validation/experiment_audit.json)
- [Inspector views, poses, controls and resource probe](validation/inspector/review.json)

Baseline source SHA-256: d63303ffbb8b8343d8225ded2ebc610c7c344f123baa372b441f51014406e1b2

Baseline GLB SHA-256: d4ce09cbe5a56ff12224c93e2f2d804481781b7efa4925195a4a6c5cbc540352

Candidate GLB SHA-256: 3210fff587383d6e9173bb89898abe00cc6d41de7ed02121a1b1b1fa5c3effaa

## Reproduce

Use ordinary guarded export after candidate Blender edits:

```text
node tools/asset-pipeline/asset.mjs export problem_bug_palette_test
node blender/enemies/problem_bug_palette_test/v01/audit_experiment.mjs
node blender/enemies/problem_bug_palette_test/v01/review_experiment.cjs
```

The scripts use the existing Playwright runtime through PLAYWRIGHT_MODULE_PATH; pngjs resolves from the same runtime package directory. convert_palette.py is a retained one-time source conversion record, not a rebuild recipe; it refuses to overwrite an existing candidate or operate on a changed baseline.

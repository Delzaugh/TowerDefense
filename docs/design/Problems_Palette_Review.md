# Problems palette iteration — 2026-09-27

Delivered a shared supporting palette with **five to seven distinct base colours
per Problem**. The six production enemies now use **22 family-wide colour values,
down from 48**. Five sources/GLBs changed; Bug remains the unchanged reference.

User direction: preserve character identities, align/merge Problem colours, and
try an eight-colour maximum. The supplied roster screenshot is visual reference,
not extra instructions. The user accepted the final appearance with "looks good"
on 2026-09-27, then requested cleanup and source/export alignment checks.

| Problem | Before | Delivered | Revision | Editable source | Runtime |
| --- | ---: | ---: | --- | --- | --- |
| Bug | 7 | 7 | v01 r12, unchanged | [Blender](../../blender/enemies/problem_bug/v01/problem_bug_v01.blend) | [GLB](../../assets/runtime/enemies/problem_bug_v01.glb) |
| Lag Spike | 9 | 7 | v01 r11 | [Blender](../../blender/enemies/problem_lag_spike/v01/problem_lag_spike_v01.blend) | [GLB](../../assets/runtime/enemies/problem_lag_spike_v01.glb) |
| Vague Spec | 10 | 7 | v01 r9 | [Blender](../../blender/enemies/problem_vague_spec/v01/problem_vague_spec_v01.blend) | [GLB](../../assets/runtime/enemies/problem_vague_spec_v01.glb) |
| Missing Details | 11 | 7 | v01 r13 | [Blender](../../blender/enemies/problem_missing_details/v01/problem_missing_details_v01.blend) | [GLB](../../assets/runtime/enemies/problem_missing_details_v01.glb) |
| Dead Code | 6 | 6 | v01 r7 | [Blender](../../blender/enemies/problem_dead_code/v01/problem_dead_code_v01.blend) | [GLB](../../assets/runtime/enemies/problem_dead_code_v01.glb) |
| Spaghetti Code | 5 | 5 | v01 r12 | [Blender](../../blender/enemies/problem_spaghetti_code/v01/problem_spaghetti_code_v01.blend) | [GLB](../../assets/runtime/enemies/problem_spaghetti_code_v01.glb) |

## What merged

These are accepted mappings for this roster, not an exhaustive palette for future
designs. Reuse suitable values and extend the family or an asset-local palette
when identity, material or readability benefits. The eight-colour trial is
historical; seven remains an explicit decision for the two refined models, not
a universal production cap. The current [visual guide](Visual_Asset_Guide.md)
owns this reusable-colour policy.

- Shared deep navy, navy ink, blue steel and slate replace neighbouring dark
  blues, violet charcoals and greys. Lag head/trail shadows share blue steel;
  body shadows/joints share deep navy. Its cyan/ice/blue trails remain distinctive.
- Vague Spec's paper edge shares its paper base, and text lines share limb slate.
  Paper shadow and pale limb panels remain separate. Its joints now share navy ink with the question mark. Its tiny warm marks share
  Spaghetti's orange.
- Missing Details' question mark and visor share deep navy; limb shadows and
  joints share slate; eye/core/edge base colour shares Bug's warning red. Its three
  yellow note/fold colours remain distinct. The separate eye emission image,
  emission factor, UV channel and sampling are exactly preserved.
- Dead Code shares paper white, warning red and blue-grey supporting colours.
  Its raised braces, red X and recessed panels retain contrast.
- Spaghetti only changes its dark punctuation to shared navy ink. Lime, teal,
  orange and the orange shadow stay unchanged.

The cap measures **distinct rendered base RGB values**, not role names. All 48
semantic roles remain independently editable, with 27 values changed. Duplicate
roles keep their padded texture rectangles and UVs; the board deduplicates their
visible chips and lists shared role names on hover. Bug also retains an unused
legacy `shell_light` recipe definition, which is not a rendered texture role.

This is a visual/authoring simplification. Each GLB remains self-contained with
one material and a tiny embedded base atlas. Atlas sizes and draw calls do not
decrease. The initial alignment grew exported files by 176–180 bytes each; no memory/FPS saving is claimed.

## Review and verification

Compared the candidate on registered GLBs at authored metre scale, then inspected
the delivered close isometric/reverse evidence, shared-scale colour/grayscale
board and Inspector phone Rest/Move at 0.5 seconds. Question marks, red X, cyan
trails and the warning badge remain readable. Missing Details retains its visible
fold and eye separation; Lag's pale trail tips stand out against the darker body.
The rear supporting forms stay distinct and no new texture bleeding was seen.

Guarded exports passed all five asset contracts. Exact parity checks confirm
unchanged geometry, topology, normals, UVs, rig, skinning, morphs, anchors, animation
channels/timing, material settings and auxiliary emission textures. All 48 declared
texture roles were checked in the actual Inspector against the shared policy;
each delivered palette satisfies the cap. Six current runtime hashes matched.
The before/aligned controls, deduplicated colour counts and 390 px board layout
passed with no browser page errors. Each changed asset has a current, hash-bound
author review; previous source/runtime milestones are retained.

Grayscale checks luminance only. Final gameplay-camera and colour-vision-deficiency
validation remain separate, as does acceptance of existing animation design.

- [Interactive comparison](reviews/problems-palette-2026-09-27/index.html)
- [Aligned board](reviews/problems-palette-2026-09-27/after-board.png)
- [Close/reverse export evidence](reviews/problems-palette-2026-09-27/close-review.png)
- [Phone Rest/Move evidence](reviews/problems-palette-2026-09-27/phone-review.png)
- [Counts and mappings](reviews/problems-palette-2026-09-27/audit.json)
- [Parity and Inspector checks](reviews/problems-palette-2026-09-27/verification.json)

Regenerate: `node tools/asset-inspector/review-problem-palettes.mjs --delivered`.
Verify: `node tools/asset-inspector/verify-problem-palettes.mjs`.
The retained baseline restores original swatches on unchanged current geometry;
it does not serve old unregistered GLBs. Recipes use current manifest colours;
ordinary source edits use guarded export and future builds retain palette delivery.

## Seven-colour follow-up

The user explicitly requested seven colours for Missing Details and Vague Spec.
Vague Spec r9 merges joint deep navy #192E46 into existing navy ink #233B58.
Missing Details r13 merges eye-edge red shadow #9B1524 into existing warning red
#E51C30. This removes one distinct base value from each without flattening paper
shadows, pale limb panels or the yellow fold. Separate eye emission stays exact.
The retained before_seven_colours milestones preserve the eight-colour sources
and GLBs. The main board
continues to compare against the original pre-alignment palettes. All other enemy
exports remain unchanged in this follow-up. The family still uses 22 values because
the two merged-away values remain in use by other characters.

## Accepted production state and cleanup

All six current source/export revisions above are accepted for the displayed
palette. Read-only Blender checks verify packed swatch pixels against the shared
definitions, material bindings, metric scale and authoritative source hashes.
Fresh guarded runtime checks verify current contracts, scale/grounding, anchors,
budgets, animations and texture colours. Source and runtime payloads did not change
during cleanup. See [the final alignment audit](../../assets/problems_palette_alignment.json).

Removed the retired Bug palette sample and its catalog entry, disposable staging
exports for these six assets, and redundant loose before/after card images. The
comparison embeds its images and remains available; regeneration no longer writes
those duplicate files. Production sources, recipes, final validation evidence,
accepted reviews and named rollback milestones remain. The Inspector regression
test now uses production assets, so removing the sample does not remove coverage.

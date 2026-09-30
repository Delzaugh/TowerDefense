# Roster colour consistency — 26 September 2026

User direction: keep character identities; unify supporting neutrals and small
accents. [Shared colours](Shared_Palette.json) are an authoring reference, not a
global colour substitution table. The [interactive comparison](reviews/palette-2026-09-26/index.html)
shows actual GLBs at common authored scale, with before/refined and grayscale controls.
Serve it through the Asset Inspector at `/roster-palette.html`.

## Findings

The existing muted campus and brighter characters already form a coherent world.
Preserve that hierarchy. The six production Problems have intentionally different
colour stories; recolouring all of them red would discard their identities.
Bug retains cobalt/red, Lag Spike violet-charcoal/cyan, Vague Spec pale paper,
Missing Details yellow paper/red eyes, Dead Code slate/coral, and Spaghetti
lime/orange/teal. Coding Task's cream card, purple badge and blue fold remain.

Developer, Linter and Security have equivalent screen and cyan accent roles with
small numerical drift. Align these, and use Linter's graphite for Developer's
casing. Preserve Security's navy, blue shell and cool white trim; Developer's
warm ivory; the three lens treatments; human skin/hair/clothing; and brand art.
Warm and cool whites are useful material differences, not defects.

Campus architecture, walkways and teal foliage already reuse exact swatches.
New biome scenery adds restrained sage, stone, sand and wood, which should remain
local variations. Imported KayKit atlases lack semantic swatch mappings; do not
guess their meaning from RGB or apply a whole-material tint to force conformity.

The same role name can mean different things: campus tile `chalk` is not building
`chalk`, and enemy `shell` is not Copilot `shell`. Map colours by intended material
and role, never by a global string replacement.

The first pass found Bug paler than the newer Copilots in the matched lineup.
Its uniform white emission (`[0.08, 0.08, 0.08]`) lifted dark colours and desaturated
the red/blue relationship. The user requested continuation on this material
follow-up. On 2026-09-27, compared 0.08, 0.02 and 0 emission under both Inspector
lighting setups, at close range and small scale against light/slate grounds.
Zero emission gave clearer facets, dark joint definition and clean red accents.

Bug v01 r12 removes uniform emission. Palette image bytes, all swatch values,
roughness 0.72 and metallic 0 remain unchanged. The entire GLB binary payload is
identical, and its JSON differs only by the removed emission factor; geometry,
rig, anchors, clips and lifecycle settings are preserved. Spawn/Resolve remain
presentation-owned. Source and recipe both retain the matte setting. The board's
Before view restores Bug's old emission; Refined shows the delivered r12 GLB.
The retained three-way [material comparison](../../blender/enemies/problem_bug/v01/validation/material/comparison.png)
records the exploration; final hash-bound evidence lives beside the Bug source.

## Delivered pilot

| Asset | Role | Before | Refined |
| --- | --- | --- | --- |
| Developer | graphite | `#364352` | `#333E48` |
| Linter | screen | `#031D28` | `#041D2A` |
| Linter | cyan | `#00E6F4` | `#00E5EF` |
| Security | screen | `#071A2B` | `#041D2A` |
| Security | cyan | `#00E8ED` | `#00E5EF` |

These are intentionally subtle changes, not a visible redesign. They establish
specific shared values for subsequent authoring. Current deliveries: Developer
v01 r13, Linter v01 r15, Security v01 r18. Source/runtime paths, hashes and actual
material values are captured in the [inventory](reviews/palette-2026-09-26/inventory.json).

The original base image was also used by emission. The new packed base image
preserves the original packed emission image and its sampler. Exported geometry,
indices, normals, all old UV channels, skinning, morphs, anchors, nodes and animation
tracks match exactly. Material response and auxiliary emission image bytes also
match. GLB increases are 424, 428 and 424 bytes respectively; all three remain
within their existing two-texture budgets. This is a consistency improvement,
not a performance optimization.

Source milestones named `before_shared_palette` retain the previous deliveries.

| Model | Editable source | Delivered GLB |
| --- | --- | --- |
| Developer | [Blender](../../blender/towers/copilot_developer/v01/copilot_developer_v01.blend) | [GLB](../../assets/runtime/towers/copilot_developer_v01.glb) |
| Linter | [Blender](../../blender/towers/copilot_linter/v01/copilot_linter_v01.blend) | [GLB](../../assets/runtime/towers/copilot_linter_v01.glb) |
| Security | [Blender](../../blender/towers/copilot_security/v01/copilot_security_v01.blend) | [GLB](../../assets/runtime/towers/copilot_security_v01.glb) |
| Bug | [Blender](../../blender/enemies/problem_bug/v01/problem_bug_v01.blend) | [GLB](../../assets/runtime/enemies/problem_bug_v01.glb) |

Each asset has a guarded validation report, exact parity report and a separate
hash-bound visual review. The board's Before mode restores the retained original
swatches on the current identical geometry; Refined mode shows current exports.
The board itself never writes assets. Security's retained-source recipe reapplies
its current palette contract; Developer's recipe already reads those colours
from the manifest. Linter remains an authoritative manual Blender source.

## Review scope and remaining checks

The inventory covers 142 registered versions. The visual board samples 21 assets:
four Copilot-family models, all six production Problems, Coding Task and four
character towers, plus six scenery references. Legacy variants and all imported
modules are inventoried, not individually visually approved. No Product model is
registered in this snapshot. The comparison experiment is excluded from the
production enemy sample.

Character cards share a 6 m vertical orthographic frame; scenery shares 16 m,
with the larger Utility Yard using 30 m to avoid clipping. Models are translated
for composition but never rescaled. The five-character lineup preserves authored
relative size against both light and slate grounds. These are controlled review
fixtures, not the final gameplay camera or a complete gameplay scene.
An additional common-scale isometric scene places those five characters beside
the actual lab and two trees, demonstrating the light architecture, quiet foliage
and brighter character accents together. It uses a 21 m vertical frame and keeps
the building fully in view.

The final asset review includes close isometric, reverse and phone-size views.
Shell/face separation and cyan marks remain readable; Developer's darker neutral
does not close the rear vent or goggle boundaries. No new colour bleed was seen.
Geometry parity supports retaining previous construction and animation decisions;
this pass does not re-approve their entire animation design.

Colour alone does not distinguish allegiance: Security and Bug share blue;
Lag Spike and friendly displays share cyan; Spaghetti and Linter share lime.
Retain silhouettes, characteristic motion and independent gameplay UI cues.
Grayscale helps expose weak luminance separation but is not a colour-vision
simulation. Review the actual gameplay lighting/camera and common colour-vision
deficiencies when those presentation choices are settled. User artistic acceptance
of this specific pilot remains pending; it is distinct from the authorized direction.

Regenerate the read-only board with
`node tools/asset-inspector/review-roster-palette.mjs`. It loads only registered
GLBs through the shared Inspector server and audits current source/runtime hashes.

## Follow-up: Problems, 2026-09-27

The delivered [Problems iteration](Problems_Palette_Review.md) supersedes the earlier untouched enemy palettes: six production enemies use 22 shared family values instead of 48, with 5–7 distinct base colours each. Five sources/GLBs changed; Bug remains the palette reference. Lag's violet supporting neutrals are now blue-grey, Dead Code's coral X shares Bug red, and Vague/Missing redundant shades are merged. Distinct cyan, cobalt, yellow and lime/teal identities remain. The roster now opens on Refined exports and shows unique delivered swatches.

The user accepted the six-Problem palette on 2026-09-27. The obsolete Bug palette sample and disposable staging exports were removed; source/runtime alignment is recorded in assets/problems_palette_alignment.json.

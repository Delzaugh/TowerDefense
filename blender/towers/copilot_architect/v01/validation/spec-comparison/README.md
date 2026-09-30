# Keystone Field Architect: specification versus delivered model

The selected compact Field Architect has replaced the older Weaver model. The deliverable retains the deep faceted body, low cyan-eyed display, warm ivory frame, triangular drafting openings, blue paper roll, orange drafting pencil and the application/database/service diagram. It is a model-stage delivery; user acceptance of this built revision is still pending.

## Evidence

- [Six-angle visual comparison](spec-vs-model-six-angles.png)
- [Silhouette overlays](silhouette-overlays.png)
- [Accessory and symbol comparison](spec-vs-model-details.png)
- [Actual model, three-quarter view](hero.png)
- [Actual model, underside](underside.png)
- [Actual model at 128 pixels](small.png)
- [Phone-width Inspector view](../inspector/phone.png)
- [Geometry audit and component triangle counts](../geometry_audit.json)
- [Measured comparison data](comparison_metrics.json)
- [Render cameras and delivered file identity](cameras.json)

The selected concept is the primary design authority. The seven generated specification boards expand it into modeling references. They are illustrations, including the inferred rear, rather than engineering drawings or renders of the production mesh. The comparisons keep reference crops separate from actual GLB renders.

## Shape comparison

The initial rebuild was too tall and narrow. The finished shell is wider through the middle, the crown is lower, and the body tapers toward the bottom and rear. The front display is bowed in both horizontal and vertical directions. The side frame follows a curved sweep instead of a vertical extrusion, and its two openings remain visible against the teal shell.

For silhouette diagnostics, each complete outline is scaled uniformly to 260 pixels high and center-aligned. Neither axis is stretched. Black silhouettes from the shape-study sheet are compared with masks rendered from the GLB. Differences in the illustrated cameras and projection remain, so overlap is an approximate diagnostic, not a percentage of artistic accuracy.

| View | Outline overlap | Model width/height difference | Observation |
| --- | ---: | ---: | --- |
| Front | 91.4% | +0.2% | Overall width is close; the production forehead and face corners remain more angular. |
| Front-left | 89.3% | -5.4% | Body, low face, roll and pencil occupy the intended regions; the illustrated cheek frame is rounder. |
| Left | 88.0% | -5.9% | Clear front-to-back volume and tapered underside; the pencil and both triangular openings are present. |
| Back | 87.2% | +8.7% | Production outline is broader; accessory placement and the illustrated camera contribute. The rear stays a quiet continuation of the faceted shell. |
| Back-right | 89.0% | +3.3% | Deep rear shell, upright paper roll and fitted cradle remain distinct. |
| Right | 88.5% | +2.0% | Blueprint pod and forward display projection are preserved; the production flap is a rigid diagonal panel. |

## Detail-by-detail assessment

| Reference feature | Delivered construction and inspection |
| --- | --- |
| Compact faceted core | Nine changing cross sections; 284 triangles in the main shell. Front, side, top and underside views confirm depth and taper. No flat extruded plate body. |
| Low dark display with two upright eyes | Bowed display surface, capsule eye outlines and a substantial ivory brow/cheek rim. Cyan uses an unlit palette material for stable small-scale contrast. Concept bloom is not baked into the asset. |
| Ivory drafting structure | Curved, closed, beveled frame with two triangular openings on the pencil flank. The blueprint flank has a single cradle rail, keeping the paper symbol exposed. |
| Blueprint pod | Royal-blue outer paper wall, modeled spiral cut edge, two ivory retaining bands, backing and a short blue flap. The final flap is offset clear of the cylinder; the complete one-to-two diagram is visible in its close-up. |
| Drafting pencil | Six-sided orange shaft, ivory cap, cream wood cone, dark graphite tip and ivory clip. The fitted teal dock includes two cyan indicators. The action anchor is at the actual pencil tip. |
| Application tile | Shallow orange beveled plate with four ivory panes. |
| Database tile | Ivory plate with a teal elliptical top and two curved bands. |
| Service tile | Ivory plate with one root, three branches and three outlined child nodes. |
| Diagram connections | Two cyan surface paths link the upper application tile to the lower pair. All icons and paths are geometry; only solid colors come from the palette. |
| Playable compactness | Every tool stays fitted to the body. No desk, loose sheet, limbs, goggles, tall fin or separate floor prop was introduced. |

## Triangle use and delivery checks

| Area | Triangles |
| --- | ---: |
| Primary shell, display, face rim and eyes | 602 |
| Fitted ivory side structure | 704 |
| Application diagram and paths | 390 |
| Blueprint roll, cradle and plan glyph | 700 |
| Pencil, dock, clip and indicators | 256 |
| **Total** | **2,652** |

The model uses two meshes, two materials and one packed/embedded 48 × 8 palette texture. Dimensions are approximately 3.598 × 2.500 × 2.794 world units (width, height, depth). The asset-specific ceiling is 4,500 triangles. The broad core takes 284 triangles; the extra geometry is concentrated in visible curved frames, paper edge, small bevels and recognizable tools. The spiral is modeled only near the exposed top rather than continuing invisibly through the whole cylinder.

The source audit found no zero-area triangles and no missing named parts. The guarded exporter passed grounding, scale, dimensions, anchors, embedded resources and budgets with no warnings. The Inspector loaded the same GLB hash as the review, with no browser errors. At phone width the face, three top tiles and opposite tools remain readable. At the smallest view the fine line symbols become marks, while the larger role cues survive.

The second author pass checked six directions, actual silhouettes, each accessory close-up, the top, underside and phone/small views. It corrected frame creasing and joins, the paper-symbol occlusion, repeated capsule endpoints and one tiny degenerate bevel triangle. The finished frame is cleaner but deliberately more angular than the painted reference; paper shading, soft ambient occlusion and cyan bloom also differ from the illustration. This comparison does not claim a pixel-exact replica.

No clips or rig were added. Animation remains pending until separately authorized. Technical validation and this author review do not substitute for the user's artistic acceptance.

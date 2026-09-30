# Spec-pack generation prompts

Tool/mode: built-in image_gen.imagegen. All final images generated at native 1536 x 1024 unless verified otherwise. No image was upscaled. Original approved concept remains authoritative when generated secondary views disagree. All rear reconstructions and wireframes are illustrative.

## 1. architect-six-angle-sheet.png

Inputs:
- C:/Users/jonas/Documents/ChatGPT/Tower/blender/towers/copilot_architect/v01/references/keystone_placeable_2026-09-27/keystone_field_architect.png

```text
Use case: stylized-concept. Create an ENLARGED SIX-ANGLE reference sheet of the supplied selected Architect Copilot image. The input is the direct design reference. Landscape 3:2, preferably 3072 x 2048 useful native resolution. Spacious 3-column by 2-row grid. Small labels below each view only: top row "FRONT", "FRONT-LEFT", "LEFT"; bottom row "BACK", "BACK-RIGHT", "RIGHT". Every model fills 80 percent of its cell with generous safety margins. Dark navy background, thin subtle separators, crisp neutral studio lighting, soft contact shadows, no title, scenery, statistics or other panels.

Use ONE coherent object rotated between views. True front and rear, true lateral profiles, near-orthographic projections. The front-left and left views MUST show the stylus side and face toward page LEFT. Right profile MUST face page RIGHT and show the blueprint. Do not mirror accessories. Keep matching scale and camera elevation across all six, enough shallow elevation to show a little upper shell while preserving real profiles. Back must hide the eyes. Far-side accessories are occluded unless their ends naturally project beyond body contour. The rear shell is a simple low-poly continuation, not an excuse to invent machinery.

SHARED DESIGN CONTRACT: depict exactly the user's approved compact KEYSTONE / FIELD ARCHITECT concept. Broad compact hovering head-body, deep teal faceted upper shell sweeping back and tapering into a narrower lower keel; warm ivory arch around dark navy face; exactly two bright cyan vertical capsule eyes. Low-poly matte materials and broad bevels. No limbs, goggles, hat, fins, roof, desk, unfolded blueprint, loose props, extra gadgets, physical base or new gameplay effects.
ASYMMETRY LOCK: in a direct FRONT view, the single royal-blue rolled blueprint is on the viewer's LEFT (character's right); the single short orange drafting stylus and ivory triangular set-square side frame are on the viewer's RIGHT (character's left). Never swap or duplicate them. For the front-left three-quarter view the face points toward page LEFT and the STYLUS is on the visible near side at page right. LEFT profile faces page LEFT and clearly shows the stylus while the far-side blueprint is occluded. BACK view reverses screen order: stylus at page LEFT, blueprint at page RIGHT. Back-right three-quarter exposes blueprint side. RIGHT profile faces page RIGHT and shows the blueprint while hiding far-side stylus.
BLUEPRINT ASSEMBLY: one vertical tightly rolled royal-blue paper cylinder with warm ivory spiral visible on its upper end, fitted upright against the flank in ivory cradle/bands; one short hanging blue flap follows the casing, with a white simple one-to-two branching square-node diagram. Not unrolled, no floating sheet.
STYLUS ASSEMBLY: one short chunky orange hexagonal drafting pencil with ivory rear cap, pale wood cone, dark graphite tip, seated diagonally along the other flank in its fitted teal recess and ivory clips; point faces down/forward but stays above chin bottom. Adjacent thick ivory structural frame has large triangular recess/opening; preserve teal backing where present and actual view-dependent gaps, not arbitrary see-through holes.
TOP DIAGRAM ASSEMBLY: exactly three shallow raised rounded-square tiles follow the sloped top shell: one ORANGE application tile at upper/rear apex with FOUR white square window panes; two IVORY tiles below it toward front, database on the BLUEPRINT side, service hierarchy on the STYLUS side. Database icon dark teal, two or three clear stacked-disc bands; service icon dark teal, one square branching to three lower squares. Two broad cyan bent connector paths from app tile to the two ivory tiles. One diagram only; do not multiply it on rear or side.
Maintain the source's substantial body depth and short tightly fitted accessories, silhouette dominated by core. No new fasteners, handles, bolts, straps, mechanical interiors, measurements or construction claims. Unseen rear is a restrained conceptual continuation of teal faceted shell with existing ivory side bands; add no new rear features. Views are illustrative concept reconstructions, not verified 3D geometry.
Render full solid model forms, using the exact reference. The original concept remains authoritative; reveal the existing design, do not redesign it.
```

## 2. architect-six-angle-sheet.png — profile correction

Inputs:
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-d6274efe-42bd-48c6-bcc7-fc110780f63c.png
- C:/Users/jonas/Documents/ChatGPT/Tower/blender/towers/copilot_architect/v01/references/keystone_placeable_2026-09-27/keystone_field_architect.png

```text
Use case: precise-object-edit. Image 1 is the six-angle sheet to correct. Image 2 is the approved original design reference only. Make ONE localized correction: fix the camera orientation of the LEFT cell (top-right) and RIGHT cell (bottom-right). Currently they still show a sliver of the front screen and cyan eye. Rotate those two models into EXACT 90-degree lateral orthographic profiles: LEFT faces page left with stylus flank fully side-on; RIGHT faces page right with blueprint flank fully side-on. The frontal display plane must read edge-on; no cyan eye should be visible. Preserve body depth, outline, parts, accessory placement and part proportions. The body must still have its deep tapered rear. Do not flatten its volume.
Preserve the other FOUR panels pixel-for-pixel in layout and as closely as possible in content: FRONT, FRONT-LEFT, BACK, BACK-RIGHT. Keep the same dark navy layout, six labels, canvas, scale, lighting and margins. Do not redesign the asset, invent components, swap its accessories or change symbols. Blueprint has white branching symbol, stylus short and seated, same top diagram.
This is a correction of the two profile projections, not a new design.
```

## 3. architect-spec-sheet.png

Inputs:
- C:/Users/jonas/.codex/skills/model-spec-sheet-skill/assets/model-spec-sheet-template.png
- C:/Users/jonas/Documents/ChatGPT/Tower/blender/towers/copilot_architect/v01/references/keystone_placeable_2026-09-27/keystone_field_architect.png
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-83eade30-50a1-4a98-b1ed-5fa85fbf81af.png

```text
Use case: precise-object-edit. Input 1 is the MODEL SPEC SHEET TEMPLATE and is the DIRECT EDIT TARGET. Input 2 is the approved Architect Copilot DESIGN source. Input 3 is the coordinated six-angle reference for rotation and side consistency. Edit template 1, filling its existing panels ONLY. PRESERVE its 1536 x 1024 canvas, exact panel geometry, dark navy background, borders, spacing, typography hierarchy, labels and five swatch positions. No redesign, new sections or Game Name.

Header: "Architect Copilot". Subtitle: "Keystone — compact field architect". Top-right: keep small "Asset Type" heading and put "Tower" beneath it.

Top row: six views in the fixed template cells, labels already present: Front, Front-Left, Left, Back, Back-Right, Right. Use the matching views from input 3, scaled down with safe margins, coherent single model. Front-left face points page left and exposes stylus. Left profile faces page left, stylus visible. Right profile faces page right, blueprint visible. Profiles have face edge-on, no eyes visible. Front two eyes. Back hides eyes entirely. Same view scale, hover clearance, near-orthographic neutral lighting. No scenic props in these cells.

In-Game View panel: illustrative very ZOOMED-OUT elevated isometric game view of a welcoming stylized low-poly green technology campus, pale paths, scattered low-poly trees and pale infrastructure. ONE exact Architect Copilot is SMALL, about 6 percent of this panel's height, on clear grass beside the path. Lots of surrounding environment establishes actual intended gameplay scale. No huge hero in this panel, no labels over the landscape.

Wireframe panel: use a clearly ILLUSTRATIVE economical white wireframe approximation of the same compact body and fitted accessories on the navy panel. Small text inside bottom of this panel: "Illustrative". Do not claim verified topology.

Texture / UV: KEEP THE TEMPLATE GRID COMPLETELY EMPTY. No texture map or UV islands are available for this new design. Retain original coordinates.

Model Info: exactly "Triangles: -" "Vertices: -" "Texture: -" "Materials: -" "Target: Mobile". Do not fill numeric production data from any other model.
Color Palette: five representative solid swatches ONLY in existing slots: warm ivory, teal, dark navy, cyan, orange. The blue paper remains blue in the images; these five slots are representative, not an exhaustive palette or production colour-count limit.
Notes: exactly three short bullets, fitting the panel: "Compact fitted tools"; "No limbs or goggles"; "Illustrative concept views".

SHARED DESIGN CONTRACT: depict exactly the user's approved compact KEYSTONE / FIELD ARCHITECT concept. Broad compact hovering head-body, deep teal faceted upper shell sweeping back and tapering into a narrower lower keel; warm ivory arch around dark navy face; exactly two bright cyan vertical capsule eyes. Low-poly matte materials and broad bevels. No limbs, goggles, hat, fins, roof, desk, unfolded blueprint, loose props, extra gadgets, physical base or new gameplay effects.
ASYMMETRY LOCK: in a direct FRONT view, the single royal-blue rolled blueprint is on the viewer's LEFT (character's right); the single short orange drafting stylus and ivory triangular set-square side frame are on the viewer's RIGHT (character's left). Never swap or duplicate them. For the front-left three-quarter view the face points toward page LEFT and the STYLUS is on the visible near side at page right. LEFT profile faces page LEFT and clearly shows the stylus while the far-side blueprint is occluded. BACK view reverses screen order: stylus at page LEFT, blueprint at page RIGHT. Back-right three-quarter exposes blueprint side. RIGHT profile faces page RIGHT and shows the blueprint while hiding far-side stylus.
BLUEPRINT ASSEMBLY: one vertical tightly rolled royal-blue paper cylinder with warm ivory spiral visible on its upper end, fitted upright against the flank in ivory cradle/bands; one short hanging blue flap follows the casing, with a white simple one-to-two branching square-node diagram. Not unrolled, no floating sheet.
STYLUS ASSEMBLY: one short chunky orange hexagonal drafting pencil with ivory rear cap, pale wood cone, dark graphite tip, seated diagonally along the other flank in its fitted teal recess and ivory clips; point faces down/forward but stays above chin bottom. Adjacent thick ivory structural frame has large triangular recess/opening; preserve teal backing where present and actual view-dependent gaps, not arbitrary see-through holes.
TOP DIAGRAM ASSEMBLY: exactly three shallow raised rounded-square tiles follow the sloped top shell: one ORANGE application tile at upper/rear apex with FOUR white square window panes; two IVORY tiles below it toward front, database on the BLUEPRINT side, service hierarchy on the STYLUS side. Database icon dark teal, two or three clear stacked-disc bands; service icon dark teal, one square branching to three lower squares. Two broad cyan bent connector paths from app tile to the two ivory tiles. One diagram only; do not multiply it on rear or side.
Maintain the source's substantial body depth and short tightly fitted accessories, silhouette dominated by core. No new fasteners, handles, bolts, straps, mechanical interiors, measurements or construction claims. Unseen rear is a restrained conceptual continuation of teal faceted shell with existing ivory side bands; add no new rear features. Views are illustrative concept reconstructions, not verified 3D geometry.
Final image must be a completed version of the supplied template at 1536x1024. No unsupported stats, texture sizes, material counts or dimensions. Preserve all panel labels and avoid clipping.
```

## 4. architect-anatomy-sheet.png

Inputs:
- C:/Users/jonas/Documents/ChatGPT/Tower/blender/towers/copilot_architect/v01/references/keystone_placeable_2026-09-27/keystone_field_architect.png
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-83eade30-50a1-4a98-b1ed-5fa85fbf81af.png

```text
Use case: stylized-concept. Create the EXTERNAL ANATOMY SHEET for the selected Architect Copilot. Image 1 is the approved design authority. Image 2 is supporting six-angle consistency reference. Landscape 3:2, preferably 3072x2048 native if available, dark navy presentation coordinated with the six-angle sheet. Large elevated front-three-quarter assembled hero on the left about 65 percent of width, face pointing a little page-left with stylus-side frame fully visible. Two generous bordered close-ups stacked at right: upper close-up of the three-tile top diagram and cyan connectors following the sloped teal casing; lower close-up of docked orange stylus and the adjacent ivory triangular set-square frame, showing bevels and teal backing. All refer to the exact same object.
Small title at top "ARCHITECT COPILOT / ANATOMY", subtitle "Illustrative external construction".
Exactly SIX numbered callouts on the main hero, with accurate noncrossing leaders and ample readable placement:
01 "Faceted core" ending on exposed teal shell;
02 "Ivory drafting frame" ending on a cream triangular frame bar, not empty gap;
03 "Cyan eyes" ending on a cyan eye surface;
04 "Blueprint pod" ending on the blue rolled-plan side assembly;
05 "Docked stylus" ending on the orange pencil body;
06 "Application diagram" ending on the orange app tile.
Inset captions ONLY "Application diagram" and "Stylus and drafting frame". Do not duplicate a full list of labels inside close-ups.
Show genuine layered seating, thickness and overlaps clearly, without adding bolts, mechanisms, invented internals or exploded construction. Front reference is authoritative; accessory identity and sides fixed.

SHARED DESIGN CONTRACT: depict exactly the user's approved compact KEYSTONE / FIELD ARCHITECT concept. Broad compact hovering head-body, deep teal faceted upper shell sweeping back and tapering into a narrower lower keel; warm ivory arch around dark navy face; exactly two bright cyan vertical capsule eyes. Low-poly matte materials and broad bevels. No limbs, goggles, hat, fins, roof, desk, unfolded blueprint, loose props, extra gadgets, physical base or new gameplay effects.
ASYMMETRY LOCK: in a direct FRONT view, the single royal-blue rolled blueprint is on the viewer's LEFT (character's right); the single short orange drafting stylus and ivory triangular set-square side frame are on the viewer's RIGHT (character's left). Never swap or duplicate them. For the front-left three-quarter view the face points toward page LEFT and the STYLUS is on the visible near side at page right. LEFT profile faces page LEFT and clearly shows the stylus while the far-side blueprint is occluded. BACK view reverses screen order: stylus at page LEFT, blueprint at page RIGHT. Back-right three-quarter exposes blueprint side. RIGHT profile faces page RIGHT and shows the blueprint while hiding far-side stylus.
BLUEPRINT ASSEMBLY: one vertical tightly rolled royal-blue paper cylinder with warm ivory spiral visible on its upper end, fitted upright against the flank in ivory cradle/bands; one short hanging blue flap follows the casing, with a white simple one-to-two branching square-node diagram. Not unrolled, no floating sheet.
STYLUS ASSEMBLY: one short chunky orange hexagonal drafting pencil with ivory rear cap, pale wood cone, dark graphite tip, seated diagonally along the other flank in its fitted teal recess and ivory clips; point faces down/forward but stays above chin bottom. Adjacent thick ivory structural frame has large triangular recess/opening; preserve teal backing where present and actual view-dependent gaps, not arbitrary see-through holes.
TOP DIAGRAM ASSEMBLY: exactly three shallow raised rounded-square tiles follow the sloped top shell: one ORANGE application tile at upper/rear apex with FOUR white square window panes; two IVORY tiles below it toward front, database on the BLUEPRINT side, service hierarchy on the STYLUS side. Database icon dark teal, two or three clear stacked-disc bands; service icon dark teal, one square branching to three lower squares. Two broad cyan bent connector paths from app tile to the two ivory tiles. One diagram only; do not multiply it on rear or side.
Maintain the source's substantial body depth and short tightly fitted accessories, silhouette dominated by core. No new fasteners, handles, bolts, straps, mechanical interiors, measurements or construction claims. Unseen rear is a restrained conceptual continuation of teal faceted shell with existing ivory side bands; add no new rear features. Views are illustrative concept reconstructions, not verified 3D geometry.
No engineering measurements, UVs, counts, new accessories, fabricated functions, texture noise, cropped shapes or crossing leaders.
```

## 5. architect-shape-study.png

Inputs:
- C:/Users/jonas/Documents/ChatGPT/Tower/blender/towers/copilot_architect/v01/references/keystone_placeable_2026-09-27/keystone_field_architect.png
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-83eade30-50a1-4a98-b1ed-5fa85fbf81af.png

```text
Use case: stylized-concept. Create a SHAPE STUDY for the approved Architect Copilot. Input 1 is original design authority. Input 2 is six-view shape/orientation guide. Landscape 3:2, preferably 3072x2048 useful native resolution. Clean warm off-white background. TWO perfectly aligned rows of SIX equally sized views with ample margin: Front, Front-Left, Left, Back, Back-Right, Right. Upper row heading "SILHOUETTES"; lower heading "CONTOURS". Small angle labels under each object. No other title or prose.

Upper row: strictly uniform SOLID BLACK external silhouettes. No white internal decorative outlines, symbols, eyes, grey facets, shading or highlights. Ivory frame recesses with solid teal shell behind them are SOLID BLACK too, not holes. Preserve only genuine background-visible gaps. Clearly distinguish the short pencil protrusion on one side and upright blueprint-roll protrusion on the other.
Lower row: EXACT MATCHING outlines and orientation to silhouettes above. White interiors, crisp black contour drawings: heavier outer boundary and thin simple lines for main part boundaries, three tiles, blueprint cradle/flap, stylus socket, cream frame and face. No interior grey fill, shading, hatching, dense wireframe triangulation, dimensions or colour. Simplify tiny icons; shape and silhouette are the focus. Each lower outline must match its upper partner in width, height, angle, accessory count and asymmetry. Do not create six separate designs.

Use the proper matching source view from input 2 for every column. In FRONT, roll at page-left, pencil page-right. FRONT-LEFT looks toward page-left, pencil-side visible. LEFT faces page-left, face edge-on, pencil side. BACK no front features, roll at page-right and pencil page-left. BACK-RIGHT exposes blueprint side. RIGHT faces page-right, face edge-on, roll side. No mirrored accessories.
SHARED DESIGN CONTRACT: depict exactly the user's approved compact KEYSTONE / FIELD ARCHITECT concept. Broad compact hovering head-body, deep teal faceted upper shell sweeping back and tapering into a narrower lower keel; warm ivory arch around dark navy face; exactly two bright cyan vertical capsule eyes. Low-poly matte materials and broad bevels. No limbs, goggles, hat, fins, roof, desk, unfolded blueprint, loose props, extra gadgets, physical base or new gameplay effects.
ASYMMETRY LOCK: in a direct FRONT view, the single royal-blue rolled blueprint is on the viewer's LEFT (character's right); the single short orange drafting stylus and ivory triangular set-square side frame are on the viewer's RIGHT (character's left). Never swap or duplicate them. For the front-left three-quarter view the face points toward page LEFT and the STYLUS is on the visible near side at page right. LEFT profile faces page LEFT and clearly shows the stylus while the far-side blueprint is occluded. BACK view reverses screen order: stylus at page LEFT, blueprint at page RIGHT. Back-right three-quarter exposes blueprint side. RIGHT profile faces page RIGHT and shows the blueprint while hiding far-side stylus.
BLUEPRINT ASSEMBLY: one vertical tightly rolled royal-blue paper cylinder with warm ivory spiral visible on its upper end, fitted upright against the flank in ivory cradle/bands; one short hanging blue flap follows the casing, with a white simple one-to-two branching square-node diagram. Not unrolled, no floating sheet.
STYLUS ASSEMBLY: one short chunky orange hexagonal drafting pencil with ivory rear cap, pale wood cone, dark graphite tip, seated diagonally along the other flank in its fitted teal recess and ivory clips; point faces down/forward but stays above chin bottom. Adjacent thick ivory structural frame has large triangular recess/opening; preserve teal backing where present and actual view-dependent gaps, not arbitrary see-through holes.
TOP DIAGRAM ASSEMBLY: exactly three shallow raised rounded-square tiles follow the sloped top shell: one ORANGE application tile at upper/rear apex with FOUR white square window panes; two IVORY tiles below it toward front, database on the BLUEPRINT side, service hierarchy on the STYLUS side. Database icon dark teal, two or three clear stacked-disc bands; service icon dark teal, one square branching to three lower squares. Two broad cyan bent connector paths from app tile to the two ivory tiles. One diagram only; do not multiply it on rear or side.
Maintain the source's substantial body depth and short tightly fitted accessories, silhouette dominated by core. No new fasteners, handles, bolts, straps, mechanical interiors, measurements or construction claims. Unseen rear is a restrained conceptual continuation of teal faceted shell with existing ivory side bands; add no new rear features. Views are illustrative concept reconstructions, not verified 3D geometry.
This is illustrative shape documentation, not a geometry-derived mask.
```

## 6. architect-accessory-blueprint-pod.png

Inputs:
- C:/Users/jonas/Documents/ChatGPT/Tower/blender/towers/copilot_architect/v01/references/keystone_placeable_2026-09-27/keystone_field_architect.png
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-83eade30-50a1-4a98-b1ed-5fa85fbf81af.png

```text
Use case: stylized-concept. Create a detailed ACCESSORY REFERENCE SHEET for the BLUEPRINT POD of the supplied Architect Copilot. Image 1 is the approved source; image 2 establishes consistent side placement. This is the existing fitted equipment, not a new design. Landscape 3:2, preferably 3072x2048 native if available. Coordinated navy background, fine blue borders, clear white and cyan type.
Title "ARCHITECT / BLUEPRINT POD". Subtitle "Illustrative exterior study — hidden mounting omitted".
Large isolated three-quarter EXTERIOR view at left, about 55 percent of sheet, of the complete pod: a single tightly rolled royal-blue paper cylinder, cream spiral at its upper opening, short blue outer flap with exactly one white square branching by a stem into TWO lower squares, two broad ivory cradle/bands embracing it at upper/lower flap edges. Keep original short vertical proportions, warm-ivory rim/edges, no long scroll, no extra caps or fasteners. Known visible teal contact edge may remain, but no invented backing plate or hidden latch.
Right side: top row two supporting views "OUTER VIEW" (near frontal view of blue flap and its symbol) and "TOP" (looking down on visible cream-paper spiral inside blue cylinder and visible cradle edge). Lower right larger fitted-context inset "FITTED ON COPILOT": exact whole approved character from the front with blueprint at viewer LEFT, pencil at viewer RIGHT, correct face and upper-shell diagram. The pod in this inset MUST match the isolated pod.
Three useful callouts on the big view: "Rolled blueprint" to blue cylinder; "Plan symbol" to white branching square glyph; "Ivory cradle" to cream support band. Thin accurate noncrossing leaders. Do not infer detachability, hidden screw hardware, inner electronics, hinges, mounts, measurements, UVs or topology. No exploded view, no backside reconstruction needed.
SHARED DESIGN CONTRACT: depict exactly the user's approved compact KEYSTONE / FIELD ARCHITECT concept. Broad compact hovering head-body, deep teal faceted upper shell sweeping back and tapering into a narrower lower keel; warm ivory arch around dark navy face; exactly two bright cyan vertical capsule eyes. Low-poly matte materials and broad bevels. No limbs, goggles, hat, fins, roof, desk, unfolded blueprint, loose props, extra gadgets, physical base or new gameplay effects.
ASYMMETRY LOCK: in a direct FRONT view, the single royal-blue rolled blueprint is on the viewer's LEFT (character's right); the single short orange drafting stylus and ivory triangular set-square side frame are on the viewer's RIGHT (character's left). Never swap or duplicate them. For the front-left three-quarter view the face points toward page LEFT and the STYLUS is on the visible near side at page right. LEFT profile faces page LEFT and clearly shows the stylus while the far-side blueprint is occluded. BACK view reverses screen order: stylus at page LEFT, blueprint at page RIGHT. Back-right three-quarter exposes blueprint side. RIGHT profile faces page RIGHT and shows the blueprint while hiding far-side stylus.
BLUEPRINT ASSEMBLY: one vertical tightly rolled royal-blue paper cylinder with warm ivory spiral visible on its upper end, fitted upright against the flank in ivory cradle/bands; one short hanging blue flap follows the casing, with a white simple one-to-two branching square-node diagram. Not unrolled, no floating sheet.
STYLUS ASSEMBLY: one short chunky orange hexagonal drafting pencil with ivory rear cap, pale wood cone, dark graphite tip, seated diagonally along the other flank in its fitted teal recess and ivory clips; point faces down/forward but stays above chin bottom. Adjacent thick ivory structural frame has large triangular recess/opening; preserve teal backing where present and actual view-dependent gaps, not arbitrary see-through holes.
TOP DIAGRAM ASSEMBLY: exactly three shallow raised rounded-square tiles follow the sloped top shell: one ORANGE application tile at upper/rear apex with FOUR white square window panes; two IVORY tiles below it toward front, database on the BLUEPRINT side, service hierarchy on the STYLUS side. Database icon dark teal, two or three clear stacked-disc bands; service icon dark teal, one square branching to three lower squares. Two broad cyan bent connector paths from app tile to the two ivory tiles. One diagram only; do not multiply it on rear or side.
Maintain the source's substantial body depth and short tightly fitted accessories, silhouette dominated by core. No new fasteners, handles, bolts, straps, mechanical interiors, measurements or construction claims. Unseen rear is a restrained conceptual continuation of teal faceted shell with existing ivory side bands; add no new rear features. Views are illustrative concept reconstructions, not verified 3D geometry.
Large clean views, recognizable thickness, softly beveled low-poly facets, consistent matte colors and lighting, ample uncut margins.
```

## 7. architect-accessory-stylus.png

Inputs:
- C:/Users/jonas/Documents/ChatGPT/Tower/blender/towers/copilot_architect/v01/references/keystone_placeable_2026-09-27/keystone_field_architect.png
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-83eade30-50a1-4a98-b1ed-5fa85fbf81af.png

```text
Use case: stylized-concept. Create a detailed ACCESSORY SHEET for the DOCKED DRAFTING STYLUS of the approved Architect Copilot. Image 1 is the design source and image 2 the orientation guide. Landscape 3:2, navy background, white/cyan labels, consistent matte low-poly lighting.
Title "ARCHITECT / DOCKED STYLUS". Subtitle "Illustrative exterior and fit".
Large ISOLATED assembled stylus-and-visible-dock three-quarter view on left half, no copilot body filling this large view. Short chunky orange hexagonal pencil, warm ivory cap, pale wood cone, dark graphite tip, ivory side retention clip and fitted teal seat following reference. Existing two small cyan marks on visible lower teal dock retained. No invented screws, hinges, straps or electronics. Show only known exterior faces; hidden rear mounting omitted. Isolation is diagrammatic, not a detachability claim.
Right upper two supporting views: "OUTER VIEW" and "SIDE PROFILE". Keep the exact same short length and orange shaft/ivory cap/cone proportions. Right lower fitted-context inset shows full Copilot from stylus-side front-left three-quarter, face towards page left, stylus on visible near flank. It stays ABOVE the chin-bottom level and tight beside the thick ivory triangular frame. The opposite blue roll is visible only as appropriate.
Three short callouts on big isolated view: "Orange shaft", "Graphite tip", "Fitted seat". Precise leader endpoints. Keep entire accessory comfortably framed. No measured dimensions, no exploded parts.
SHARED DESIGN CONTRACT: depict exactly the user's approved compact KEYSTONE / FIELD ARCHITECT concept. Broad compact hovering head-body, deep teal faceted upper shell sweeping back and tapering into a narrower lower keel; warm ivory arch around dark navy face; exactly two bright cyan vertical capsule eyes. Low-poly matte materials and broad bevels. No limbs, goggles, hat, fins, roof, desk, unfolded blueprint, loose props, extra gadgets, physical base or new gameplay effects.
ASYMMETRY LOCK: in a direct FRONT view, the single royal-blue rolled blueprint is on the viewer's LEFT (character's right); the single short orange drafting stylus and ivory triangular set-square side frame are on the viewer's RIGHT (character's left). Never swap or duplicate them. For the front-left three-quarter view the face points toward page LEFT and the STYLUS is on the visible near side at page right. LEFT profile faces page LEFT and clearly shows the stylus while the far-side blueprint is occluded. BACK view reverses screen order: stylus at page LEFT, blueprint at page RIGHT. Back-right three-quarter exposes blueprint side. RIGHT profile faces page RIGHT and shows the blueprint while hiding far-side stylus.
BLUEPRINT ASSEMBLY: one vertical tightly rolled royal-blue paper cylinder with warm ivory spiral visible on its upper end, fitted upright against the flank in ivory cradle/bands; one short hanging blue flap follows the casing, with a white simple one-to-two branching square-node diagram. Not unrolled, no floating sheet.
STYLUS ASSEMBLY: one short chunky orange hexagonal drafting pencil with ivory rear cap, pale wood cone, dark graphite tip, seated diagonally along the other flank in its fitted teal recess and ivory clips; point faces down/forward but stays above chin bottom. Adjacent thick ivory structural frame has large triangular recess/opening; preserve teal backing where present and actual view-dependent gaps, not arbitrary see-through holes.
TOP DIAGRAM ASSEMBLY: exactly three shallow raised rounded-square tiles follow the sloped top shell: one ORANGE application tile at upper/rear apex with FOUR white square window panes; two IVORY tiles below it toward front, database on the BLUEPRINT side, service hierarchy on the STYLUS side. Database icon dark teal, two or three clear stacked-disc bands; service icon dark teal, one square branching to three lower squares. Two broad cyan bent connector paths from app tile to the two ivory tiles. One diagram only; do not multiply it on rear or side.
Maintain the source's substantial body depth and short tightly fitted accessories, silhouette dominated by core. No new fasteners, handles, bolts, straps, mechanical interiors, measurements or construction claims. Unseen rear is a restrained conceptual continuation of teal faceted shell with existing ivory side bands; add no new rear features. Views are illustrative concept reconstructions, not verified 3D geometry.
Preserve the source image; avoid oversized writing props and new mechanical features.
```

## 8. architect-accessory-application-diagram.png

Inputs:
- C:/Users/jonas/Documents/ChatGPT/Tower/blender/towers/copilot_architect/v01/references/keystone_placeable_2026-09-27/keystone_field_architect.png
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-83eade30-50a1-4a98-b1ed-5fa85fbf81af.png

```text
Use case: stylized-concept. Create an ACCESSORY / FITTED ASSEMBLY DETAIL SHEET for the APPLICATION DIAGRAM on the approved Architect Copilot. Input 1 is approved design. Input 2 gives supporting orientation. Landscape 3:2, ideally 3072x2048 native, navy background, clean coordinated labels.
Title "ARCHITECT / APPLICATION DIAGRAM". Subtitle "Illustrative fitted assembly".
Large isolated exterior three-quarter study at left of ONLY the three shallow rounded-square tiles and two cyan bent paths in their assembled arrangement, with a small cropped teal surface patch underneath to communicate the existing sloped shell curvature. This is a surface detail study, not a separate device. Orange app tile at upper/back apex, warm ivory database tile lower-left, ivory service-hierarchy tile lower-right, paths connect orange tile to each ivory tile. EXACT symbols: FOUR white square panes on orange tile; dark teal three-band database symbol on left tile; dark teal one square branching to THREE small lower squares on right tile. Exactly three tiles, two paths. No additional paths, extra nodes or detachable hardware.
Right upper: "SURFACE VIEW" showing clear near-frontal diagram arrangement; "EDGE DETAIL" showing tile thickness, modest bevel, and cyan path seated against the sloped shell, no floating plates.
Right lower: "FITTED CONTEXT" showing whole approved Copilot elevated front view with this exact diagram on its forehead/top slope. Roll viewer-left, orange stylus viewer-right. Both cyan eyes visible.
Three concise callouts: "Application tile", "Database tile", "Service tile" ending on corresponding tile body. Optional tiny caption "Two cyan connector paths" if clear. No production dimensions, circuitry, switches, new mount or internal claims.
SHARED DESIGN CONTRACT: depict exactly the user's approved compact KEYSTONE / FIELD ARCHITECT concept. Broad compact hovering head-body, deep teal faceted upper shell sweeping back and tapering into a narrower lower keel; warm ivory arch around dark navy face; exactly two bright cyan vertical capsule eyes. Low-poly matte materials and broad bevels. No limbs, goggles, hat, fins, roof, desk, unfolded blueprint, loose props, extra gadgets, physical base or new gameplay effects.
ASYMMETRY LOCK: in a direct FRONT view, the single royal-blue rolled blueprint is on the viewer's LEFT (character's right); the single short orange drafting stylus and ivory triangular set-square side frame are on the viewer's RIGHT (character's left). Never swap or duplicate them. For the front-left three-quarter view the face points toward page LEFT and the STYLUS is on the visible near side at page right. LEFT profile faces page LEFT and clearly shows the stylus while the far-side blueprint is occluded. BACK view reverses screen order: stylus at page LEFT, blueprint at page RIGHT. Back-right three-quarter exposes blueprint side. RIGHT profile faces page RIGHT and shows the blueprint while hiding far-side stylus.
BLUEPRINT ASSEMBLY: one vertical tightly rolled royal-blue paper cylinder with warm ivory spiral visible on its upper end, fitted upright against the flank in ivory cradle/bands; one short hanging blue flap follows the casing, with a white simple one-to-two branching square-node diagram. Not unrolled, no floating sheet.
STYLUS ASSEMBLY: one short chunky orange hexagonal drafting pencil with ivory rear cap, pale wood cone, dark graphite tip, seated diagonally along the other flank in its fitted teal recess and ivory clips; point faces down/forward but stays above chin bottom. Adjacent thick ivory structural frame has large triangular recess/opening; preserve teal backing where present and actual view-dependent gaps, not arbitrary see-through holes.
TOP DIAGRAM ASSEMBLY: exactly three shallow raised rounded-square tiles follow the sloped top shell: one ORANGE application tile at upper/rear apex with FOUR white square window panes; two IVORY tiles below it toward front, database on the BLUEPRINT side, service hierarchy on the STYLUS side. Database icon dark teal, two or three clear stacked-disc bands; service icon dark teal, one square branching to three lower squares. Two broad cyan bent connector paths from app tile to the two ivory tiles. One diagram only; do not multiply it on rear or side.
Maintain the source's substantial body depth and short tightly fitted accessories, silhouette dominated by core. No new fasteners, handles, bolts, straps, mechanical interiors, measurements or construction claims. Unseen rear is a restrained conceptual continuation of teal faceted shell with existing ivory side bands; add no new rear features. Views are illustrative concept reconstructions, not verified 3D geometry.
Preserve tile symbols, warm ivory, teal, orange and cyan. No embossed machinery or hard-surface greebles.
```

## 9. architect-spec-sheet.png — rear orientation correction

Inputs:
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-0dd9a8a5-4186-4ea7-a9b3-22bd03833e91.png
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-83eade30-50a1-4a98-b1ed-5fa85fbf81af.png

```text
Use case: precise-object-edit. Image 1 is the completed spec sheet, direct edit target. Image 2 is the correct six-angle guide. Correct ONLY the fifth model in the top row, labeled Back-Right. It currently duplicates the Right profile. Replace that fifth model with the matching BACK-RIGHT pose in input 2 (bottom-middle): broad faceted teal rear shell facing the viewer, blue roll on near side at page right, face completely hidden, far stylus partly peeking at page left. Three-quarter REAR, not lateral profile. Keep matching scale and margins.
Keep everything else exactly as in image 1: 1536x1024 canvas, all panels, all other five model views, layout, text, tiny game view, illustrative wireframe, EMPTY UV grid, dashes for stats, five swatches and notes. Do not redesign or relabel. One localized camera-orientation repair only.
```

## 10. architect-accessory-blueprint-pod.png — isolation correction

Inputs:
- C:\Users\jonas\.codex\generated_images\01a0dff9-c82f-76d3-8dd3-96d9a90c1724\exec-fd1eae14-ec26-4827-be5d-a03046fc4fda.png

```text
Use case: precise-object-edit. Direct target is the supplied blueprint-pod accessory sheet. Correct ONLY the large LEFT exterior view: remove the whole Copilot head/body from behind the pod so this is a large ISOLATED view of the blueprint pod itself against the navy background. Keep its blue roll, cream paper spiral, blue flap with one-to-two branching symbol, two ivory cradle bands and their existing contact edge. Do not add hidden mounting hardware or invent an unseen backside. Keep the visible exterior orientation and scale of the pod unchanged. Retain the three leader callouts, re-seat endpoints on the isolated pod as needed. Change the bottom-left caption to exactly "ISOLATED EXTERIOR".
Preserve the three RIGHT supporting panels exactly: OUTER VIEW, TOP, FITTED ON COPILOT. Keep title, subtitle, dark navy canvas, labels, layout, illustration style, all original part counts and colors. One isolated accessory image must dominate the left side; the fitted whole Copilot belongs only in the lower-right inset.
```


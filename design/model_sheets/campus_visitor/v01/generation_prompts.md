# Generation prompts and inputs

Mode: built-in `image_gen` image generation/editing. Date: 2026-09-24. These are condensed reproducible prompts for the final sheets; targeted corrections used the generated draft sheet as the edit target. The original visitor turnarounds in `design/concepts/campus_visitor/v01/` were design references, not edit targets. The bundled `model-spec-sheet-template.png` was the direct edit target for each spec sheet.

## Shared identity

"Create an ordinary adult campus background visitor in Tower's friendly chunky low-poly visual style, about six heads tall with slightly oversized head and hands, lighter warm beige skin, a moss-green casual overshirt worn open over a cream T-shirt, straight navy trousers, muted terracotta low-top sneakers with cream soles and two light lace marks, relaxed stance and simple friendly face. No bag, badge, hat, gadget, weapon, costume or special-effect element. For the man, use short chunky dark hair. For the woman, use a side-parted chin-length dark bob with rounded ends. Preserve each exact identity and outfit across every sheet."

## Enlarged six-angle sheets

"Create a landscape 3:2 reference sheet with a spacious three-column, two-row grid: Front, Front-Left, Left, Back, Back-Right, Right. Show one coherent visitor rotated between views with consistent scale, lighting and ground line. Front and back are straight-on; left profile faces page left and right profile faces page right. Use large figures, a dark navy backdrop and small accurate labels. No other text, scenery or props. Preserve the shared identity and the corresponding concept turnaround."

Inputs: the corresponding man or woman concept turnaround. Output: `campus-visitor-*-six-angle-sheet.png`.

## Model specification sheets

"Edit the bundled 1536 × 1024 model-spec-sheet template directly and preserve its canvas, navy panel layout, borders, spacing, labels and typography hierarchy. Fill the six top viewports with the same visitor and angle sequence from the enlarged sheet. Header: Campus Visitor — Man/Woman; subtitle: Everyday background character for the technology campus; type: Environment Character. In-Game View: genuinely zoomed-out fixed-isometric, landscaped low-poly technology campus, visitor only a small background figure. Wireframe: illustrative three-quarter topology only. Texture / UV grid: empty. Model Info: Triangles -, Vertices -, Texture -, Materials -, Target Mobile / real-time. Use five swatches for dark hair, moss overshirt, warm beige skin, navy trousers and terracotta shoes. Notes: Readable from elevated camera; Relaxed everyday silhouette; No accessories. Do not add a Game Name or fabricated production data."

Inputs: blank spec template, corresponding concept turnaround, corresponding enlarged six-angle sheet. The final man sheet also used this edit instruction: "Turn the sixth Right profile to face page right and reduce the In-Game View figure to a small background scale; preserve everything else." The final woman sheet used: "Reduce only the In-Game View figure to a small background scale; preserve everything else." Outputs: `campus-visitor-*-spec-sheet.png`.

## External anatomy sheets

"Create a landscape dark-navy external-anatomy sheet with a large three-quarter assembled hero and close-ups of head/hair and face, open overshirt/collar/cuff, trouser hem and sneaker. Label only observable parts with correct leader lines: 01 hair, 02 face and ear, 03 shirt collar, 04 open overshirt placket, 05 relaxed cuff and hand, 06 straight trouser leg, 07 low-top sneaker and sole. Preserve the shared identity and match all close-ups to the hero. Title Campus Visitor — Man/Woman; subtitle Illustrative external anatomy from concept art. No invented internals, hidden attachments, dimensions, UV or technical counts."

Inputs: corresponding concept turnaround and enlarged six-angle sheet. Outputs: `campus-visitor-*-anatomy-sheet.png`.

## Shape studies

"Create a landscape 3:2 shape study on a light neutral background. Two aligned rows of six views: Front, Front-Left, Left, Back, Back-Right, Right. Upper row: strictly solid black filled silhouettes, with only genuine background-visible gaps and no internal marks. Lower row: matching white-interior contour drawings with a strong outer edge and only major hair, face, garment and shoe boundaries. Consistent shape, scale and orientation between rows, including opposite left/right profiles. Small row headings and angle labels, no materials, shading, wireframe, hatching or scenery."

Inputs: corresponding concept turnaround and enlarged six-angle sheet. The final woman shape sheet also used this edit instruction: "Fill sneaker soles and lace areas in the upper silhouette row with uniform opaque black; preserve the entire lower contour row and all labels." Outputs: `campus-visitor-*-shape-study.png`.

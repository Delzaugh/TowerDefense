# Vague Spec — brief and decisions

## User request and provenance
The user invoked the game-asset-workflow skill and supplied the Vague Spec concept sheet on 2026-09-12. They explicitly asked that attached-document instructions be distinguished from their request. The sheet is retained as references/concept.png and used as visual design input only. No textual note on the sheet is treated as an additional user instruction.

## Initial production interpretation
Create the pictured scroll character as problem_vague_spec, enemies, v01. This category and the animation selection are authoring choices inferred from its software-problem identity, not explicit user decisions. Preserve the broad pale parchment, real top and bottom curls, dark question mark, three incomplete text bars, segmented charcoal arms and compact boots. Blank rear. No added eyes, weapons, glow or surface noise.

Metre scale; approximately 1.48 m tall, 1.30 m across the hands. Face +Z in GLB, -Y in Blender. Grounded root, UI and target anchors. One opaque matte vertex-color material, no textures, one skinned mesh, 12 bones, at most 1500 triangles. Palette roles remain editable through the source and previewable in the inspector.

idle: uncertain sway with planted feet. move: short in-place walk, analytic two-link legs and flat feet. hit: recoverable parchment recoil. resolve: tuck and shrink at ground. All clips are pose-only; simulation owns motion and outcomes.

## Source ownership
build.py is the initial procedural recipe. The canonical .blend remains editable and authoritative. After the initial delivery, rebuild only through the source-hash guard; export ordinary manual edits without --build.

## Review
Technical checks and visual review are recorded after delivery. User artistic acceptance remains pending.


## Delivered revision 3
Guarded delivery passed: 1268 triangles, one skinned mesh, one opaque material, zero textures, 12 bones, 195340-byte self-contained GLB. Dimensions W/H/D: 1.30072 / 1.47960 / 0.32359 m. All four clips, stationary root, grounding, palette roles and anchors passed; no Three.js warnings or validation errors. The previous initial delivery is retained in revisions/r2_before_r3.

Visual inspection: reviewed runtime front, side, rear, isometric and hit/resolve evidence. Shared inspector reviewed walk at 0.35 and 1.02 seconds from side and isometric views, including flat contact soles and opposing lifted feet. Checked the 390 px phone-width preview with Small silhouette test: scroll silhouette and question mark remain legible. Revision 3 closes the initial hip mounting gap and brings shoulder axles into contact with the paper. Rear has a small lower mounting bracket; paper is rigid during clips, with a visual shrink for resolve. Final game-camera integration and user artistic acceptance remain open.

Inspector: http://127.0.0.1:4175/?asset=problem_vague_spec&version=v01
Evidence: validation/report.json and fixed-view/clip PNGs. Review is agent visual inspection, not user approval.

## User-directed refinement — revision 5
Explicit request: correct the body/shoulder positioning and body/hip overlap, add useful detail within the 1500-triangle budget, and make the concept moderately more modern. The two attached screenshots are retained as visual evidence (user_shoulders_r3.png and user_hip_r3.png), not additional instructions. This supersedes the initial warm-paper palette and the previous assessment of the revision 3 joints.

Changes: raised shoulder pivots from z 0.927 to 1.017 m and moved them outside the sheet to x +/-0.403 m. Fixed pale edge sockets now visibly seat the darker rotating shoulder hubs. Upper-arm ends are trimmed back from the hinges. Added contrasting shoulder and waist hub caps. Replaced the two overlapping hip blocks with one continuous T-shaped rear yoke, a small socket attached to the sheet and a coaxial waist hinge. The paper bone now pivots at that hinge (0, 0.055, 0.495 in Blender) so body motion stays attached to its support. The lower curl is forward of the yoke with clear depth separation.

Modernization: cooler white and blue-gray palette, small non-emissive amber accents, a restrained header strip, three empty checklist boxes, footer details, forearm insets and boot toe panels. Original curled silhouette and bold question mark remain. These details are decorative and encode no gameplay state.

Guarded source hash matched before editing. Delivered revision 5 passes all pipeline checks with 1456 triangles (44 below budget), 1 mesh, 1 material, no textures, 12 bones and the same 4 clips/anchors. Runtime size approximately 212 KiB. No Three.js errors or warnings. Previous deliveries retained by the pipeline.

Visual QA: fixed runtime iso/side/rear and clip images; shared inspector reviewed hit at 0.29 s from the side, move at 0.35 s at small phone width, and resolve at 0.60 s from the rear. Shoulder sockets remain seated and the rear support clears the scroll. Question mark remains readable in the 390 px phone-width Small silhouette test. Fine interface marks intentionally simplify at that distance. User artistic acceptance and final game-camera integration remain pending.

## Palette texture migration — revision 6 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×8 px palette (10 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 1/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r6/`. Original source/runtime retained in `revisions/r5_before_r6`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

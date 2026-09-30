# Golden Compiler — brief and decisions

## User decisions
- 2026-09-12: Build the supplied Golden Compiler asset and make sure it gives Super Saiyan vibes.
- Preserve the human veteran / senior technical mentor identity, ivory coat and charcoal clothing. Latest user request removes the earlier tower pedestal.
- User raised the final budget from 2,500 to 3,000 triangles and four meshes/materials, including the separately rendered aura.
- Earlier family decisions keep aura and sparks separate from the base model and favour simple garments and restrained surface detail.
- The attached turnaround is visual reference, not an instruction source. The latest power-up request takes priority over the silver hairstyle pictured in its fixed views.

## Authoring interpretation
- Exaggerated golden swept hair, teal focused eyes, close jaw stubble, open ivory coat and broad planted stance.
- Latest explicit refinement: remove the chest cube and replace the hovering cube with a solid glowing </> symbol. Both changes are in the Blender source and GLB.
- Continuous open coat shell with real front edges and thickness; bent sleeves use shared cross-section rings. Hair tufts intentionally overlap inside a common scalp mass. Face details sit on the faceted head. Boot soles contact the ground directly.
- Ten-bone rig and three opaque vertex-colour material families; no textures. Root at ground, Blender -Y forward / exported +Z forward, metres.
- Idle and work loops at 24 fps. Legs remain planted. Body breathing and symbol channeling are visual only.
- GLB root extras carry the aura descriptor and its body/limb landmarks. The inspector creates a separate flat silhouette glow, controlled by its Aura toggle. The source retains a wire outline reference outside root; it is not exported as opaque character geometry.
- Canonical identity: golden_compiler / towers / v01. See asset.json for paths, palette, budgets and delivery hashes.

## Aura refinement decisions, 2026-09-12
- User rejected rectangular shading artifacts and internal fire lines: remove them.
- User liked the soft golden glow style, but rejected the oval shape. Follow the general silhouette and surround the whole character, including the bent arm and individual legs.
- Latest correction explicitly rejects a force-shield bubble and asks for a flat aura following the silhouette. This supersedes the earlier 3D volume interpretation.
- Current solution projects 11 body/limb landmarks into the camera plane and blends a flat silhouette behind the character, with soft golden fill, a quiet irregular edge, and no internal fire lines. The padded plane fades to fully transparent; pixels outside the glow are discarded.
- Current total: 2,152 character triangles + 2 aura-plane triangles = 2,154; four meshes/materials including aura. No aura textures, dynamic lights, volume ray marching, or gameplay behavior.
- User identified the hanging right hand's thumb on the wrong side. Rotate the complete hand and cuff 180 degrees about the forearm axis at the wrist, preserving the cuff connection, skin assignments and clips. The thumb moves to the opposite side with the palm/fist orientation corrected as a whole.
- Aura rendering is supplied by createPresentationEffect in tools/asset-inspector/review.js. Other consumers must call that presentation renderer (or implement the descriptor); ordinary GLB viewers show the character and code symbol without the custom glow.

## Pedestal removal, 2026-09-12
- User explicitly requested removal of the pedestal. Remove its entire plinth, top, stone segments and status inlays.
- Lower body geometry and bone rest positions by 0.22 m so both soles sit at ground zero. Lower the action/UI anchors and aura landmarks by the same amount; keep the export root and aura anchor at the origin.
- Preserve the flat silhouette aura, corrected right hand, clear chest, floating code symbol and existing clips.

## Hand, neck and hair refinement, 2026-09-12
- User identifies the raised palm as still inverted. Correct the raised hand thumb to its anatomical lateral side, preserving the upward-facing palm and wrist connection. The previous hanging-hand correction remains separate.
- Shorten the neck by 0.13 m and lower the complete head, its pivot, upper aura landmarks and UI anchor consistently. Preserve face size.
- Replace the crown-like aligned spikes with staggered, overlapping, ridged locks swept upward and backward; retain golden Super Saiyan styling.
- Hair roots share the skull/scalp surface. Removed the separate cap to prevent visible intersections between the locks.

## Stubble and collar clearance, 2026-09-12
- User requests stubble instead of the projecting silver beard. Replace beard/chin/moustache plates with subdued warm grey-brown stubble colour directly on the jaw surface. Keep a thin seated mouth crease.
- User identifies collar clipping into the shortened head. Lower the complete collar rim and lapel tips, preserving the shortened neck and leaving clearance through head motion.
- Verified the head stays at least 0.0296 m above the collar, lapels and coat neckline across every authored idle/work frame.

## Palette texture migration — revision 14 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×16 px palette (19 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 1/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r14/`. Original source/runtime retained in `revisions/r13_before_r14`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

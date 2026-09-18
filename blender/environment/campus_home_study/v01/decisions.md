# Glacier campus study — brief and decisions

User decision, 2026-09-17: build a small 3D patch of the home-screen campus to evaluate the direction. This is an art/presentation study, not approval of a full home-screen conversion.

Study scope: stepped Copilot Lab, shallow campus foundation, promenade, six faceted trees, two benches, two lamps and an inset pool. Match the active Glacier prototype's chalk, blue-gray and teal palette. Static architecture and landscaping; camera and interface behavior belong to the browser.

Reference: prototypes/hub/source/template.html, styles.css and the local capture prototypes/hub/previews/before-3d-study.png. Project-created visual references. Bespoke geometry, no third-party mesh copied. Existing Space Base kit is suited to utility props but does not match this stepped office silhouette.

Dimensions: 19 × 15 metre campus patch, approximately 5.65 metre building height. Front faces +Z in GLB. Root ground contact y=0. Anchor above the lab supports an HTML label. Lab, Terrain and Garden remain separately editable assemblies with semantic vertex-color roles and one shared material. Combined scene budget: 8,000 triangles, three meshes, one material, no textures or bones; covers multiple props and landscape, not a standalone-building allowance.

Construction: continuous main shells; seated roof slabs, window panels and door frame; extruded closed-outline code chevrons; trunks seated into planters. Opaque windows and water. No embedded text or gameplay data.

The initial script creates the initial source. Later procedural rebuilds must pass the source-hash guard; manual Blender changes take precedence through ordinary export.

Revision 4 reviewed in the shared Inspector (isometric, front, rear, right and phone width) and the home-screen study (home, close-up, reverse, above, phone and landscape). Corrected facade window spacing, code-chevron orientation and roof-equipment clearance. Runtime: 4,408 triangles, three meshes, one material. Guarded export and browser interaction checks passed. User artistic acceptance remains pending. Rear facade is intentionally plain for this scoped study; no gameplay or animation is connected.

## Palette texture migration — revision 6 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×8 px palette (13 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 1/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r6/`. Original source/runtime retained in `revisions/r5_before_r6`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

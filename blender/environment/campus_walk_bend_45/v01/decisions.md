# Campus walkway · gentle bend

User request, 2026-09-17: make the main floating campus panel the primary surface, provide reusable straight/corner/bend walkways, several tree variants, a pond and solar panels.

3.20 m wide 45-degree bend, centerline radius 4 m. Start (0,0) heading +Z; end (1.171573,2.828427) heading diagonally +X,+Z. Surface y=.08 m.

Glacier palette and chunky low-poly construction. Metres; +Z forward; root at ground contact; opaque shared vertex-color material. No clips or gameplay rules. Each model is an independently registered reusable asset. Geometry is authored in Blender through the local build.py and shared helper. Ordinary export preserves manual source edits; procedural rebuilds must pass the source-hash guard.

The walkway widths are chosen for the canonical 2.27 m wide Copilot with turning clearance. Named port anchors define exact assembly points; assemble at 1:1 scale and align the 0.08 m top elevation. Do not resize the Copilot to conceal architectural scale errors.

## Palette texture migration — revision 3 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 16×4 px palette (3 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 0/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r3/`. Original source/runtime retained in `revisions/r2_before_r3`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

## Campus assembly review — revision 5

Actual exported views inspected on 2026-09-17: iso, rear, top. Silhouette, contact surfaces and palette remain coherent; no blocking construction defects observed in these views. Continuous path mesh with open hexagon marking and cyan signal dashes. Curved markings were corrected in Blender to follow the tangent and stay inside the edges. Current packed palette delivery is preserved. Hash-bound evidence: validation/visual-review.json. Artistic acceptance remains with the user.

## Modern campus refinement — revision 7

Redesigned source mesh: darker blue-gray deck, recessed dark shoulders, continuous 0.14 m cyan rail inlays, subtle hex wayfinding and panel seams. Reviewed final rail alignment and continuous turns from top and oblique views; no visible construction gaps in the reviewed export. Existing 3.20 m width, 0.08 m surface elevation and connection anchors preserved. Current exported GLB was personally reviewed in the shared Inspector (iso, rear, top) and in the campus composition. Hash-bound review: validation/visual-review.json. All guarded export and assembly checks pass. Artistic acceptance is separate.

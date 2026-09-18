# Campus solar array

User request, 2026-09-17: make the main floating campus panel the primary surface, provide reusable straight/corner/bend walkways, several tree variants, a pond and solar panels.

3.65 × 2.8 m footing with one tilted eight-cell panel, supported by four posts. Static, matte navy and chalk treatment.

Glacier palette and chunky low-poly construction. Metres; +Z forward; root at ground contact; opaque shared vertex-color material. No clips or gameplay rules. Each model is an independently registered reusable asset. Geometry is authored in Blender through the local build.py and shared helper. Ordinary export preserves manual source edits; procedural rebuilds must pass the source-hash guard.

The walkway widths are chosen for the canonical 2.27 m wide Copilot with turning clearance. Named port anchors define exact assembly points; assemble at 1:1 scale and align the 0.08 m top elevation. Do not resize the Copilot to conceal architectural scale errors.

## Palette texture migration — revision 4 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 16×4 px palette (3 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 1/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r4/`. Original source/runtime retained in `revisions/r3_before_r4`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

## Campus assembly review — revision 4

Actual exported views inspected on 2026-09-17: iso, rear, side. Silhouette, contact surfaces and palette remain coherent; no blocking construction defects observed in these views. Side close-up confirms the four supports meet the tilted panel underside after correcting their heights. Current packed palette delivery is preserved. Hash-bound evidence: validation/visual-review.json. Artistic acceptance remains with the user.

# Glacier Copilot Lab

User request, 2026-09-17: make the main floating campus panel the primary surface, provide reusable straight/corner/bend walkways, several tree variants, a pond and solar panels.

Standalone lab extracted from campus_home_study revision 5, rebased by 0.65 m. Preserve enlarged 2.80 × 2.48 m clear double-door aperture.

Glacier palette and chunky low-poly construction. Metres; +Z forward; root at ground contact; opaque shared vertex-color material. No clips or gameplay rules. Each model is an independently registered reusable asset. Geometry is authored in Blender through the local build.py and shared helper. Ordinary export preserves manual source edits; procedural rebuilds must pass the source-hash guard.

The walkway widths are chosen for the canonical 2.27 m wide Copilot with turning clearance. Named port anchors define exact assembly points; assemble at 1:1 scale and align the 0.08 m top elevation. Do not resize the Copilot to conceal architectural scale errors.

## Palette texture migration — revision 3 (2026-09-17)

User-authorized texture-preferred alignment. Converted the then-current authoritative source to a packed 32×4 px palette (7 used colour roles). Opaque flat role colours suit texture editing; no vertex-colour exception was needed. Preserved geometry, existing UVs, rig, anchors, morphs, clips, material response and auxiliary emission data. Exact runtime parity passed; maximum rendered channel difference was 1/255. Before/after, reverse, clip and phone-scale views were personally reviewed. Evidence: `validation/palette_migration_r3/`. Original source/runtime retained in `revisions/r2_before_r3`. Later artistic refinements remain separate. Future guarded rebuilds retain texture delivery; ordinary exports use the packed Blender image.

## Campus assembly review — revision 3

Actual exported views inspected on 2026-09-17: iso, rear, side. Silhouette, contact surfaces and palette remain coherent; no blocking construction defects observed in these views. Source doorway has a 2.80 m by 2.48 m nominal clear opening; sampled canonical Copilot hover leaves approximately 0.253 m per side and 0.472 m headroom. Current packed palette delivery is preserved. Hash-bound evidence: validation/visual-review.json. Artistic acceptance remains with the user.

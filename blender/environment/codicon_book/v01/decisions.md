# Codicon Book

User request (2026-09-18): turn the linked common SVG/icon into a reusable 3D model. Preserve this specific upstream icon, including true open cutouts; no pixel reinterpretation, added plaque, stand or gameplay behavior.

Source: https://github.com/microsoft/vscode-codicons/blob/6833ea2bc5fc49220e261a4a0fd1986ea02d1d0c/src/icons/book.svg
Creator: Microsoft and contributors, vscode-codicons. License: CC-BY-4.0. Original SVG, upstream README and LICENSE retained at assets/third_party/microsoft/vscode-codicons/6833ea2bc5fc49220e261a4a0fd1986ea02d1d0c. Modified by curve tessellation (maximum control-point chord tolerance 0.025 SVG units), proportional normalization to 0.60 m maximum span, 0.06 m extrusion and neutral face/edge colors. No trademark rights or endorsement implied.

One mesh with 1 intentional closed component(s), 2 hole(s). Disconnected source features remain disconnected within that mesh and need a host surface for physical use; no invisible connectors. No bevel that could close thin gaps. One opaque matte material, packed 8 x 4 semantic palette, no animation. Root at origin, bottom y=0 and front +Z. Budget 1200 triangles accommodates the detailed GitHub and Copilot outlines.

build.py uses the shared codicon-extrusion.py; geometry.json retains tessellated contours as editable vertices/faces. Rerun tools/asset-recipes/codicon-geometry.mjs only when deliberately updating the upstream geometry. Use ordinary export for manual Blender edits and guarded --build for unchanged procedural sources. Existing assets/decoration placements remain unchanged.

## Delivery review — 2026-09-18

Revision 2, 444 triangles. Guarded runtime validation passed without warnings; Inspector capture found no page errors. Personally reviewed source SVG versus exported front, side, iso, rear and phone evidence, plus complex cutout close-ups. Closed-manifold construction and tessellation-area checks passed. Attribution/source/license metadata verified in the actual GLB. Static emblem limitations and user artistic acceptance are recorded in validation/visual_review.json.

Source SHA-256: 02567d23aa2242a3fc0c4c33606d83d87acd64d9ac52f315b0580f6671ddc1b6
Runtime SHA-256: 42e2a2965915374444dd06d41636496fa16efc36021c11d6c359ba9d8cb002c7
Original SVG SHA-256: cb4431b90f05a017a86548652ab149c38371324b9b12d1d8cb6f197b65bb0e88

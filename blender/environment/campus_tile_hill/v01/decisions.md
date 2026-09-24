# Campus hill tile

User request, 2026-09-18: create several tile variants and place decorative campus assets in a connected layout. Preserve the approved dusk structural frame; remove runtime corner light streaks.

Two asymmetric, faceted grassy mounds, rising up to 3.8 m above the deck. The central north/south route corridor (|x| <= 3.5 m) and outer 1.4 m joining band remain level. Props are only placed on verified flat parts; general terrain placement is not implemented.

18 m circumradius, y=1.20 m shared attachment surface, six standard edge anchors; same hex shell and trim as campus_base_hex. One mesh/material and packed 512 atlas. Structural solid swatches remain declared; spatial terrain is edited in the packed image/recipe, not treated as a solid Inspector swatch. Static geometry, no gameplay logic.

## Delivered visual review

Revision 2; source SHA-256 77e6b0d551a2e4f559904978dee071e72efb2c8af4778ab7cecb33bc631106e0; GLB SHA-256 e77b34f6851d0a8e888645a9decce0b1d5f48fd8bf9ab2b1b5b57c450c716e5d. Guarded validation passes with 920 triangles, one mesh/material and one packed 512 texture. Personally reviewed the actual export in shared Inspector iso/rear/top views and desktop/phone campus composition. Level joins, terrain silhouettes and furniture/path clearances pass. The 97-instance composition places 20 decorative props without overlapping footprints. No edge streaks remain. See validation/visual-review.json and prototypes/campus-3d/previews/placement-audit.json. Artistic acceptance remains with the user.

## Shared-edge seam removal — user request, 2026-09-18

The shared terrain construction no longer uses a distinct top seam-inlay appearance; its flush joining surface now continues the ground material while the structural shell, trim, elevation and anchors remain unchanged.

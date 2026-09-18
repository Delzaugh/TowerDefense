# Asset material alignment

Status: Completed user-authorized texture-preferred migration, 2026-09-17. 24 assets converted and visually reviewed; all 90 currently registered versions use base-colour textures. This supersedes the earlier proposal to default new bespoke assets to vertex colours. Shared policy is in [Visual_Asset_Guide.md](Visual_Asset_Guide.md); exact colours and exceptions remain beside each asset.

## Decision

Prefer small palette textures for new and refined assets. Preserve imported KayKit atlases. Keep vertex colours when continuous gradients, procedural variation or another demonstrated authoring/performance benefit fits the asset better; document that reason. Consistent editing is the objective, not forcing every possible asset into one format.

The original 2026-09-13 audit covered 74 registered versions: 64 base-textured and 10 vertex-coloured (including Missing Details' separate emission map). The [Bug experiment](../../blender/enemies/problem_bug_palette_test/v01/README.md) established appearance and interface parity; its original 5.34% transfer-size reduction is a historical experiment result, not a catalog-wide performance promise. Named texture-role editing, reset and validation were subsequently implemented in the Inspector.

## Migration method

Process the latest authoritative sources one at a time using guarded `export <id> --palette`. Retain a milestone, pack the tiny palette image in Blender, embed it in the GLB, preserve semantic role IDs, and declare material-specific `texturePalettes`. Do not rebuild geometry to change colour storage. Compare topology, positions, normals, skinning, old UV channels, morphs, rig, anchors, clips, materials and auxiliary emission data exactly. Compare rendered colours under identical conditions and personally inspect front, reverse, isometric, clip and phone-scale evidence.

Recipes can continue to use semantic colours as construction inputs. Guarded rebuilds restore the chosen texture delivery automatically, including components extracted from already textured sources. Ordinary exports retain manual source authority and the source-hash guard remains active. Preview colour edits must be applied to the packed Blender image and manifest before delivery.

## Evidence and scope

The current per-version disposition, before/after hashes, size changes, palette dimensions and review links are recorded in [palette_conversion_report.json](../../assets/palette_conversion_report.json). Each converted asset also has `validation/palette_parity.json`, `palette_source_conversion.json`, `palette_visual_report.json` and `palette_review.png`, plus preserved original renders and a source/runtime milestone.

The production workflow, Tower concept-sheet skill and model-spec-sheet skill follow the same preference. Concept art does not pretend to contain UVs, and specification sheets report actual delivered texture/vertex data. Unrelated raster-image, SVG and CAD workflows are outside this 3D material decision.

This migration preserves appearance and interfaces. It does not settle new shared colour values, redesign models, or claim improved frame time. Small low-vertex assets can grow slightly from image/UV overhead; compare actual transfer sizes in the report. Runtime texture sharing, draw-call reduction and GPU-memory optimisation require separate profiling in representative gameplay scenes.

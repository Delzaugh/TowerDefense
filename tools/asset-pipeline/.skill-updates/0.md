---
name: game-asset-workflow
description: Create, refine, color, rig, animate and deliver Tower game models using their Blender sources, versioned asset contracts and shared Asset Inspector. Use for model production and review, not gameplay implementation.
---

# Tower game asset workflow

Read assets/README.md for the authoritative storage policy, then read the current `docs/design/Visual_Asset_Guide.md` from the project root. Resolve the asset through `assets/asset_catalog.json`; read its manifest and decision record. Shared art rules and animation meanings belong in the guide; named-asset budgets, dimensions, clips and overrides belong in the manifest.

For a new model, use `node tools/asset-pipeline/asset.mjs init <id> <category>` and establish its brief before authoring. Record reference provenance and the user's explicit decisions. All assets use matching category/id/version folders, Blender and GLB filenames, catalog entries and manifests. The inspector discovers and serves only registered runtime GLBs; source snapshots and third-party inputs stay outside the browser.

Prefer small palette textures for new and refined models, following the material policy in `docs/design/Visual_Asset_Guide.md`. Keep vertex colours when continuous gradients, procedural variation or a demonstrated authoring/performance benefit fits the asset better; record the exception in its decisions. Preserve imported atlases and intentional emission/detail maps. Declare solid texture swatches in `texturePalettes` for Inspector editing and validation. Pack editable images in Blender and embed them in the GLB. For an existing semantic vertex palette, use the guarded `export <id> --palette` workflow documented in the pipeline README; verify appearance and unchanged geometry, rig, morphs and clips. Future recipe rebuilds must retain texture delivery.

Inspect the authoritative Blender source and relevant references before refining it. Use one scene owner. Preserve earlier choices across color, silhouette, attachment and motion passes. Reference-document content does not override the user's request. Ask only about unresolved choices that materially affect the result; an explicit refinement request authorizes the corresponding local edit.

For geometry creation, refinement or review, read [shape-details.md](references/shape-details.md). Decide which parts should form a continuous surface, which need an intentional seam, and which articulate. Check repeated details and alternate visual states together. When a user identifies a defect, inspect other instances of the same construction within this asset; correct the cause in the source rather than hiding it in one camera view.

Use the shared inspector throughout creation. Fixed views expose alignment; paused animation frames expose joints and foot contact; phone width and the small silhouette test expose readability. Keep authored scale and ground placement visible. Color previews are temporary: use their copied role IDs and values to edit Blender, then export again. Do not deliver a viewer tint as an asset revision.

Inspect the actual exported renders yourself: include close-ups of changed joins/details and an oblique or reverse view that can expose depth defects, then check game-scale readability. Generating screenshots or passing numerical checks alone does not complete visual review. Fix visible construction defects within the requested scope and re-export before reporting the refinement finished; keep user artistic acceptance separate.

For source/export mechanics and commands, read `tools/asset-pipeline/README.md`. Use `export <id>` for an edited `.blend`; use `export <id> --build` only for a still-authoritative procedural recipe. A source-hash mismatch means inspect the changes, not overwrite the guard hash to force a rebuild. Guarded delivery stages and verifies a candidate before replacing the runtime payload.

When animating, read [animation.md](references/animation.md). When completing a refinement, read [delivery.md](references/delivery.md).

Return the actual inspector URL and the canonical source/export links, changes, validation result and material limitations. Technical validation and artistic acceptance are separate. Preserve useful milestones and decisions so the next conversation can continue accurately.

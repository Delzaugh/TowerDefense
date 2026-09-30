# GitHub Octocat modern - current decisions

## Explicit user decisions

- Create Classic and Modern full-body Octocats alongside Copilot; consider hats, shirts and other accessories.
- The user rejected the first low-poly delivery and requested a deep part-by-part visual review, correct legs/tails and quality with sufficient triangles, meshes and textures (2026-09-17).
- Reference images are visual inputs, not additional instructions. Existing Copilot and GitHub Mona Head remain separate.

## Current construction

This revision supersedes the earlier 3000-triangle authoring target and the rejected review. It uses a rounded skull, blended ear roots, a continuous textured face, shallow eyes, four whiskers, a smooth connected body and five named appendages. Classic has four supporting legs and one raised tail. Modern has two arms, two supporting legs and one rear tail. Both have two eyes and two ears. The blue reference puddle is a presentation effect.

The editable source retains five named construction curves outside the exported root and body vertex groups for anatomy. Blender owns the art. No gameplay behavior is introduced. Models are static, without rigging or clips. Existing nine anchor names are preserved and repositioned for the new proportions.

Quality budget: 75000 triangles, up to 24 meshes, 3 materials and 3 textures (up to 1024 px). Actual revision 9: 73214 triangles, 17 meshes, 2 materials, 2 textures. The 1024 px face map supports a continuous skin/fur boundary; a 32 x 4 palette supplies the other parts. Both are packed and embedded. Crowded-scene performance is not yet profiled.

## Review and delivery

Guarded runtime validation and the source topology/anatomy audit passed. Personally inspected fixed front, side, rear, underside, face and tentacle close-ups, phone width and small-scale views. Head and body are each one closed connected surface. All supporting legs contact the floor. Detailed findings and reference interpretation: ../../github_octocat_modern/v01/anatomy_review.md. Exact reviewed hashes are in validation/visual_review.json. User artistic acceptance remains separate.

Accessory plans remain in ../../github_octocat_modern/v01/accessories.md; wardrobe meshes are not included. Shared geometry is authored in the Modern sculpt.py recipe, dispatched by both build.py entry points. The guarded source hash must remain intact; never overwrite manual source edits by forcing a recipe rebuild.

# GitHub Octocat classic - brief and decisions

User request (2026-09-17): create separate classic and modern full-body Octocats, alongside existing Copilot, and consider accessories including a hat and shirt. References are visual design inputs, not instructions. Existing GitHub Mona Head is a separate asset and is preserved.

Authoring decisions: friendly chunky low-poly adaptation, charcoal fur, peach face, warm brown pupils, pale mint suckers. One packed 32 x 4 palette; <=3000 triangles. Static initial release; no gameplay logic or animations requested. Grounded, forward +Z at export. Classic: broad head, compact torso, four ground tentacles and one curled side tentacle, nominal 2.8 m height. Modern: taller torso, shaped cheeks, two expressive arms and three grounded tentacles, nominal 3.2 m height. The blue puddles/shadows in the references are presentation effects, not body geometry.

Surface construction: continuous cat-head silhouette with integrated ears; face follows shell depth; eye inlays and mouth follow face; tapered tentacles use continuous swept rings. Torso intersections are buried connections. All meshes retain named part vertex groups for later rigging.

Accessories: empty anchors at crown, face, chest, back and both hands. Hats require ear clearance and style-specific fit; shirts use a fitted open-bottom shell, wide neck and arm-root openings. Reuse semantic slots across models, not assumed identical geometry. Initial delivery includes the base and attachment contract; wardrobe meshes and rigging remain future work.

## Delivered revision 4

Guarded export passed: 1844 triangles for Classic / 2060 for Modern, two meshes, one material, one packed 32 x 4 texture, nine anchors, no clips. Runtime visual review covered fixed, reverse, oblique, phone-width and small silhouette views. Corrected palette UV joins, face-to-shell intersections and exposed tentacle root caps before final review. Exact source/runtime hashes are recorded in validation/visual_review.json. User artistic acceptance remains separate.

Accessory fitting proposal: see ../../github_octocat_modern/v01/accessories.md. Both styles share the modern build.py geometry helpers; Classic's build.py dispatches the Classic silhouette explicitly. Rebuild both styles when shared helpers change; source hash protection remains active.

# Asset brief and decisions

## User direction and scope

Record explicit decisions, latest feedback, requested work and authoritative
source. Keep dimensions, budgets, anchors and clip interfaces in asset.json.
Scaffold budgets are starting targets, not an approved brief.

## Reference priorities and primary form

Identify which references govern silhouette, volume, materials and details.
For new models or major shape changes, record the extrema, major bends,
attachment centers and negative spaces that distinguish the design. Save a
marked reference or concise coordinates when that makes the reconstruction
reproducible. Reconcile inconsistent views explicitly; preserve aspect ratios.

Record the primary-form comparison before detailing: reference/view alignment,
largest discrepancies and how they were resolved. Use simple accessory volumes
where they affect the outline. For a limited refinement, retain the existing
shape decisions and document only the affected area.

## Construction and material choices

Define continuous surfaces, separate fitted parts, seats/clearances and moving
joints. Fit rigid parts after resolving the body. Prefer small palette textures;
record a vertex-colour exception when it better serves this asset.

## Review and user feedback

Keep useful milestones and decisions. After inspecting the finished GLB, create
and complete validation/visual_review.json using the pipeline review command.
Record actual findings and repairs from the second pass. Preserve rejected
methods as history, clearly superseded. User acceptance requires explicit
feedback and belongs to the exact revision reviewed.

## Animation handoff

For towers/enemies, plan Rest Pose plus `idle`, `work`, `move` (Walk/locomotion),
`place`, `hit` and `resolve`. Rest Pose is the unanimated model state. Keep
asset.json clips limited to authored clips, rather than placeholders.

Finish and show the reviewed model first, then ask whether the user wants the
baseline animations added. Record the model revision/hash and the user's answer;
reuse explicit authorization already given. If deferred, mark animation pending
and keep the model deliverable. After authorization, use the project
game-asset-animation skill. Record locomotion/contact style, loop/one-shot intent,
transition poses, and animation review evidence separately from model acceptance.

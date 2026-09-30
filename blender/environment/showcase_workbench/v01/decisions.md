# Asset brief and decisions

## Copilot Hub workbench v01 authored direction

The approved `design/mockups/copilot_hub_towers/v09/codex.png` governs composition and color: warm desktop, dark slate wall, ivory architectural bands, right-side campus window, and a slim cyan-accented Tower plinth. The user asked for real 3D room art with no logo wall or decorative clutter. Mockup text and controls remain HTML overlays.

The room measures about 18 m wide, with a back wall at z=-5 and the warm desktop reaching z=16.5 so it continues behind the lower control rail. The framed right window has opaque sky, low hills, and restrained low-poly trees. `room_shell` and `preview_plinth` are separate meshes so the room can stay fixed while the Tower preview has its own camera. The compact plinth has beveled eight-sided tiers and a thin inset cyan rail. The desk and plinth use seated volumes with no coplanar overlays. Back-side window scenery is intentionally minimal because the room has a fixed front camera.

A packed 64x4 swatch atlas supplies one rough material. There are no gameplay anchors or clips. The saved Blender source remains authoritative after manual changes; the recipe is retained for repeatability and should only be rebuilt under the source-hash guard. User artistic acceptance of this delivered GLB is pending.

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

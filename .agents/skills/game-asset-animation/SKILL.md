---
name: game-asset-animation
description: Rig, animate and review Tower game assets after model review, using Blender sources, shared clip contracts and the Asset Inspector. Use for animation production or refinement; model creation stays in game-asset-workflow.
---

# Tower asset animation

Read `assets/README.md`, the animation sections of
`docs/design/Visual_Asset_Guide.md`, and the catalog-resolved manifest and decisions.
Shared clip meanings and category requirements live in the guide; exact timing,
rig budget, anchors and authored clips belong in the versioned manifest.

## Model handoff

Finish the model and its author review before starting this pass. Show the
model's shared Inspector link and ask whether the user wants the baseline
animations added. Wait for the answer; a deferred animation pass does not prevent
delivery of the reviewed model. Preserve authorization already given: an explicit
request to add animations does not need another permission question. If model
and animation were authorized together, still expose the model review milestone
before proceeding. Do not silently broaden a model-only request into animation.

Record the reviewed model revision/hash, authorization or deferral and locomotion
choice beside its source. Towers/enemies need Rest Pose plus the six clips in the
guide; Rest Pose is an unanimated state, not a constant clip. Use `move` for Walk
or other locomotion. Audit existing clips before authoring missing ones. Retain
working clips and independent expression/progress controls. A named empty or
constant track is not a completed animation. Other categories follow their own
guide requirements; static props need no invented clips.

## Category presentation defaults

Apply the category arrival/resolution policy in
`docs/design/Visual_Asset_Guide.md`. Every authorized tower animation pass uses
cube assembly for `place` and reverse digital disintegration for `resolve`,
unless the user has specified an override. Preserve the model-first handoff;
do not ask again for the established tower effect after animation is authorized.
Enemies default to the approved Glitch breach: a jagged body reveal with a
brief registration glitch for `spawn`, then an erase sweep and thin horizontal
streaks for `resolve`. Set `spawnPortal: false`; the approved design has no portal.
Work/task assets default to Blueprint outline/scan construction and a completion
check with an upward erase sweep, without rising lines or ribbons. The Bug and
Coding Task references are user-approved. Reuse these defaults in authorized
animation passes without asking the user to select them again; preserve explicit
asset overrides. Category defaults alone do not authorize migrating other assets.
Distinguish Work/task assets from the looping `work` clip. Preserve their separate
progress controls and any hidden alternate geometry while cutting the surface.

For these effects, read `tools/asset-presentation/README.md` and reuse its shared
`createLifecycleEffect` interface. Record per-asset parameters in the manifest
and Blender root extras. Author compatible full-size pose tracks; presentation
supplies coverage and temporary effects. Towers use reversed timelines; enemies
and Work have distinct entry and completion choreography. Entry ends at ready,
Resolve ends invisible. Add `spawn` where an enemy/Work arrival clip is absent;
preserve existing `spawn`/`place` interfaces without duplicate aliases. An enemy's
`spawn` fulfills the baseline arrival slot. Fit streak counts to each asset's
remaining combined triangle budget; preserve approved art instead of reducing
mesh quality to fund an effect. Review in the actual Inspector at game scale, including
replay/reset, seeking, shadows and budget fallback. Bind the review to renderer
as well as source/export hashes. A plain GLB player cannot display the complete
shader effect; include the runtime integration requirement in delivery.

## Authoring

Preserve accepted rest geometry, UVs, materials, normals and anchor positions.
Keep one editor per scene. Select a compact rig from actual moving parts; rigid
manufactured parts should stay rigid. Weight and pivot checks precede motion
polish. Any required rest-shape change reopens model review instead of silently
replacing the approved shape. Preserve a coherent source/export milestone first.

Choose contact behavior from anatomy and user direction. Limbs may walk, wheels
roll, and limb-free forms may glide, hop or hover; none is an automatic default.
Record unresolved meaningful choices and ask only where needed. For hovering
playback, distinguish the grounded authoring rest from the minimum playback
clearance and compatible ready/exit heights. Do not add anatomy just to fill a
clip label.

Give clips distinct readable purposes through anticipation, action and recovery.
Use restrained timing at game scale. Loops need matching endpoint poses and
continuous speed; one-shots need deliberate start/end states. Establish how
place/hit return to ready and how resolve holds its terminal pose. Keep full-body
rigid motion and display/expression changes independently controllable when
appropriate. Do not make every clip a variation of the same bob.

Blender owns rig and actions. Author at 24 or 30 fps with exact lowercase clip
names and named NLA tracks containing their corresponding actions. Save with
active actions cleared, NLA tracks muted, bones in rest pose and applied mesh
transforms. The shared exporter evaluates animations in isolation; never save its
last evaluated pose over the editable source.

Keep `root` stationary. Attach non-rendering anchors to root or a relevant bone,
preserving their rest coordinates; action origins should follow moving art where
needed. Simulation owns position, facing, timing and outcomes. Presentation
selects/blends clips. Clip completion must not cause gameplay events. This pass does not implement
gameplay mappings. Configure and review established presentation effects as part
of an authorized animation pass; build a new effect only when requested.

## Export and review

Use `tools/asset-pipeline/README.md` for guarded delivery. Use ordinary export for
an edited authoritative `.blend`; rebuild only while its recorded source hash
still permits it. Keep the animation recipe reproducible if it remains the
declared source mode. Compare exported rest art against the accepted baseline,
including surface normals and materials, not only triangle counts.

Review the actual GLB in the shared Inspector, first at normal speed and then
scrubbed/stepped. For every clip inspect start, anticipation/action extremes,
recovery and exact end. Inspect several loop cycles and the join on both sides;
matching endpoint numbers alone cannot rule out a speed hitch. Check intended
idle-to-work/move/hit transitions, place-to-idle, resolve replay and Rest Pose
reset. Test independent states survive and reset to their declared defaults.

At joints inspect maximum bend/twist and intermediate poses from exposed angles.
Watch for gaps, double transforms, unwanted deformation and crossings. Check
planted contact sliding/penetration, or sustained hover clearance across the full
cycle. Verify anchors follow the intended part without inherited double motion.
Inspect readable timing and silhouette at phone/game scale; close-up motion alone
is insufficient. Exported channels must actually vary on their intended targets.

Numerical validation checks budgets, skins, finite bounds, stationary root and
loop endpoints; it does not certify expressive motion or sound attachments.
After repairs, complete a second author review of the final export and record
concrete motion findings, clip/time evidence, limitations and current source/GLB
hashes in `validation/visual_review.json` with scope `animation`. Run the pipeline
review check. Keep previous model acceptance separate from the user's acceptance
of the new animation revision.

Deliver the actual Inspector URL, source/GLB links, clip list and any limitations.
Follow project Blender thumbnail-cache cleanup rules before reporting completion.

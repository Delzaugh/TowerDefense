# Copilot animated copy

- User request, 2026-09-12: copy the existing Copilot asset and improve it with animations.
- Copy copilot_base v01 into v02; preserve the original source and runtime. Inherit existing appearance, dimensions and materials. The earlier static-pose decision applied to the storage migration; this copy is explicitly animated.
- Authoring choice: retain the limb-free silhouette and add idle/work loops, place/hit one-shots, gentle hovering and expressive eye blinks. No limbs or new visible parts.
- Original grounded rest pose is retained. Playback uses a nominal 0.18 m hover clearance; all loops and one-shot recovery poses meet at that ready height. Root remains stationary.
- One compact three-bone skeleton controls the body and two eyes. Shell, goggles, ear panels and face remain rigidly attached; eye scaling stays within the face. Keep both original meshes and their palette.
- anchor_action follows the body bone; anchor_ui stays fixed under root. Simulation retains position, targeting and outcomes. Gameplay integration is outside this asset revision.
- The editable v02 Blender file is authoritative. animate_copy.py records the one-time source adaptation and is not a procedural rebuild recipe.

## Place / Resolve refinement — 2026-09-24

- User explicitly requested improvement to Base Copilot v02 Place / Resolve using the animation instructions and skills. The previously reviewed v02 model revision 3 is the animation handoff baseline (source SHA-256 `faefde91c627055507c374a073d8133179bfc06f8fef59b9833022ed3167dd55`, GLB SHA-256 `2fd051fc4a50e490154bc0ba52ecfcaafbb637bb323ef41d4754c45e540456e0`). Existing model appearance, grounding, materials, rig, anchors, Idle, Work and Hit remain authoritative.
- Replace the old descending Place pose with the tower default: full-size cube assembly. Resolve is its reverse digital disintegration. The Blender clips carry matched eye opening/power-down at a constant 0.18 m ready hover height; `tools/asset-presentation/digital-resolve.js` supplies visibility, cyan edge and transient cubes. A GLB player without the presenter shows the pose only.
- Base-specific effect parameters are recorded in `asset.json` and matching root extras: 0.25 m cells, at most 40 cubes (480 additional cube triangles), `#4CF2FF` edge. The conservative combined triangle count is 2,489 + 480 = 2,969. The shared scene budget remains 256 cubes.
- Add the required `move` clip as an in-place hover glide with no limb additions. Root remains stationary; the simulation owns travel and recall timing. Preserve Rest Pose as the unanimated grounded state. The source edit script is `animate_lifecycle.py`; the `.blend` remains the editable authority.

## Persona concept exploration — 2026-09-18

- User direction: Persona variants may use different body colors, redesigned goggles and more buff proportions; explore beyond simple attachments to an unchanged purple head.
- This expands the Persona concept space; the Base source and its existing animation decisions are unchanged. Individual Persona designs remain proposals pending selection.
- Concept sheets and prompts are retained in `references/persona_studies_2026-09-18/`; `exploration_02.md` records the expanded direction and second sheet.
- User feedback on exploration 02: Analyst's tall tapered yellow design looks like a banana and needs changes. Avoid that silhouette/color combination. The replacement proposal is recorded in `references/persona_studies_2026-09-18/analyst_revision_v03.md`; it is not yet a selected final design.
- User feedback on Analyst v03: the new body is better, but the side graph feels wrong; emphasize work items and requirements refinement in its visual identity. The v04 concept replaces the graph with a requirements card and edit pencil; see `references/persona_studies_2026-09-18/analyst_requirements_v04.md`. This visual direction does not change gameplay behavior.

## Cinematic acting — 2026-09-30

User explicitly requested expressive cinematic animation polish for these existing cast models. The retained `cinematic_model_baseline` source/export milestone is the model handoff. Preserve accepted rest art, materials, rig, anchors and all existing gameplay clips. Author only the added story clips on the existing rig; animation authorization is explicit, artistic acceptance remains pending. Editable Blender source now owns the added actions; ordinary guarded export is required. Placement root and gameplay outcomes remain scene/simulation owned. Clip timings: story_talk 3.0s loop, story_listen 3.0s loop, story_alarm 1.5s once, story_determined 2.0s once.

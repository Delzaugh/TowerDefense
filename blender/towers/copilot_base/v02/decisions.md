# Copilot animated copy

- User request, 2026-09-12: copy the existing Copilot asset and improve it with animations.
- Copy copilot_base v01 into v02; preserve the original source and runtime. Inherit existing appearance, dimensions and materials. The earlier static-pose decision applied to the storage migration; this copy is explicitly animated.
- Authoring choice: retain the limb-free silhouette and add idle/work loops, place/hit one-shots, gentle hovering and expressive eye blinks. No limbs or new visible parts.
- Original grounded rest pose is retained. Playback uses a nominal 0.18 m hover clearance; all loops and one-shot recovery poses meet at that ready height. Root remains stationary.
- One compact three-bone skeleton controls the body and two eyes. Shell, goggles, ear panels and face remain rigidly attached; eye scaling stays within the face. Keep both original meshes and their palette.
- anchor_action follows the body bone; anchor_ui stays fixed under root. Simulation retains position, targeting and outcomes. Gameplay integration is outside this asset revision.
- The editable v02 Blender file is authoritative. animate_copy.py records the one-time source adaptation and is not a procedural rebuild recipe.

## Persona concept exploration — 2026-09-18

- User direction: Persona variants may use different body colors, redesigned goggles and more buff proportions; explore beyond simple attachments to an unchanged purple head.
- This expands the Persona concept space; the Base source and its existing animation decisions are unchanged. Individual Persona designs remain proposals pending selection.
- Concept sheets and prompts are retained in `references/persona_studies_2026-09-18/`; `exploration_02.md` records the expanded direction and second sheet.
- User feedback on exploration 02: Analyst's tall tapered yellow design looks like a banana and needs changes. Avoid that silhouette/color combination. The replacement proposal is recorded in `references/persona_studies_2026-09-18/analyst_revision_v03.md`; it is not yet a selected final design.
- User feedback on Analyst v03: the new body is better, but the side graph feels wrong; emphasize work items and requirements refinement in its visual identity. The v04 concept replaces the graph with a requirements card and edit pencil; see `references/persona_studies_2026-09-18/analyst_requirements_v04.md`. This visual direction does not change gameplay behavior.

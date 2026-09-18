# Security — detailed specification

![Security sheet](security_spec_v01.png)

**Status:** Persona design proposal based on the latest front and rear concept sheets. Turnarounds are illustrative; production geometry is not yet authored. The scale-study scene and wireframe are illustrative in every sheet. These sheets do not certify topology, exact orthographic projection or in-game placement scale.

## Purpose and accepted gameplay baseline

Specialist defender that reveals hidden Enemies and deals bonus damage against designated security threats, with reduced Work output.

| Property | Initial playtest design |
| --- | --- |
| Base + Persona | 30 + 20 = 50 Compute |
| Range | 6 map units |
| Action interval | 0.5 s |
| Damage / Work per action | 5 / 3 |
| Damage against security Enemies | 10 per action |
| Ideal damage / Work per second | 10 / 6 normally |
| Footprint radius | 0.4 logical map units |

Threat Scan reveals hidden Enemies only while inside coverage. Other Towers still need their own valid targeting. Threat Response doubles damage against explicitly classified security Enemies; it does not imply damage immunity, taunting or damage absorption.

Gameplay values come from [Tower Base Stats](../../../../../../../docs/Tower_Base_Stats.md), accepted 2026-09-17, with implementation alignment still pending. They are not final balance. Logical map footprint is not the visual model's world-space radius; fit and presentation scaling remain an integration concern. All six Personas are permanent upgrades from a placed Base, not separate placements. Level 1 offers Base, Developer and Tester; Analyst unlocks afterward, Security later, Architect and Linter milestones remain open.

## Visual construction

1. Broad cobalt core with thick white-edged side guards and a strong angular jaw; exaggerate casing volume rather than humanoid muscles.
2. Protective twin-lens brow retains a visible dark face and cyan eyes.
3. Compact temple scan optic has a seated short mount. Shield badge belongs only on the front chin.
4. Rear panel has three broad horizontal ventilation slots and restrained stepped seams.

Keep a floating compact head, dark face and two readable cyan eyes. Use chunky low-poly forms and broad bevels. Preserve the role's palette and proportions rather than forcing every Persona back to the purple Base. Avoid limbs, mouths, military weapons and decorative clutter. Show clean seated connections between shell, trim and independent moving parts.

## Palette and material plan

- Swatch 1: Cobalt shell.
- Swatch 2: Deep navy.
- Swatch 3: Icy white trim.
- Swatch 4: Pale blue lenses.
- Swatch 5: Cyan sensor.

Swatches express concept color roles, not approved production hex values. Prefer a small shared or per-asset opaque palette texture and one material; a second material needs a clear visual purpose. Exact atlas dimensions and UVs remain open. Do not infer an atlas from the empty grid.

## Animation and presentation

Proposed: grounded-feeling slow hover with a deliberate small ready tilt; scanning optic can pivot slightly, followed by a firm work nod. Detection pulses and damage bonuses remain simulation/presentation events.

Proposed clip meanings follow the shared vocabulary: idle for ready hover, place for arrival/settle, hit for non-terminal recoil, and work for sustained direct action where applicable. Analyst instead may use active for support presentation. Clip names, durations and rig must be confirmed in the future asset manifest.

Blender owns editable shape and pose. Simulation owns position, targeting, damage, work completion, rewards and projectile outcomes. Presentation selects clips and effects. Do not bake selection rings, coverage, projectile paths or aura boundaries into the mesh. Target anchors for future authoring: root, anchor_ui, applicable anchor_action and anchor_aura for aura emitters. These are a planning direction, not an already-created interface for the Personas.

## Technical data and authoring targets

| Field | Verified value or status |
| --- | --- |
| Triangles / vertices | - / - |
| Meshes / materials / textures | - / - / - |
| UV layout / texture dimensions | - / - |
| Dimensions / rig / final anchors | - / - / - |
| Production status | Concept imagery; no Persona mesh has been authored in this task |
| Modeling ceiling for this brief | 3,000 triangles |
| Target platform | Browser / mobile; elevated isometric view |
| Preferred material envelope | 1 material, up to 2 when justified |

The shared art guide describes a 1,000-3,000 triangle envelope for Copilot Towers. This brief uses its upper bound as the concept-authoring ceiling. For unbuilt Personas this is a proposal to carry into their future versioned manifests, not a measured count. Do not claim a triangle count from the illustrative wireframe.

## Review checklist before model delivery

- Keep the same shell depth, accessory count, symbol location and lens proportions across all views.
- Resolve side-specific attachments in one authoritative 3D model; generated turnarounds are construction guidance, not geometry truth.
- Check silhouette at phone/game scale and distinguish it without relying on color alone.
- Use continuous geometry for continuous shell regions; intentional seams for trims; explicit sockets and pivots for articulation.
- Keep symbols legible, avoid bevel intersections and ensure eyes stay within the face display through motion.
- Validate actual mesh, textures, UVs, dimensions, rig, root/anchors and named clips through the shared guarded asset pipeline when a model is authored.
- Review fixed front/side/rear, oblique joins, motion extremes and gameplay-scale readability in the Asset Inspector before production delivery.

## Provenance and constraints

- Latest front concept: ../copilot_persona_concepts_v04.png.
- Rear continuation: ../copilot_persona_rear_three_quarter_v01.png; Persona backs remain exploratory.
- User direction: vary Persona colors, goggles and bulk. Analyst must avoid the rejected banana-like taper and graph motif; use work-item/requirements-refinement symbolism.
- Base authority: ../../../copilot_base_v02.blend and ../../../asset.json. The source and runtime have not been changed for these sheets.
- Generated with the built-in image generation tool using the model-spec-sheet template; prompt saved in prompts/security.txt.


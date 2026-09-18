# Developer — detailed specification

![Developer sheet](developer_spec_v01.png)

**Status:** Persona design proposal based on the latest front and rear concept sheets. Turnarounds are illustrative; production geometry is not yet authored. The scale-study scene and wireframe are illustrative in every sheet. These sheets do not certify topology, exact orthographic projection or in-game placement scale.

## Purpose and accepted gameplay baseline

Faster direct output for both productive Work and Enemy damage.

| Property | Initial playtest design |
| --- | --- |
| Base + Persona | 30 + 20 = 50 Compute |
| Range | 5 map units |
| Action interval | 0.4 s |
| Damage / Work per action | 7 / 5 |
| Ideal damage / Work per second | 17.5 / 12.5 |
| Footprint radius | 0.4 logical map units |

No initial passive or special. Role differentiation comes from faster actions and higher damage.

Gameplay values come from [Tower Base Stats](../../../../../../../docs/Tower_Base_Stats.md), accepted 2026-09-17, with implementation alignment still pending. They are not final balance. Logical map footprint is not the visual model's world-space radius; fit and presentation scaling remain an integration concern. All six Personas are permanent upgrades from a placed Base, not separate placements. Level 1 offers Base, Developer and Tester; Analyst unlocks afterward, Security later, Architect and Linter milestones remain open.

## Visual construction

1. Lean orange wedge casing flows into three broad rear fins; use continuous bases and recessed dark gaps.
2. Graphite goggle frame and charcoal lower bumper frame the navy face.
3. Temple code badge is a simple raised or inset brace mark; ivory socket gives an intentional mounting seam.

Keep a floating compact head, dark face and two readable cyan eyes. Use chunky low-poly forms and broad bevels. Preserve the role's palette and proportions rather than forcing every Persona back to the purple Base. Avoid limbs, mouths, military weapons and decorative clutter. Show clean seated connections between shell, trim and independent moving parts.

## Palette and material plan

- Swatch 1: Orange shell.
- Swatch 2: Graphite rim.
- Swatch 3: Warm ivory trim.
- Swatch 4: Dark teal lenses.
- Swatch 5: Cyan eyes.

Swatches express concept color roles, not approved production hex values. Prefer a small shared or per-asset opaque palette texture and one material; a second material needs a clear visual purpose. Exact atlas dimensions and UVs remain open. Do not infer an atlas from the empty grid.

## Animation and presentation

Proposed: restrained forward-ready tilt and quick focused nods during work; short fin/eye light pulse as presentation only. Reuse idle, work, place and hit meanings; no animation-driven action timing.

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
- Generated with the built-in image generation tool using the model-spec-sheet template; prompt saved in prompts/developer.txt.


# Visual Asset Guide

[Master GDD](00_Master_GDD.md) · [Technical Architecture](Technical_Architecture.md) · [Core Gameplay Systems](Core_Gameplay_Systems.md) · [Level 1](levels/Level_01_Just_One_Small_Feature.md)

Owns the visual-asset direction and runtime requirements for 3D models, materials, animation, scale, and asset delivery. It does not define gameplay behavior, map rules, or numerical balance.

## Art direction

**Status: Prototype — chosen visual baseline; exact palette and individual designs remain tunable**

The game uses a bright, friendly, stylized low-poly look led by KayKit's chunky, colorful, cohesive visual language. Kenney assets are supplementary references and prototype material where they match the established palette and material treatment. The world is a landscaped software-infrastructure environment: a welcoming technology campus where natural terrain, paths, and water sit alongside servers, data-centre modules, cooling equipment, cable runs, and energy infrastructure.

The intended feeling is **playful orchestration**, not dark cyberpunk, military combat, or photorealistic simulation. Technology should feel useful, legible, and alive.

### Visual pillars

- **Readable at a glance.** Every gameplay-relevant object is identifiable from the fixed isometric camera and on a phone-sized display.
- **Friendly technical world.** Chunky forms, clean planes, rounded or softly beveled details, and modest animation make infrastructure approachable.
- **Landscape first, infrastructure integrated.** Trees, grass, stone, water, and gentle terrain prevent maps from reading as flat metallic boards.
- **Gameplay meaning is visible.** Silhouette, motion, iconography, and effects reinforce state; color never carries critical meaning alone.
- **Purposeful restraint.** Few materials, controlled emissive details, clean surfaces, and limited visual noise keep moving Work and Problems easy to follow.

### Explicit exclusions

- No dark, cluttered cyberpunk streetscape as the default map language.
- No photorealistic materials, dense micro-detail, or texture-heavy surfaces.
- No generic military weapons aesthetic for Copilots or Problems.
- No visual treatment that makes productive Work look threatening or Problems look rewarding.

## Visual language

**Status: Prototype**

### Form and silhouette

- Treat **Tower** as the umbrella visual/gameplay category and **Copilot** as one specific Tower family. Future Tower types need their own readable identity and must not be presented as Copilots or Personas unless their design explicitly says so.
- Use simple primary forms with one clear focal feature: a screen, status light, antenna, tool arm, cable bundle, or colored panel.
- Give each Tower type—and each Copilot Persona that needs to read as a distinct role—a distinct top-down silhouette before relying on color or UI labels.
- Keep mobile entities compact but deliberately exaggerated: tall shapes, broad heads, oversized tools, or strong side profiles read better than realistic proportions.
- Treat the Product as the map's visual anchor. It should be larger, calmer, and more developed than ordinary infrastructure.
- Make path-adjacent props lower and simpler than the entities travelling on the route; they must frame action rather than hide it.

### Palette and material roles

Use a restrained neutral-and-natural base palette with a small set of semantic accents.

| Role | Visual treatment | Typical use |
| --- | --- | --- |
| Landscape base | Muted greens, warm stone, soil, and water blues | Terrain, foliage, rocks, water. |
| Infrastructure base | Off-white, soft gray, blue-gray, or desaturated metal | Servers, data-centre modules, roads, utilities. |
| Friendly active accent | Cyan, teal, or warm blue emission | Healthy Product systems, neutral Copilot technology, selected state. |
| Productive Work accent | A distinct optimistic warm color plus an icon/progress treatment | Coding tasks and completed-work feedback. |
| Problem accent | A distinct warning color plus a corrupted, unstable, or jagged form | Bugs and other harmful entities. |
| Tester accent | A separate quality-focused accent and visible aura treatment | Tester identity and area effect. |

Exact colors remain open. The final palette must pass common color-vision-deficiency checks: Work, Problems, selection, and warning states need different shapes, iconography, motion, or patterns in addition to color.

Materials should be mostly matte or softly rough. Use emissive screens, LEDs, and pulses sparingly to communicate active technology. Avoid broad reflective metal, transparent model surfaces, and high-frequency texture detail during Alpha.

## World scale and camera readability

**Status: Prototype — initial authoring convention; validate in the first vertical slice**

- Use **one Three.js world unit as one metre**.
- Use a hidden one-unit placement/editor snap grid. The player-facing game may expose free placement within valid areas; the grid is an authoring and validation aid, not a mandatory visible board.
- Author normal enemy/task paths at roughly **3–4 world units wide**, allowing multiple visible moving entities without crowding.
- Give a standard Copilot a nominal **2 × 2 world-unit footprint** and a model height of roughly **2.5–3.5 units**.
- Keep moving Work and baseline Problems within roughly **0.8–1.6 units** tall, but give them visibly different silhouettes and readable progress/status indicators.
- Use a Product silhouette of roughly **6–10 units** at its tallest visible point so it remains a strong destination and growth-reveal focus.
- Oversize click/tap hit areas and range previews relative to fine model features. Interaction must remain reliable on touch screens.

The fixed isometric camera should frame the route, placement space, and Product together. It may support zoom and carefully designed limited adjustment, but map composition must never rely on free camera exploration to reveal essential information.

## Gameplay asset requirements

**Status: Prototype**

| Asset class | Required visual information | Animation / feedback |
| --- | --- | --- |
| Player-controlled unit | Friendly role identity, action origin, and clear selection footprint | A restrained rest pose, readable action response, and runtime placement/selection feedback. |
| Protected objective | Destination/health identity and room for visible growth or recovery | Calm activity plus clear runtime damage, healing, and progression feedback. |
| Beneficial moving entity | Positive intent and remaining-progress readability | Forward motion, a progress display, and a distinct completion response. |
| Harmful moving entity | Threat/readiness and leak-risk readability, clearly distinct from beneficial entities | Movement plus runtime resolve and leak feedback. |
| Recovery or cleanup entity | Repair intent, visibly distinct from reward-bearing work | Progress and recovery feedback that cannot be confused with a reward. |
| Boss-scale threat | A dominant silhouette and reserved space for critical feedback | Strong entrance, active, defeat, and any final encounter feedback. |
| Environment prop | IT-world context without obscuring route or units | Optional subtle screen/fan/cable animation only. |

Every active asset must retain its meaning in motion. Beneficial and harmful entities must remain distinguishable even when they share a path.

## Model, material, and animation budgets

**Status: Prototype — performance envelopes to profile and tune**

The following are authoring targets for the first browser/mobile vertical slice, not hard engine limits.

| Asset class | Triangle target | Material target | Texture guidance |
| --- | ---: | ---: | --- |
| Repeated prop / foliage | 100–800 | 1 shared material | No unique texture where possible. |
| Moving Work or baseline Problem | 400–1,500 | 1 | Shared palette/atlas preferred. |
| Copilot tower | 1,000–3,000 | 1–2 | Shared palette plus small optional detail texture. |
| Major server / landmark | 1,000–4,000 | 1–2 | Reuse materials; avoid unique large textures. |
| Product / boss | 2,000–6,000 | 2–3 | Use detail only where it supports silhouette or state. |
| Terrain module | 500–3,000 | 1–2 | Tile/shared textures; vertex gradients when useful. |

- Prefer small palette textures for new and refined assets. Reuse a compatible atlas where practical; a dedicated tiny palette is appropriate when independently editable colour roles are needed. Avoid bespoke 2K/4K textures.
- Use the smallest texture that represents the artwork: solid palettes commonly need only 32×4–32×16 px. Detail textures normally use 256–512 px. Use 1024 px only where close inspection and profiling justify it, or an imported-atlas exception is recorded.
- Prefer opaque materials. Transparent meshes, excessive bloom, real-time reflections, and many dynamic shadow casters need explicit performance justification.
- Repeated props and frequently spawned Work/Problems must be compatible with batching or instancing.
- Separate detailed render meshes from simple invisible selection, placement, and future gameplay helper shapes.

At the expected maximum of 100 visible moving entities, the scene must remain readable and meet the device-performance goals in [Technical Architecture](Technical_Architecture.md#performance-principles).

## GLB delivery requirements

**Status: Locked**

Each runtime asset must:

- be delivered as a self-contained `.glb` file with no external texture dependencies;
- use metres as its authoring scale, have transforms applied, and have an origin/pivot suited to placement;
- use Y-up orientation and face positive Z unless an asset-family convention documents an exception;
- have the ground-contact point at y = 0 for placeable or moving assets;
- contain only used meshes, materials, textures, animations, and skeleton data;
- use concise, predictable names such as `copilot_base_v01.glb`, `prop_server_rack_a_v01.glb`, and `problem_bug_v01.glb`;
- include named animation clips where relevant, such as `idle`, `move`, `work`, `resolve`, `hit`, or `defeat`;
- be visually inspected in the Three.js runtime before being accepted into the game.

Blender source files are retained separately from optimized runtime GLBs. Source art may be more complex; the shipped GLB must meet the runtime budget.

### Animation ownership and runtime contract

This division is intentional and applies to every animated asset:

| Owner | Responsibility |
| --- | --- |
| Blender source (`.blend`) | The editable source of truth for the model, rig, keyframes, clip timing, loop continuity, clip names, and export settings. |
| Runtime asset (`.glb`) | The versioned, self-contained delivery payload: only the meshes, skeleton, materials, textures, anchors, and named clips required in the browser. It contains animation data, but no gameplay behavior. |
| Asset contract | The required clip names, anchors, and other visual interfaces that an exported GLB must provide. Changes that break this interface require a new asset version or a coordinated runtime change. |
| TypeScript simulation | The authoritative gameplay state and every entity's world position, facing, and timing. It never derives gameplay movement or outcomes from an animation clip. |
| Three.js presentation layer | Clip selection in response to simulation state, loop versus one-shot behavior, crossfades, playback rate, and visual-only effects. State-to-clip mappings belong here or in its versioned presentation configuration, never implicitly in a GLB. |

Runtime code treats a GLB as read-only data. Blender edits become available to the game only after export, validation, and replacement of the corresponding runtime GLB. The game must not depend on an animation completing to advance gameplay; it may observe completion only to return the presentation to a resting clip.

## Bespoke gameplay-asset rules

**Status: Prototype — required for Alpha implementation; refine after first runtime import tests**

Towers—including but not limited to Copilots—Work, Problems, the Product, cleanup items, and bosses are signature game assets. They are built specifically for Copilot Tower Defense rather than sourced from a third-party kit. Every bespoke asset follows the shared style, scale, runtime, and export rules below.

This guide deliberately does not assign budgets, dimensions, or clip lists to named assets. Those implementation-specific contracts belong in the asset's versioned manifest or production brief, alongside its source and runtime paths. This prevents one asset's temporary specification from becoming a project-wide art rule.

### Shared design rules

- Match KayKit's chunky, colorful, friendly low-poly language: strong primary forms, controlled gradients, and one unmistakable focal detail.
- Read clearly in a fixed isometric view at phone scale. Test the model in the target camera before accepting it.
- Communicate gameplay role through a combination of silhouette, a distinctive feature, motion, and optional iconography. Do not depend on color alone.
- Keep player-side assets optimistic and capable. Keep Problem assets unstable, corrupted, or disruptive without becoming frightening, military, or hyper-realistic.
- Keep critical state effects separate from the model whenever possible. Selection rings, range indicators, health/progress bars, targeting lines, Tester auras, and placement-validity feedback are runtime effects, not baked model geometry.

### Model structure and anchors

All bespoke GLBs use one root node named `root` at world origin. Grounded assets place the bottom contact point at `root` with y = 0. Models face positive Z.

Use the following optional, consistently named empty nodes where the asset needs them:

| Node | Purpose |
| --- | --- |
| `anchor_ui` | World-space health, progress, or nameplate placement above the asset. |
| `anchor_action` | Origin for work, resolve, tool, or projectile effects. |
| `anchor_aura` | Centre for Tester aura or other area-effect visuals. |
| `anchor_target` | Point that receives targeting lines and hit/resolve effects. |

- Anchors are child nodes of `root` or the relevant rig bone and contain no render geometry.
- Provide `anchor_ui` on all moving and player-selectable gameplay assets.
- Provide `anchor_action` on each Copilot and `anchor_aura` on Tester.
- The game supplies collision, selection, placement, range, and future gameplay-helper shapes separately. Do not encode them as complex visible meshes.

### Materials and textures

- Prefer one opaque material for Work, Bugs, cleanup items, and repeated moving units; use no more than two for a Copilot or major landmark unless the extra material has a clear visual purpose.
- Use a shared KayKit-compatible gradient/palette atlas wherever practical. Individual hero assets may use a small dedicated 256–512 px texture only when it materially improves readability.
- Texture palettes are the default, not a requirement for every situation. Vertex colours remain appropriate for continuous terrain gradients, procedural per-vertex variation, or another demonstrated authoring/performance benefit. Record the reason in the asset's decisions and declare its actual storage in the manifest. Do not convert an exception merely to make the catalog uniform.
- For solid palette textures, preserve semantic role names and declare material names, image dimensions, sRGB colours and swatch rectangles in `texturePalettes`. Use padded swatch interiors and non-mipmapped linear sampling to prevent colour bleeding. Preserve independent detail/emission maps, their UVs and sampling. Do not add one material per colour.
- Keep editable images packed in the authoritative Blender source and embedded in the delivered GLB. Inspector palette changes are previews; apply accepted colours to Blender and the manifest before guarded export. Procedural rebuilds must preserve the selected texture workflow.
- Bake neither selection state nor gameplay-critical glow into base color textures. Use runtime emissive modulation/effects for active, damaged, selected, or resolved states.
- Avoid transparent material layers, dense decals, tiny text, and intricate surface noise. These are fragile at isometric distance and costly on mobile.
- UVs, normals, and tangent data must be clean. Apply transforms and remove unused material slots before export.

### Rigging and animation

- Static props need no skeleton. Moving assets may use either simple transform animation or a compact skeletal rig.
- Copilots and animated Problems use one skeleton, one skinned mesh where practical, and a compact rig with a target maximum of 32 deform bones.
- Author loops at 24 or 30 frames per second. `idle`, `move`, `work`, and `active` loops should normally remain 0.8–2.5 seconds long and loop cleanly.
- Keep clips expressive but restrained. Readable body motion, screen pulses, tool movement, and small anticipation are preferred over rapid or noisy motion.
- Root motion is disabled. The simulation controls every moving entity's world position, rotation, and timing.
- Export clips with the exact names declared in the asset's versioned contract. Additional clips use clear lowercase snake-case names.
- A clip changes pose only. It must not encode authoritative path movement, targeting, damage, spawning, resolution, or any other gameplay outcome; those remain simulation-owned.

### Clip naming vocabulary

Use the following shared vocabulary whenever an asset needs the corresponding motion. It defines clip meaning and playback shape, not a mandatory per-asset list; static assets export no clips, and an asset contract selects only the names it needs.

| Clip | Playback | Meaning |
| --- | --- | --- |
| `idle` | Loop | Default resting or ready pose. |
| `move` | Loop | In-place locomotion while the simulation controls world movement. |
| `work` | Loop | Sustained primary action, such as producing, repairing, or resolving a target. |
| `active` | Loop | A sustained engaged state that is visibly distinct from `idle`. |
| `spawn` | One-shot | Entry into play after the simulation has created the entity. |
| `place` | One-shot | A player-controlled unit becoming established in the world. |
| `hit` | One-shot | Non-terminal impact or damage reaction. |
| `resolve` | One-shot | Work, a Problem, or another removable entity being successfully handled and leaving play. |
| `complete` | One-shot | Beneficial or recovery work finishing successfully. |
| `heal` | One-shot | A protected objective visibly recovering. |
| `defeat` | One-shot | Terminal defeat of a boss or other entity whose identity is defeated rather than resolved. |

Names are lowercase snake_case with no asset-name prefix, tense variation, or redundant suffix such as `_loop`. Use `work`, rather than action-specific aliases such as `attack`, `shoot`, or `cast`, when the shared gameplay meaning is sustained work. Do not use `active` as an alias for `idle`, or a model-specific name such as `aura_idle` for a runtime-owned effect.

Work-category assets require `idle` and `move` loops plus a one-shot `resolve` clip (user decision, 2026-09-12). Their progress controls remain independent of these body clips. `resolve` presents successful removal after the simulation's decision; it never completes work or changes checklist state itself. Individual manifests retain their exact timings and any additional clips.

An asset-specific clip that has no shared meaning needs a descriptive lowercase snake_case name and a one-line definition in that asset's manifest. A new name with cross-asset meaning must be added to this table before export.

### Acceptance checklist

Before a bespoke asset is accepted into the game, verify that it:

- is recognizable at default camera distance on a phone-sized viewport;
- respects its scale, triangle, material, and texture budget;
- has correct `root` placement, orientation, and required anchors;
- contains only required meshes, materials, textures, nodes, and animation clips;
- loads as a self-contained GLB in a Three.js test scene without warnings;
- uses the approved palette/material language and remains visually distinct from opposite gameplay categories;
- has its Blender source file, source version, and exported GLB recorded in the asset-source inventory.

## KayKit-led prototyping policy

**Status: Prototype**

KayKit is the approved primary asset family for early visual prototyping. Its shared chunky forms, colorful gradient materials, and low-poly readability establish the art direction.

| Role | Approved source/style |
| --- | --- |
| Overall visual language | KayKit: chunky, colorful, friendly, and cohesive. |
| Natural map landscape | [KayKit Forest Nature](https://kaylousberg.itch.io/kaykit-forest). |
| IT/server infrastructure | [KayKit Space Base Bits](https://kaylousberg.itch.io/space-base-bits), selectively adapted away from an outer-space-colony reading. |
| Campus/building scenery | [KayKit City Builder Bits](https://kaylousberg.itch.io/city-builder-bits). |
| Quick blockout/prototype objects | [KayKit Prototype Bits](https://kaylousberg.itch.io/prototype-bits). |
| Supplemental roads/industrial scenery | [Kenney City Kit: Roads](https://kenney.nl/assets/city-kit-roads) and [City Kit: Industrial](https://kenney.nl/assets/city-kit-industrial), only after matching KayKit's palette and material treatment. |

Kenney is an approved supplement, not a competing visual direction. Use selected Kenney props only where KayKit has no appropriate equivalent, and adjust them when necessary so they belong to the same world.

Use the selected kits as a coherent prototype foundation, not as an excuse to mix incompatible styles. Other third-party collections are not part of the Alpha visual direction unless this guide is deliberately updated.

Bespoke game-defining assets take priority as production work progresses:

- Copilot personas;
- Product and its growth states;
- Work, Problems, Technical Debt cleanup, and bosses;
- signature server/data-centre structures and visual effects.

Keep a lightweight asset-source record for every imported third-party asset, including its source URL, creator, license file, original filename, modifications, and the shipped asset name. CC0 does not normally require attribution, but provenance remains valuable for maintenance and license review.

## Reusable asset strategy

Prefer reusable terrain, route, infrastructure, unit, and effect families over decorative one-off models. Build a map from modular pieces first; new art earns its place only when it improves gameplay readability, thematic storytelling, or necessary variety. Individual roster and production requirements belong in content and asset-planning documents, not this guide.

## Open art decisions

**Status: Open**

- Exact palette values and accessibility validation.
- Copilot mascot anatomy, face/display language, and animation style.
- Whether Work is represented as a physical delivery object, floating task card, miniature feature package, or another abstraction.
- Bug visual language: mischievous creature, glitching code object, corrupted drone, or a hybrid.
- Exact road/path visual metaphor for the SDLC journey.
- Final camera height, angle, and default zoom after mobile playtesting.

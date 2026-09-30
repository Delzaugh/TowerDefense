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

For bespoke models, resolve primary volume, proportions and negative spaces before
small details. Use reference landmarks and comparable front, side and game views
to judge fidelity; the presence of recognizable accessories is insufficient.
Low-poly style calls for deliberate planes and curves, not an automatically flat
front or a generic primitive body. Fit rigid accessories to the resolved form.
Budgets constrain delivery; additional triangles do not establish quality.

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

The working shared colours and explicit exceptions are recorded in
[Shared_Palette.json](Shared_Palette.json), with the roster findings in
[Palette_Consistency_Review.md](Palette_Consistency_Review.md). User direction,
2026-09-26: preserve character identities and unify supporting neutrals and small
accents. Developer and Linter share graphite `#333E48`; Developer, Linter and
Security share display black `#041D2A` and small cyan marks `#00E5EF`. Security's
navy casing remains an identity exception. These are source-authored colours,
not runtime tints or instructions to normalize every similarly named swatch.

Treat shared palettes as **extensible references**, not an exhaustive colour list.
Reuse established neutrals and accents when their material role, value and hue fit
the design. Merge near-duplicate shades where doing so preserves useful contrast.
Introduce a new colour when character identity, material, setting or game-scale
readability benefits; record it in the asset's colour contract and decisions.
Add a shared token when reuse is useful; a one-off colour can remain asset-local.
Review related assets together at authored scale under the same lighting.

There is no universal colour-count limit. Prefer a compact, purposeful palette;
explicit user limits apply only to the assets and refinement they concern. Keep
accepted source/export colours stable until a colour change is part of the task.
Validation checks that delivery matches that asset's declared design, rather than
requiring every model to draw from a global whitelist.

The six production Problems use [Problems_Palette.json](Problems_Palette.json)
to record their accepted family mappings. The 2026-09-27 iteration explored eight
colours, then reduced Vague Spec and Missing Details to seven at the user's request.
The resulting five-to-seven counts describe these deliveries, not a rule for new
Problems, other asset families or future authorized refinements.
Semantic roles can share a value; lighting and independent emission masks do not
count as additional base colours. Preserve character identities and merge redundant
supporting shades first. See [Problems_Palette_Review.md](Problems_Palette_Review.md)
for the delivered comparison, counts and evidence. This consolidates authoring
colours; each asset still has its own embedded palette.

Retain the approved campus slate/teal family: chalk `#E2EDF0`, architectural
slate `#89A4B8`, path `#48647D`, path signals `#82DADD`, and foliage `#70B5B4`.
The approved home-campus ground `#354B64` is local to that setting. Warm paper,
clothing, skin, brands, imported atlases and biome variants retain their intended
differences. Match equivalent materials within a family before matching across
unrelated subjects. Preserve separate emission maps when editing base colours.

Colour is not an allegiance key: Lag Spike uses cyan, Spaghetti uses lime/orange,
and Bug and Security both use blue. Work, Problems, selection and warning states
need different shapes, iconography, motion or patterns in addition to colour.
Common colour-vision-deficiency checks in the final gameplay camera remain open;
the roster's grayscale check assesses luminance only.

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

Towers and enemies have a baseline animation set: **Rest Pose, Idle, Work,
Walk/locomotion, Place, Hit and Resolve** (user decision, 2026-09-24). Rest Pose
is the unanimated bind/rest state; it is not a constant animation clip. The six
exported names are `idle`, `work`, `move`, `place`, `hit` and `resolve`.
For enemies, `spawn` fulfills the arrival slot in place of `place`; preserve an
existing arrival interface and do not export duplicate aliases.
`move` is the existing runtime name for Walk/locomotion; use walking, rolling,
gliding or hovering according to the anatomy and recorded user choices.

Deliver and review the model first. At that handoff, ask whether the user wants
the baseline animations added, with the preview available for model review.
Wait for their answer before starting animation unless they have already
authorized that continuation. Record the reviewed model revision/hash, consent
or deferral, locomotion choice and clip plan beside the source. A model-only
delivery is a valid review milestone, but is not animation-complete. Do not add
empty clips to claim coverage. Existing assets with missing clips remain an
explicit backlog; preserve their working interfaces until their animation pass.

Use the dedicated project skill `.agents/skills/game-asset-animation/SKILL.md`
for this pass. Preserve accepted rest geometry, materials and anchors. The
manifest lists the clips actually authored for the current delivery; the brief
records planned clips while awaiting the user's animation decision. Environment
props and other deliberately static assets need no invented motion.

The following vocabulary defines shared meaning and playback. Additional clips
are selected according to the asset's role.

| Clip | Playback | Meaning |
| --- | --- | --- |
| `idle` | Loop | Default resting or ready pose. |
| `move` | Loop | In-place locomotion while the simulation controls world movement. |
| `work` | Loop | Sustained primary role action: a tower operates or an enemy performs its characteristic disruptive action. Pose only; no damage or task outcome is encoded. |
| `active` | Loop | A sustained engaged state that is visibly distinct from `idle`. |
| `spawn` | One-shot | Entry into play after the simulation has created the entity. |
| `place` | One-shot | Establishment/arrival at an already simulation-assigned position, for a tower or enemy. Existing `spawn` clips retain their creation/entry meaning. |
| `hit` | One-shot | Non-terminal impact or damage reaction. |
| `resolve` | One-shot | Successful removal: Work completes, a Problem is handled, or a tower is recalled/powered down. The simulation already owns that decision. |
| `complete` | One-shot | Beneficial or recovery work finishing successfully. |
| `heal` | One-shot | A protected objective visibly recovering. |
| `defeat` | One-shot | Terminal defeat of a boss or other entity whose identity is defeated rather than resolved. |
| `story_talk` | Loop | Cinematic dialogue acting through the existing anatomy: emphasis, eyeline, small head/body gestures and blink. Does not imply lip sync or generate dialogue. |
| `story_listen` | Loop | Cinematic attentive listening, distinct from speaking and baseline idle. |
| `story_alarm` | One-shot | Cinematic recognition of danger, with readable anticipation and startled expression. |
| `story_determined` | One-shot | Cinematic settle into a purposeful pose; presentation may hold its terminal expression. |

Names are lowercase snake_case with no asset-name prefix, tense variation, or redundant suffix such as `_loop`. Use `work`, rather than action-specific aliases such as `attack`, `shoot`, or `cast`, when the shared gameplay meaning is sustained work. Do not use `active` as an alias for `idle`, or a model-specific name such as `aura_idle` for a runtime-owned effect.

Work-category assets require `idle` and `move` loops plus a one-shot `resolve` clip (user decision, 2026-09-12). Their progress controls remain independent of these body clips. `resolve` presents successful removal after the simulation's decision; it never completes work or changes checklist state itself. Individual manifests retain their exact timings and any additional clips.

An asset-specific clip that has no shared meaning needs a descriptive lowercase snake_case name and a one-line definition in that asset's manifest. A new name with cross-asset meaning must be added to this table before export.

The standalone story experiment is authorized to add acting clips beside the
shared character rigs (user decision, 2026-09-30). Preserve existing gameplay
clips and model identity. Cinematic world blocking and story beats belong to
the isolated presentation timeline; the GLB still contains pose-only clips.
Asset-specific startle, struggle, reach, creep, grab and haul clips retain their
exact definitions, periods and any measured gait distances in their manifests
and source decisions. These additions do not mandate cinematic clips on the
rest of the roster.

### Category arrival and resolution effects

**Tower default (user decision, 2026-09-24):** `place` assembles the tower from
digital cubes; `resolve` disintegrates it using the same effect in reverse. Use
the Developer's shared digital-block presentation implementation as the visual
baseline. This default applies to every tower's authorized animation pass, with
asset-specific timing, cell scale and fragment budget recorded in its manifest.
Keep the model at full size; the dissolve changes visible coverage rather than
shrinking the entire body. Place must finish at the ready/Idle pose, Resolve must
finish invisible, and replay/Rest Pose must reset all effect state. Preserve
explicit user overrides. Existing towers adopt this during their next animation
pass; the default is not authorization for a bulk asset migration.

The model-review handoff and animation consent still apply. An authorized tower
animation pass includes this established effect without asking the user to choose
its style again. Blender owns any matching pose tracks and the exported effect
parameters; presentation owns the shader and transient cubes. See
`tools/asset-presentation/README.md` for the shared implementation and integration
contract. Review the combined result in the Inspector, including phone scale,
entry/exit endpoints, ready transitions, replay, shadows and pooled FX limits.
Record the runtime renderer hash alongside source/GLB hashes. Account for model
and effect costs separately, and check any declared combined triangle ceiling.

**Enemy default (user approved, 2026-09-24): Glitch breach.** Spawn reveals the
full-size body through jagged bands and a brief registration glitch, with no
portal (`spawnPortal: false`). Resolve uses a debugging sweep and thin horizontal
streaks. Bug is the approved reference; its initial review milestone is complete.
Apply this default during authorized enemy animation passes, preserving explicit
asset overrides. The user has authorized rollout to the remaining production
enemies; comparison/experimental assets stay outside that rollout.

**Work/task default (user approved, 2026-09-24): Blueprint.** Spawn traces the
model's outline, then fills it with an upward scan. Resolve shows a separate
confirmation mark and carries the result away with a clean upward sweep, without
rising lines or ribbons. Coding Task is the approved reference. This refers to Work-category
assets, not the looping `work` action. Preserve independent checklist/progress
controls and their default unchecked state; the effect must not award work or
expose alternate geometry hidden inside the model during a cut.

These category effects retain full body scale and use dedicated entry/exit
timelines. Record parameters in `presentation.lifecycle` and matching root
`lifecycle_effect` extras. Preserve existing `spawn`/`place` interfaces; add
`spawn` when an enemy or Work asset has no arrival clip, rather than silently
renaming a working clip or exporting duplicate aliases. New effects still need
the model-first authorization and actual-renderer review described above.
Fit effect geometry to each asset's combined triangle ceiling. Enemy streaks cost
12 triangles each plus the 12-triangle sweep; reduce the streak budget when
needed instead of changing approved model geometry. Category defaults do not
implicitly authorize unrelated asset migrations or gameplay integration.

### Acceptance checklist

Before a bespoke asset is accepted into the game, verify that it:

- follows its reference priorities and major landmarks, with any view inconsistencies resolved in its source decisions;
- has clean attachments, intended thickness and controlled shading in close and reverse views, not just a readable silhouette;
- is recognizable at default camera distance on a phone-sized viewport;
- respects its scale, triangle, material, and texture budget;
- has correct `root` placement, orientation, and required anchors;
- contains only required meshes, materials, textures, nodes, and animation clips;
- loads as a self-contained GLB in a Three.js test scene without warnings;
- uses the approved palette/material language and remains visually distinct from opposite gameplay categories;
- has its Blender source file, source version, and exported GLB recorded in the asset-source inventory.

Complete a second author review of the finished export after the initial repair
pass, scaled to the change. Record reference fidelity, construction, readability
and relevant motion separately from technical validation and user acceptance.
The record must identify the reviewed source/export hashes and useful evidence.
New file identities make an earlier review stale; explicit user rejection
supersedes the corresponding positive assessment. These are author self-checks,
not additional user approval gates. See the game-asset workflow for execution
and the asset-pipeline README for review records and checks.

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

- Accessibility validation in the final gameplay camera; palette extensions as new characters, materials and settings need them.
- Copilot mascot anatomy, face/display language, and animation style.
- Whether Work is represented as a physical delivery object, floating task card, miniature feature package, or another abstraction.
- Bug visual language: mischievous creature, glitching code object, corrupted drone, or a hybrid.
- Exact road/path visual metaphor for the SDLC journey.
- Final camera height, angle, and default zoom after mobile playtesting.

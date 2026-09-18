# Technical Architecture

[Master GDD](00_Master_GDD.md) · [Core Gameplay Systems](Core_Gameplay_Systems.md) · [Content Design](Content_Design.md) · [Level 1](levels/Level_01_Just_One_Small_Feature.md)

Owns the agreed technology direction, runtime boundaries, persistence approach, asset pipeline, and map-authoring workflow. Gameplay rules remain owned by the existing design documents; this document does not introduce new mechanics or tuning.

## Technology direction

**Status: Locked**

Copilot Tower Defense is a browser-first, single-player game. It must be usable on desktop, tablet, and phone from the first playable release.

The game uses a real-time 3D scene with a fixed isometric presentation. Towers, Work, Problems, Product, terrain, and environment props are low-poly 3D models. The game does not require free-roaming or exploratory camera control.

| Concern | Chosen technology / approach | Responsibility |
| --- | --- | --- |
| Language | TypeScript | Simulation, content definitions, client, and tools. |
| 3D rendering | Three.js | Rendering, cameras, model loading, lighting, picking, and scene presentation. |
| Interface | React | Responsive HUD, menus, tower panels, wave previews, planning controls, and save management. |
| Build tooling | Vite | Local development, production builds, and static-site deployment. |
| 3D asset format | GLB / glTF | Optimized browser delivery of models and animations. |
| Persistence | IndexedDB | Local campaign state and full-state between-wave saves. |
| Hosting | Static hosting/CDN | The Alpha has no required game backend, account system, or login. |

Unity, Unreal, and a server-hosted game backend are not part of the Alpha technical direction. A more engine-like web framework is unnecessary unless a later approved requirement materially changes the game’s browser, rendering, or simulation needs.

## Runtime architecture

**Status: Locked**

The runtime separates the authoritative game simulation from presentation and interface code.

```text
Validated content + restored level state
                    ↓
           Pure TypeScript simulation
           ↑ commands       ↓ snapshots/events
                Game session
          ↙          ↓          ↘
 Three.js scene   React UI    Input/audio

Game session ↔ IndexedDB persistence
Game session → Campaign progression → persisted unlocks/growth
```

- The simulation owns waves, path travel, Work progress, Problem resolution, Compute, Product health, Technical Debt, tower state, targeting, victory, and failure.
- Three.js renders the current simulation state. It does not own game rules or save-state decisions.
- React owns screen-space and responsive interface elements. It does not run the frame-by-frame simulation.
- The simulation uses a fixed update step. Time-speed controls apply a deliberate multiplier to simulation time, keeping 1x/2x play, spawn schedules, targeting commitment, and saved state consistent.
- Maps and wave scripts are authored data, never gameplay logic embedded in renderer components.

This boundary supports the data-driven authored-wave requirement in [Core Gameplay Systems](Core_Gameplay_Systems.md#wave-lifecycle), makes tuning safe, and keeps the game testable without a rendered scene.

## Project layout and integration

**Status: Prototype — core foundation implemented; gameplay and Three.js integration pending**

Use one application under `game/`, alongside the existing `docs/design/`, `blender/`, `assets/`, and `tools/` trees. [Codebase Structure](../Codebase_Structure.md) owns the detailed folder map, dependency rules, asset build contract, and verification plan. [Game application](../../game/README.md) provides development commands, and [Foundation Implementation](../Foundation_Implementation.md) records current coverage.

- `game/src/session/` coordinates the fixed-step loop, player commands, snapshots/events, and browser adapters. The simulation validates commands and owns gameplay clocks and outcomes. React subscribes to view data rather than running simulation ticks.
- `game/src/progression/` owns pure campaign unlock and committed-growth rules. The session coordinates atomic, idempotent persistence of successful run results; level-local state stays in the simulation.
- `game/src/content/` groups pure schemas, reusable definitions, maps, level/wave scripts, and tutorials. Maps provide logical placement and visibility geometry independently of their models. Rendering uses the same instance data for previews and visuals.
- `game/src/rendering/`, `ui/`, `input/`, `audio/`, and `persistence/` adapt the browser and presentation to that core. Public state/command/event types remain with their owning modules, avoiding an unbounded shared module.
- Registered GLBs remain in `assets/runtime/<category>/`. A catalog-aware Vite adapter must resolve explicitly selected asset versions for development and generate a minimal browser index plus runtime copies in build output. That adapter is not yet implemented; source art, review artifacts, and imported packages must not be shipped through a broad public-directory copy.
- Existing asset production and inspection tools remain independently runnable. Add the internal map editor only after the first vertical slice validates its needs, using the same content schemas.

The current application uses one pure TypeScript encounter runtime for Work/Problem traffic, generic Tower placement, local Area/Cone targeting, work/damage actions, QA Aura, modified movement/rewards, Product outcomes, and snapshot restoration. Definitions separate Copilot/Human family from targeted/passive behavior, explicit capabilities/controls, and optional per-type placement caps. Owned upgrades, explicit ability grants, and timed external numerical modifiers are implemented. The [unified React/SVG test map](../Unified_Test_Map.md) exposes Base Copilot and QA diagnostic probes, memory captures and validated local saves. Multi-wave orchestration, the playable Persona tree, tuned Level 1 content, campaign progression, and Three.js/GLB delivery remain unimplemented. See [Tower Foundation Implementation](../Tower_Foundation_Implementation.md).

The [test-map mechanics layer](../Test_Map_Mechanics.md) adds explicit diagnostic coverage alternatives per Tower, planning-only drag aiming, a pure wave-recipe compiler, repeatable starting-defense blueprints, authored logical path width with Tower clearance, and self-contained custom scenario saves. Content/snapshot rules are version 6; save envelopes are version 5 and the current databases use their `v6` names. Restoration replays a bounded accepted-command journal and compares the complete state to validate dynamic movement, rewards, effects, and upgrades. Earlier save databases remain untouched. Production Towers still have one authored shape unless their content explicitly opts into alternatives.

## Accepted roster implementation follow-ups

**Status: Accepted design, pending implementation.** The [seven-Tower baseline](../Tower_Base_Stats.md#tower-overview-and-playtest-stats) and its separate ability specifications are the content targets. They do not imply that the current targeted/passive schema already executes all of these behaviors or that all seven are required for Level 1.

- Persona transitions must be explicit, permanent and purchased atomically, applying the accepted costs, stats, capabilities and controls. A transition can remove a main action (Analyst), narrow it to Enemies (Architect), or replace individual targeting with a radial action (Linter). No dummy Work, damage or target state should remain for unsupported behavior.
- Analyst needs kill-event coverage checks, one generated Work item per qualifying Enemy, and a continuous Developer-only speed modifier driven by range/obstacles. Existing timed modifier support does not implement this emitted buff aura. Generated Work requires deterministic IDs, scheduling, ordinary reward/debt handling and encounter-completion accounting; save/replay and repeated attempts must not duplicate generation.
- Security needs explicit Enemy classification, hidden/revealed eligibility and coverage-based detection, plus its specialist damage modifier. Reveal does not bypass another Tower's range or obstacle checks.
- Architect needs Enemy-only committed targeting and authoritative impact-area damage with collision checks from impact. Its commitment and firing clocks remain independent. Projectile/impact timing requires a concrete specification before implementation.
- Linter needs a timed radial-volley behavior without an individual target, straight projectile travel, first-hit/range/obstacle termination and deterministic collision resolution. Projectile speed and hit geometry remain implementation specifications, not inferred from animation.
- New action/effect state, generated entities and projectiles must participate in snapshots, command replay, repeat attempts and terminal-state checks. Presentation renders authoritative outcomes; it does not decide hits, rewards or target eligibility. Extend definitions and UI only for the applicable behavior, with the existing modifier/overlap boundaries preserved.

The Base values already match the initial baseline. The Tester probe's 3 Work/damage and +2 Compute remain older fixtures; production targets are 5 Work/damage and the documented QA bonus. Playable Persona transitions, the four later Personas and their additional abilities are not implemented by this documentation update.

## Tower-family extension boundary

**Status: Locked — architectural direction; Human / Special Tower implementation is Future**

The core must support adding and refining Human Towers alongside Copilot Towers without treating Humans as Copilot Personas. Senior Developer and People Manager are classified in [Content Design](Content_Design.md#human-towers-and-supporting-characters).

- Keep shared identity, placement, cost, geometry, and instance lifecycle reusable. Extend validated definitions with explicit family and behavior contracts when a new family is implemented; family identity must not force every member to use the same action model.
- Keep Persona, Model, and other AI-agent progression specific to eligible Copilots. Human Towers declare their own capabilities, supported controls, and progression. UI controls must follow these declarations rather than assume every Tower starts as a Base Copilot.
- Support authored per-type placement restrictions alongside total map capacity. Senior Developer's one-per-map rule must eventually be checked by authoritative placement and save/restore validation, with a readable rejection reason in the UI. Future variants must not accidentally bypass a shared identity restriction; the grouping contract is still to be designed.
- Route applicable shared stats and future modifiers through the common deterministic resolver. Introduce separate behavior contracts for new actions or support effects when needed, rather than encoding them as artificial Copilot stats or renderer logic.
- Allow a Tower's main action and passive abilities to run independently. Ability stats must support eligible upgrades and external modifiers, with explicit source/lifetime tracking and deterministic resolution. Keep enhancement of one ability separate from overlap/stacking between emitted effects; the Tester's modifiable QA Aura is the first concrete use case. See [ability and effect modifiers](../Tower_Base_Stats.md#ability-and-effect-modifiers).
- Keep People Manager outside placeable Tower definitions and simulation instances. Reusing character art for player-facing support does not imply Tower mechanics; asset storage alone never determines gameplay identity.

**Current code boundary:** `game/src/content/schemas/encounter.ts` accepts `towerDefinitionSchema`, separating family from targeted/passive behavior. `game/src/simulation/encounter/towers.ts` enforces both overall and per-type limits. Human definitions using these existing behaviors can be authored through content; genuinely new behaviors still require coordinated schema, execution, UI, and saved-state changes. QA Aura, upgrades, external modifiers, and repeat/save support are exercised by diagnostic fixtures. No playable Human design or Copilot Persona tree is supplied by these mechanics.

No Human Tower definitions, placeholder abilities, supporting-character system, or speculative general framework are required now. Preserve these boundaries as Alpha develops and implement the extensions against concrete future designs.

## Browser and device support

**Status: Locked**

Desktop, tablet, and phone are equal launch platforms.

- Use a responsive React layout and a Three.js canvas that adapts to viewport size and pixel density.
- Support mouse and touch from the first playable release. Touch interactions use tap-to-select, tap-to-place, drag-to-pan, and pinch-to-zoom patterns; controls must not rely on hover alone.
- Keep the camera fixed to the designed isometric presentation. Zoom and limited, deliberately designed camera adjustments may be supported, but free exploration is not a core requirement.
- Maintain clear minimum tap-target sizes and reserve screen space for core controls on narrow displays.
- Target an expected maximum of 100 simultaneously visible moving Work and Problem entities. This is within scope for a low-poly Three.js game when repeated assets, materials, and effects are managed efficiently.

## Performance principles

**Status: Locked**

- Treat phone and tablet performance as a first-class constraint throughout development.
- Use compact, low-poly GLB models, shared materials, and compressed or carefully sized textures.
- Batch or instance repeated enemies, tasks, and environment props where appropriate.
- Keep visual effects, dynamic lights, and real-time shadows scalable by device capability; gameplay must not depend on a costly visual effect.
- Use simplified logical shapes for selection and placement validation rather than detailed rendered meshes.
- Establish performance budgets during the first vertical slice and validate representative waves at the 100-visible-entity target.

The visual style is deliberately stylized low-poly rather than photorealistic. This supports readability, fast loading, and stable performance without compromising the game’s 3D identity.

## Persistence and local state

**Status: Locked**

The Alpha is single-player and requires neither an account nor a network connection to save progress.

IndexedDB stores:

- persistent campaign state, including permanent unlocks and committed Product growth;
- player settings, including appropriate accessibility and graphics preferences;
- full-state saves at permitted between-wave stopping points.

Between-wave saves must preserve the exact state required by [Core Gameplay Systems](Core_Gameplay_Systems.md#between-wave-saves): Product health, Compute, Technical Debt, Product Progress, placed towers, Persona choices, upgrades, modes, priorities, current/next wave progression, relevant boss state, and all other level-local state needed to resume without altered outcomes or duplicated rewards.

Mid-wave saving is not required for Alpha. An import/export backup feature may be considered later, but it is not an Alpha dependency.

## Assets and map authoring

**Status: Locked**

The project uses a hybrid, code-and-visual authoring workflow.

### Assets

- Blender is the primary creation tool for low-poly models, animations, terrain modules, servers, props, towers, Work, Problems, and Product visuals.
- Assets are exported as optimized GLB files for browser use.
- Visual source files and runtime asset files are separate from gameplay rules.
- [Asset storage](../../assets/README.md) defines category/version locations, registry/manifest authority, third-party inputs, and catalog-only runtime loading.
- [Visual Asset Guide](Visual_Asset_Guide.md) owns the project’s style, scale, performance-budget, and asset-delivery requirements.
- For animation, Blender owns authored motion and the GLB carries the exported clip data; the simulation owns gameplay state and transforms, while the Three.js presentation layer owns clip playback and transitions. The detailed interface and change rules live in the Visual Asset Guide’s **Animation ownership and runtime contract**.

### Maps

Maps are versioned, validated data files separate from the visual model assets. A map definition describes the gameplay-relevant scene composition, such as:

- terrain and environment asset references;
- positioned and transformed prop instances;
- camera framing and approved presentation settings;
- authored road/path geometry and spawn/destination points;
- buildable and prohibited placement areas;
- gameplay collision shapes for placement validation and line-of-sight blocking, including a blocker flag on relevant prop instances;
- tower line-of-sight data (Area or forward-facing Cone) and authored facing/orientation where a tower uses a Cone;
- a reference to its wave script and presentation-specific metadata.

The simulation must use simple, validated helper shapes rather than render meshes for placement and line-of-sight tests. A Server building, for example, has one map-owned footprint that both rejects placement and blocks sight; the GLB only presents that authored gameplay instance. Separating map data from GLB files makes the content reviewable, testable, and safe to tune without re-exporting art. It also prevents visual layout from silently becoming the only source of gameplay logic.

### Authoring phases

1. The first vertical-slice map is created from versioned data files with lightweight in-development placement helpers.
2. The team validates the core loop, mobile interaction, asset pipeline, performance, and save format.
3. A focused internal visual map editor is built when the validated authoring needs justify it. It uses the same Three.js assets and map-data format as the shipped game.

The internal editor is a development tool, not an Alpha player-facing feature. It supports visual map composition and map-data editing; it does not replace the TypeScript simulation or duplicate wave and gameplay rules.

## Alpha boundaries

**Status: Locked**

- Alpha uses authored maps and data-driven encounters, beginning with the single readable Level 1 map.
- Alpha needs the selected browser stack, asset pipeline, responsive input support, local persistence, and an implementation-ready map-data format.
- Alpha does not require a backend, online multiplayer, player accounts, cloud saves, procedural maps, a player-facing map creator, or a full internal editor before the core vertical slice is proven.
- Alpha includes data-driven tower line of sight, blocker-aware target validation, and prohibited placement footprints. Initial maps include a Server building that blocks sight and rejects tower placement on its footprint.

## Decisions intentionally left open

**Status: Open implementation choices**

- Finer-grained module splits as implementation grows; the initial folder/package layout is recorded in [Codebase Structure](../Codebase_Structure.md).
- Specific schema-validation, testing, audio, analytics, and asset-compression libraries.
- Graphics-quality tiers, performance budgets, and device support floor after first-slice profiling.
- Whether limited discrete camera rotation improves usability without reducing map readability.
- The exact feature set and timing of the internal visual map editor after the first vertical slice.

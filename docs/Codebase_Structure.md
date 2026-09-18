# Codebase structure

Status: Prototype implementation layout, reviewed against the current design on 2026-09-12. The core foundation and diagnostic console are implemented; [Foundation Implementation](Foundation_Implementation.md) distinguishes working code from planned gameplay and asset integration below.

[Technical Architecture](design/Technical_Architecture.md) owns technology and runtime boundaries. This document owns folder responsibilities and implementation conventions. Gameplay and tuning remain in their existing design documents.

## Review findings

The proposed single application under `game/` fits the browser-first Alpha. The original layout needs these refinements:

- Add `session/` to connect the fixed-step simulation, browser frame loop, commands, presentation, and persistence. React's render lifecycle must not become the game loop.
- Add `progression/` for permanent unlocks and committed Product growth. These differ from level-local Compute, debt, health, and Product Progress.
- Group maps, levels, waves, tutorials, and definitions under `content/`. Map geometry and encounter pacing need distinct files but one validated content boundary.
- Keep public simulation state, commands, events, and queries with their owning module. Avoid an unbounded `shared/` folder.
- Use the established category/version asset tree and catalog. The earlier generic `assets/runtime/models/` and `assets/source/` proposal is superseded by the existing asset policy.
- Include browser interaction and performance scenarios in the verification plan alongside simulation, content, and save tests.

## Folder map

```text
Tower/
  README.md
  AGENTS.md
  design/                         # Game design and visual direction; existing
    levels/                       # Human-readable level specifications
  docs/                           # Developer documentation
    Codebase_Structure.md
  game/                           # One future application/package
    public/                       # Small static site files only
    src/
      app/                        # React shell, screens, composition and settings UI
      session/                    # Runtime coordinator, clocks and command bridge
      simulation/                 # Pure authoritative level rules and state
      progression/                # Pure campaign unlock/growth rules and state
      content/
        schemas/                  # Pure definitions and validation
        definitions/              # Tower, persona, work, problem, upgrade tuning
        maps/                     # Versioned map composition and logical geometry
        levels/                   # Level roster, waves, sprint/boss tuning, rewards
        tutorials/                # Authored teaching prompts and trigger definitions
      rendering/                  # Three.js scene, visuals, clips and asset bindings
      ui/                         # HUD, panels, menus and accessibility feedback
      input/                      # Pointer/touch gestures and player intent
      audio/                      # Playback driven by state/events and settings
      persistence/                # IndexedDB adapters, save envelopes and migrations
    tests/
      simulation/
      content/
      integration/
      e2e/
      performance/
  assets/                         # Existing model registry and delivery tree
    asset_catalog.json
    runtime/<category>/<id>_<version>.glb
    third_party/<publisher>/<package>/<upstream-release>/
  blender/<category>/<id>/<version>/  # Existing editable models and manifests
  tools/
    asset-pipeline/               # Existing guarded Blender/GLB delivery
    asset-inspector/              # Existing catalog-only model review
  output/                         # Existing generated review artifacts
```

This is the intentional project layout, not an exhaustive inventory of legacy or incidental root files. Existing art, tools, templates, and output artifacts are retained in their current locations.

Use one `game/package.json` when bootstrapping the application. Keep existing Node/Python asset tools independently runnable. There is no current need for a workspace package hierarchy. Add package boundaries only when a second real consumer needs a reusable module.

## Runtime ownership and dependencies

| Module | Owns | Dependency boundary |
| --- | --- | --- |
| `content/schemas` | Data shapes and validation for authored content | Pure TypeScript; no browser, renderer, or simulation implementation imports. |
| Other `content` folders | Definitions, map composition, level scripts, tutorial data | Use schemas and stable IDs; no scene objects or rule implementations. |
| `simulation` | Level state, lifecycle, commands, events, queries, fixed-step rules | May use pure content schemas and injected validated data; no React, Three.js, DOM, storage, audio, or app imports. |
| `progression` | Campaign state, unlock eligibility, success-result application | Pure data transformations; may consume simulation result types and content reward definitions, never browser services. |
| `session` | Construct/dispose a run, drive ticks, route commands, coordinate saves and success commits | Connects the pure modules to browser adapters and consumers. No duplicate targeting, reward, or combat rules. |
| `rendering` | Scene, camera, interpolation, visual effects, asset loading and clip playback | Reads snapshots/events and logical geometry; never mutates simulation state. |
| `input` | Mouse/touch gestures, selection intent, placement/facing requests | Uses picking supplied by rendering and sends commands through the session. |
| `ui` | Responsive controls, wave preview, tutorial/debrief display | Reads view data and sends commands; does not step or mutate the simulation. |
| `audio` | Playback and volume/accessibility preferences | Observes events; audio completion never advances gameplay. |
| `persistence` | Save envelope validation, migrations and IndexedDB transactions | Serializes pure state; imports neither React nor live Three.js objects. |
| `app` | React shell, screen navigation, settings, dependency composition | Creates the session and connects browser adapters and UI. |

The simulation exposes a small public API for state snapshots, player commands, events, and geometry/eligibility queries. Rendering and UI consume read-only views. Simulation rules validate every command, including rejecting tactical changes while paused. Input/UI may preview eligibility but cannot bypass that validation.

The session translates browser elapsed time into fixed simulation ticks, applies supported speed controls, and interpolates presentation between ticks. All gameplay clocks live in simulation time. Define deterministic entity ordering, command ordering, and, if randomness is introduced, an injected seeded generator whose state is saved. A fixed timestep alone does not establish determinism.

Selection, camera position, and open panels are presentation state. Entity positions, facing, target commitment, lifecycle, resources, and outcomes are simulation state. Clocks and gameplay position must not be derived from animation playback or wall-clock timestamps.

## Gameplay coverage

Start with files inside `simulation/`; introduce subfolders as actual implementations grow.

| Concept requirement | Implementation home |
| --- | --- |
| Preparation, manual wave start, active play, hard pause, sprint, boss prep, success/failure | Simulation lifecycle and command validation; session supplies ticks. |
| Moving productive Work and harmful Problems | Simulation movement, work progress, problem resolution, and outcome rules. Keep their completion/leak outcomes distinct. |
| Local Build/Defend/Auto, commitment, Area/Cone sight, server occlusion | Simulation targeting and geometry queries; rendering draws coverage from the same logical data. |
| Base Copilot, permanent Developer/Tester choice, simple upgrades | Content definitions plus simulation tower rules. |
| Non-stacking Tester aura | Simulation eligibility/effect aggregation and rewards; rendering supplies the visible aura. |
| Compute, capped Product healing, level Product Progress | Simulation economy and Product state. |
| Debt counter, reward-free cleanup, finite boss debt-Bug budget/final burst | Simulation debt and encounter rules; level data supplies timings and tuning. |
| Analyst unlock and success-only visual growth | Progression applies a successful run result; persistence records it atomically and prevents committing that same result twice. |
| Tutorial prompts, accurate debrief, zero-debt all-clear | Authored tutorial data and UI/session presentation using actual simulation events and run totals. |

Content schemas distinguish productive Work, cleanup Work, and Problems, so shared progress mechanics cannot accidentally give cleanup a productive reward or add debt when cleanup expires. The art category `enemies` is a storage label; the gameplay domain continues to use Problem terminology.

No folders or dormant systems are created for Tokens, Models, Skills, MCPs, Plugins, Hooks, Sub-agents, Context, multiplayer, or a backend. Analyst unlock metadata and locked Persona UI can exist before its accepted passive support and Work-generation mechanics are implemented. Analyst has no combat action. An exported model in the catalog does not make its associated gameplay concept part of Alpha.

## Authored content

- `definitions/` contains reusable content identities and tuning, not instantiated units or visual meshes.
- `maps/` contains a schema version, explicit asset ID/version references, transforms, routes, spawn/destination points, buildable areas, and logical blocker/placement shapes. Camera and visual composition are distinct fields from logical geometry.
- `levels/` composes map, roster, waves, sprint, boss schedule, and completion rewards. Shared defaults remain in definitions; intentional level overrides are explicit.
- `tutorials/` defines prompt text and declarative triggers. UI/session evaluate presentation triggers without introducing combat rules into tutorial scripts.

Give maps and levels stable IDs and content versions. Pin asset versions explicitly; never resolve gameplay content against an implicit latest model. Validate references and reject incomplete playable content before a session starts. The planned map editor must eventually consume these same schemas; it is not scaffolded yet.

Current wave slots and balance numbers remain hypotheses in the design. This structure does not create a playable Level 1 or settle its pending scripts, geometry, timings, costs, or output values.

## Assets and build delivery

[Asset storage](../assets/README.md) remains authoritative. Preserve `towers`, `work`, `enemies`, `product`, and `environment` categories. Do not move or duplicate GLBs into `game/public/`, a new `models/` folder, or a generic source-art tree.

When the Vite application is bootstrapped, implement a catalog-aware development/build adapter under `game/`:

1. Resolve the explicit asset ID/version references used by playable content and presentation bindings through `assets/asset_catalog.json` and their manifests.
2. Validate that selected assets are delivered, registered runtime files. Unused draft entries may remain in the catalog; a referenced missing draft or missing delivered file must fail the build.
3. Expose only that allowlisted runtime set in development. For production, copy the selected canonical GLBs into generated `game/dist/assets/runtime/<category>/` and generate a browser index with URLs and the required clip/anchor interface metadata.
4. Keep Blender paths, recipes, references, source hashes/review reports, imported packages, and the inspector out of the shipped index and build. Resolve URLs relative to the configured deployment base.

The browser index is a generated projection, not a second hand-maintained asset registry. The adapter is an implementation requirement; it is not present in this folder scaffold. Keep `public/` for small unprocessed site resources. Define storage/provenance for standalone audio or UI artwork when those assets are introduced; they are not new GLB categories.

Three.js state-to-clip mappings live in `rendering/`, keyed by explicit asset identity/version. Animation anchors drive visual attachment points only; simulation targeting uses authored logical coordinates. Gameplay never waits for a clip to finish. The existing inspector stays independently usable for registered-model review.

## Saves and campaign state

Simulation owns the complete serializable level snapshot and restore invariants. Progression owns campaign state. Persistence owns the versioned storage envelope, migrations, compatibility checks, and browser I/O; session coordinates them at permitted stopping points.

Save the content versions, current/next wave and boss progression, tower configuration/facing, Product health, Compute, debt, Product Progress, relevant commitments/effects, deterministic counters, and RNG state if used. Reject unsupported or incompatible saves clearly. Restoring a save is not retrying a wave or replaying completion rewards. A successful run's growth/unlock commit must be atomic and idempotent; failure retains previous campaign progress.

## Verification plan

The following is the full planned coverage. Implemented core and browser cases are listed in [Foundation Implementation](Foundation_Implementation.md) and the [test README](../game/tests/README.md); gameplay and performance cases remain future work:

- `tests/simulation/`: repeatable fixed-step outcomes; command rejection while paused; work versus cleanup payouts; visibility and target commitment; strongest-only aura effects; zero/cleared/unresolved debt; early boss defeat and remaining extras; victory/failure.
- `tests/content/`: schema validation, reference resolution, registered asset versions, logical map geometry, permitted Level 1 roster, and complete encounter definitions.
- `tests/integration/`: save/restore equivalence, unsupported version handling, campaign commit deduplication, and session disposal/recreation without duplicate loops or listeners.
- `tests/e2e/`: real mouse/touch selection and placement, narrow-screen controls, non-colour-only blocker feedback, manual start, hard pause, and between-wave save/load.
- `tests/performance/`: reproducible 100-visible-moving-entity scenarios with frame-time, draw-call, memory, and load-size measurements. Device budgets remain subject to first-slice profiling.

Keep each tool's existing verification scripts with that tool. Add application test dependencies and import-boundary checks during runtime bootstrap. Do not create placeholder passing tests or introduce a second copy of the asset inspector.

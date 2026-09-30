# Production foundation and build plan

Reviewed 24 September 2026 against the working tree, including the current campus and simulation prototype changes. This pass prepares the foundation; it does not implement a playable level or change the agreed game design.

Follow-up: the user selected startup and home before the encounter slice. The [App Startup Implementation Plan](App_Startup_Implementation_Plan.md) supersedes the order of batches 1–2 below and records the implemented shell, Three.js campus and verification. This review remains the record of the preceding foundation pass.

## Recommendation

Build the actual game in **`game/`**, retaining its tested TypeScript simulation and browser infrastructure. Port the campus presentation and interaction patterns into that application deliberately. Keep `prototypes/` as runnable reference and performance experiments during migration. There is no need for a new engine, a second application package, or a rewrite of the tested rules.

The first visible milestone should be **one small 3D encounter driven by the existing simulation**: place a Base Copilot, start a mixed Coding Task/Bug wave, see real completion/damage/rewards, pause, finish, and return to preparation. Call that an integration slice, not Level 1 victory. Connect the full campus home and campaign flow after this connection works.

## What exists today

| Area | Evidence | Production disposition |
| --- | --- | --- |
| TypeScript game | `game/`: React/Vite, strict typing, lint, enforced pure-core imports, fixed 60 Hz simulation, content validation and browser tests. | Keep as the production application. |
| Gameplay rules | `src/simulation/encounter/`: Work/Problem outcomes, Compute/health/debt/progress, placement, Area/Cone visibility, targeting, actions, QA aura, upgrades and modifiers. | Reuse; extend through tested domain changes. |
| Diagnostic session and UI | `createEncounterLab.ts`, `EncounterLab.tsx`: queues, stepping, markers, captures, editable stats and SVG map. | Retain as a development harness. Extract shared coordination as the production consumer needs it; keep diagnostic commands out of player UI. |
| Storage | IndexedDB repository, validation, revision conflicts and late-I/O protection; fixture-specific databases and replay-validated encounter saves. | Reuse repository mechanics. Define separate campaign/run envelopes and database identity. |
| Campus | `prototypes/campus-3d/`: modular tiles, camera presets, touch/pan/zoom, ambience, reduced motion and building feedback. | Port composition and interactions into a disposable TypeScript scene. Preserve the visual direction. |
| Simulation map | `prototypes/campus-3d/simulation/`: seeded scenery, placement feedback, animated actors, cosmetic targeting, wave scheduling and performance captures. | Rendering/input/load-test reference. It has no damage, kills, Work economy or level outcomes. |
| Assets | Versioned catalog, manifests, delivered GLBs, Blender sources and guarded export tools. | Keep canonical identities/files; select versions through the app build adapter. |
| Effects | `tools/asset-presentation/`: clip-driven digital assembly/resolve with shared budgets. | Integrate when the scene presenter exists; verify against the app's pinned Three.js version. |
| Design | Master GDD, core rules, Alpha roster and Level 1 teaching goals. | Keep as rule owners. Exact wave scripts, map layout and tuning need authoring/playtesting. |

The campus screenshots establish a cohesive home screen. The simulation screenshot establishes the landscape and placement language, but its overview makes the small actors hard to read. Validate closer gameplay framing, touch selection and Work/Problem differentiation on the integration slice before carrying across all background scenery.

## Gaps that affect the build order

1. **The runtimes are disconnected.** The TypeScript engine owns real outcomes; the prototype's variable-time scheduler moves visual enemies. Do not import `simulation/schedule.js` or its cosmetic targeting into production rules. One session must own advancement, commands and event delivery.
2. **The session is diagnostic.** It republishes a full encounter snapshot, includes test controls, and knows fixture persistence. Add a production session with a small UI view and a frame-oriented renderer subscription, sharing the tested clock and host. Measure snapshot costs before optimizing the engine.
3. **The lifecycle ends at `drained` or `failed`.** Multi-wave planning, Persona choice, cleanup sprint, boss prep, incident victory and campaign commits are missing. A drained queue must never grant a level reward.
4. **Geometry needs one rule owner.** Production maps must provide shared validated routes, placement and blockers. Establish metres, logical XY → world XZ, facing conversion, ground offsets and camera framing in the first slice. The SVG fixture's coordinates and garden's scale are not interchangeable.
5. **Saves are fixtures.** `restoreEncounter` replays commands from the beginning to verify state. Full-level save size and restore time need measurement. Review fixture limits on ticks, entity IDs and command counts when adding orchestration. Old fixture saves do not automatically become campaign saves.
6. **Capacity is not a performance promise.** The saved 24 September desktop report flags CPU submission and draw-call budgets at baseline (727 calls), reaching 1,127 calls and about 1.51 million submitted triangles at 200 active enemies. The phone-viewport report also flags budgets. These are historical headless captures, not a fresh benchmark of the changing working tree or physical phones. Benchmark real gameplay plus rendering together.
7. **Prototype roster/placement differ from Alpha rules.** Unlimited free manual towers, seven palette models and Bert occupying tower slots are experiments. Alpha uses Base/Developer/Tester; Bert's agreed role is a supporting character. Asset availability does not approve gameplay scope.
8. **Deployment is a prototype snapshot.** Its Pages builder rewrites URLs and copies inspector vendors. Production should build `game/dist` through Vite. Preserve third-party notices as assets and the renderer are selected. Keep the public prototype until a production preview passes its checks.

## Target ownership

Keep the folders in [Codebase Structure](Codebase_Structure.md). Add modules when implementing these responsibilities rather than creating empty systems:

```text
app              screen lifecycle: campus → level → debrief
content          validated maps, definitions, waves and tutorials
simulation       authoritative level state, commands, outcomes and clocks
session          one fixed-step loop; UI views and renderer frames/events
rendering        disposable scenes, camera, catalog models, clips and effects
input / ui       player intent, selection, HUD and accessible controls
persistence      versioned run/campaign saves and transactions
progression      pure unlock/growth rules, committed once after success
build            catalog projection and static deployment integration
```

Add one pinned Three.js dependency to `game/` with the first scene. Scene construction needs cancellation, loading/error states, retry and idempotent disposal. Release listeners, frame callbacks, mixers, per-instance skeletons and owned GPU resources on exit. Define shared geometry/material ownership. React mounts the host and observes UI data; it does not tick actors. Clip completion never advances gameplay.

Lazy-load campus and level modules so entering a level does not require all campus art. Add a small screen shell and give the diagnostic harness an explicit development entry during that step. Keep storage/WebGL/load failures recoverable. Pause/save behavior follows the core rules, including explicit resume after interruptions.

## Foundation delivered in this pass

- `game/build/runtimeAssets.ts` resolves imports such as `tower-asset:copilot_base@v02` through the catalog and selected manifest. It validates identity, canonical paths, delivered SHA-256 and GLB header, rejecting missing or changed exports.
- Development serves imported models through the adapter. Production emits selected GLBs under `assets/runtime/<category>/` with content hashes; Vite resolves root, relative and repository-subpath URLs.
- Imported modules expose only identity, revision, URL, runtime hash/size, root/axes/units, anchors and clip interfaces. Blender paths, source hashes, notes, references and reports are excluded from this projection. Embedded presentation extras remain in the canonical GLB.
- The SVG app imports no models, so it gains no GLB payload. This does not select or approve a gameplay roster.
- Import checks explicitly reject prototype code and direct source-art/runtime-file imports. Build code joins lint and TypeScript checks.
- Tests cover actual Vite builds at `/`, `/TowerDefense/` and `./`, development serving, invalid delivery, projection contents and the registered Copilot export. See [adapter usage](../game/build/README.md).

## Ordered implementation batches

| Batch | Concrete output | Acceptance gate |
| --- | --- | --- |
| 0 — foundation (this pass) | Review/plan and catalog-aware Vite delivery. | Existing gameplay suite retained; delivery tests pass; no unused GLBs or source metadata shipped. |
| 1 — first 3D encounter | Production session, small map, Three.js presenter with Base Copilot, Coding Task, Bug and Product; player HUD and mouse/touch placement. | Scripted commands produce identical headless/3D outcomes; previews match rules; pause/background/resume works; repeated scene entry/exit releases resources; loading failures are usable. |
| 2 — application and campus | Lazy campus, home/level navigation, loading/settings/pause/error screens, accessible controls and explicit diagnostic entry. | Repeated campus → encounter → campus creates no duplicate loops/listeners; phone HUD works; scene settings/camera do not affect simulation results. |
| 3 — playable level loop | Level state machine, previews, successive manual waves, permanent Base → Developer/Tester choices, upgrades and between-wave saves. | Towers/resources persist; hard pause rejects tactical actions; save/load resumes the correct next wave; failed loads preserve live state. |
| 4 — Level 1 rules | Ambiguous Requirement, debt cleanup/zero-debt skip, boss preview, finite debt-Bug budget and incident completion. | Zero/cleared/unresolved debt, early boss defeat and outstanding enemies obey the design; failure never becomes success. |
| 5 — progression and playtest | Accurate debrief, success-only Analyst unlock/Product growth, tutorials and tuned pacing. | Reload/retry cannot duplicate rewards; failure preserves earlier progression; device playtests confirm readability/economy. |
| 6 — release readiness | Static preview, third-party notices, performance/loading budgets, quality settings and recovery. | Subpath hosting works; low-end laptop and physical mid-range phone measurements pass chosen budgets; long-session resources plateau. |

Profile from batch 1 onwards; batch 6 is the release gate, not the first performance check. The full campus and eight proposed rounds are not prerequisites for proving the 3D encounter.

## Decisions to resolve during implementation

- Author a compact integration map in the established visual language. Do not silently designate Garden Switchback or the SVG fixture as final Level 1.
- Write the first mixed wave and costs/ranges/speeds as versioned playtest content. Keep diagnostic overrides and hypotheses distinct from accepted tuning.
- Bind gameplay identities to explicit assets/clips; reconcile Ambiguous Requirement visuals and Product/Tester availability before their batches.
- Choose physical devices and quality budgets from measured gameplay. The 25–500 enemy option and unlimited placement are not production promises.
- Set hosting/base and migration policy with the first preview. No backend, accounts, monorepo split or map editor is needed for this foundation.

## Review evidence and limits

Reviewed current source/design, campus/simulation screenshots, a generated diagnostic desktop screenshot, and saved [simulation verification](../prototypes/campus-3d/previews/simulation-verification.json) / [Pages verification](../prototypes/campus-3d/previews/pages-verification.json). The Pages report records 54 GLBs and 8,884,873 emitted bytes; this is an artifact inventory, not a production transfer measurement. Performance observations come from the simulation report's timestamped captures, not the latest asset revisions.

This pass changes application build infrastructure and documentation. Prototype work, asset authoring, public deployment, gameplay rules and fixture saves are preserved. No Blender work or asset export was performed.

Verification: `npm run verify` passed lint, import boundaries, 261 unit/integration/build tests, all TypeScript checks, the production build and 40 desktop/touch Edge browser cases. The output contains the same application JS/CSS and no GLBs. Browser touch emulation does not establish physical-device performance. The initial sandboxed browser run passed its cases but needed its preview process stopped to finish cleanup; the final run completed normally outside that process restriction.

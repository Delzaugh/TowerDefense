# Game application

The application uses TypeScript, React, Vite and Three.js. Its default entry boots into the 3D campus home. A separate diagnostic screen at `#/lab` retains the unified SVG test map, encounter simulation, timing controls, inspection and IndexedDB saves. See [App startup implementation plan](../docs/App_Startup_Implementation_Plan.md) and [Unified test map](../docs/Unified_Test_Map.md).

[Codebase structure](../docs/Codebase_Structure.md) defines module boundaries, content ownership, asset delivery, and the verification plan. [Technical Architecture](../docs/design/Technical_Architecture.md) owns the technology direction. [Foundation implementation](../docs/Foundation_Implementation.md) records implemented scope, decisions, and remaining work.

## Run

[Production foundation and build plan](../docs/Production_Foundation.md) reviews the campus and simulation prototypes and stages their migration into this application. The [catalog-aware asset adapter](build/README.md) delivers only the versioned models selected by the campus. Home, renderer and diagnostic screen load as separate bundles.

Use Node 24 (the tested version is recorded in `.node-version`). From this folder:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173/`. The server binds localhost with a fixed port so a conflict fails clearly. It does not use the Asset Inspector's ports. Assets and dependencies are served locally; no external fonts or services are required.

## Campus home

Home displays a nine-tile campus, Copilot Lab and thirteen residents: four base Copilots, three Developer Copilots, three low-poly Octocats and three rubber ducks. The northern hill path continues into a 42-tree forest tile, with seven additional pine, spreading and autumn trees around existing green spaces. The core lab sits on Civic Plaza; Canyon and Utility Yard occupy the former spare tiles, and Construction Site extends the southern park promenade.

Authored flower-bed, bush and hedge clips bring a gentle breeze to the planting. Coffee steam, pond ripples and occasional drifting leaves add environmental motion. A Copilot and Octocat share a three-minute coffee, noticeboard and conversation routine, with alternating speech cues; other residents retain their separate strolls. Pause, OS/user reduced motion and hidden-tab suspension apply to the whole scene. Reduced motion also hides transient effects. Models and rigs retain their authored scale and clips.

The top-right Home / Top toggle selects the camera directly and shows the active view. Zoom, drag to pan, and Reset view explore the campus. Camera changes ease over 700 ms and become immediate under reduced motion. Settings controls ambience and reduced motion, stored in `tower.home.preferences.v1`; unavailable browser storage keeps settings working for the current visit.

Startup reports actual model-loading progress. Failures offer Retry or a usable home without 3D; a failed JavaScript download requires Reload app. Retry replaces the canvas after context loss. Navigation disposes pending loads, browser listeners, animation and GPU resources. Home does not construct a simulation session or open the diagnostic save database.

There is no playable campaign, account, or Continue action yet. To inspect current gameplay, open `http://127.0.0.1:5173/#/lab`.

## Diagnostic map

Click/tap empty map space to place towers immediately; placement stays active for successive towers. Clicking an existing tower switches to inspection; use **Place on map** above the map to resume placement. The marker tool remains under Sight & target diagnostics. Focus the map and use arrows/Enter for keyboard placement. Tower footprints cannot touch the authored path or Server footprint; the Server also blocks sight. The diagnostic marker is not a Tower and remains path-placeable. Start advances the encounter at 60 Hz; the yellow probe uses that same tick counter rather than a second runtime. Pause and hidden-tab/timing-gap interruption freeze the system until explicit resume.

Save/load is allowed in preparation and after a finished run, not while active or actively paused. New saves include towers and performance overrides, full encounter state, marker, custom wave recipe/content and starting blueprint, in separate `tower-test-map-standard-v6` / `tower-test-map-fragile-v6` databases. Load validates the entire candidate before replacing live state. Load existing saves before overwriting; stale revisions reject. Previous unified v1–v5 and foundation saves remain untouched but are not automatically migrated/loadable in the new version. Browser data can be cleared or evicted; storage failures are surfaced. See [Tower and Copilot core properties and stats](../docs/Tower_Base_Stats.md) for the shared property model, Copilot extension boundary and inspector tuning.

## Unified controls

Open `#/lab`. Old `?lab=...`, `?preset=...` and `?fixture=...` URLs remain aliases when no explicit hash route is present. The Campus home link returns to `#/`. Use the Product preset for standard/low-health runs on the same map. Start, pause/resume, switch 1x/2x speed, or disable automatic time to advance exactly 1 or 60 ticks. Inspect live entities, resources, sight diagnostics, event history and snapshot JSON.

Place a Base Copilot using map click/tap or arrows/Enter, select it, and inspect coverage, targets, modes/priorities and cooldowns. The blocker is always present; the Cone definition supports facing tests. The separate marker tool tests footprint/sight geometry for free. See [Unified test map](../docs/Unified_Test_Map.md) for recipes and [batch 02](../docs/Encounter_Batch_02.md) for tower rules.

Capture/restore is **memory-only developer inspection**, not a player-facing mid-wave save. It preserves placed towers, partial progress, readiness, commitment, accounting and starting blueprint. Restore selects manual time, clears map selection and does not replay historical events. Reset abandons the attempt and clears the capture; reload/fixture changes also discard it. Encounter content/snapshots/rules are version 6; old captures reject explicitly.

Use the selected-tower inspector for Area/Cone, Mode/Priority and numeric or drag aiming. Use **Edit wave queue** for presets, editable rows and recipe JSON import/export. **Apply queue & prepare** retains a valid starting defense; **Prepare same run again** resets outcomes and restores the defense recorded at Start. See [mechanics guide](../docs/Test_Map_Mechanics.md) for the complete workflow and boundaries.

## Verification commands

```powershell
npm run verify
```

This runs lint, resolved import-boundary checks, 286 core/content/integration/build tests, type checks, a production build, 56 desktop/touch browser cases, and 3 landscape/subdirectory deployment cases. Browser checks use installed Microsoft Edge on Windows; physical mobile performance is not established by emulation. `test:e2e` requires a preceding build and reserves localhost port 5183. `test:deployment` builds and serves `/TowerDefense/` on port 5184. If Edge is unavailable, configure a supported installed Playwright browser in the Playwright configuration files.

Individual commands: `typecheck`, `lint`, `check:boundaries`, `test`, `test:watch`, `build`, `build:pages`, `preview`, `test:e2e`, and `test:deployment`. Dependencies and their exact resolved versions are recorded in `package-lock.json`; TypeScript 6.0.3 satisfies the linter's compiler peer range. Three.js is pinned at 0.180.0, matching the campus prototype, with its license emitted to `dist/licenses/three.txt`.

## GitHub Pages

[Copilot Hub](https://delzaugh.github.io/TowerDefense/) replaces the campus/simulation prototype snapshot. Run `npm run build:pages` to build `dist/` with the `/TowerDefense/` base, third-party notices, release metadata and a redirect from the old `/simulation/` address. Verify with `npm run test:deployment`, then replace the remote `pages-site/` subtree with this build. Publish only generated files; source art, local captures and unrelated working changes do not belong in the site snapshot. `.github/workflows/campus-pages.yml` publishes that subtree from `main` through the existing `github-pages` environment. The diagnostic screen remains at `#/lab`.

Deploy the generated `dist/` folder on a static host. For a subdirectory, build with its base, for example `npm run build -- --base=/TowerDefense/`. Hash routes require no server-side route fallback. The renderer chunk is currently about 600 kB minified (153 kB gzip), and Vite reports its size warning; asset/renderer optimization and physical-device profiling remain follow-up work.

## Scope

The original probe/marker remain engineering fixtures. The encounter engine implements Work/Problem traffic, tower placement, local targeting, work/damage actions, completion/resolution rewards and missed/leaked outcomes. Generic targeted/passive Tower contracts, per-type caps, QA Aura, numerical upgrades, explicit ability grants, external modifiers, and replay-validated saves are implemented. Campus GLB presentation is implemented; 3D gameplay presentation, multi-wave progression, the playable Persona tree, debt cleanup/boss behavior, campaign commits and authored Level 1 remain unimplemented. Wave drainage is not Level 1 victory. Do not promote fixture values into approved tuning.

Use **Tower type** to choose Base Copilot, Tester QA probe, or Support-only QA probe. The Tester inspector shows effective aura values, an engineering upgrade, and an external-effect test. See [Tower Foundation Implementation](../docs/Tower_Foundation_Implementation.md) for exact contracts, diagnostic values, and save/repeat semantics.


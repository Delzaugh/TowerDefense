# Game application

The application uses TypeScript, React and Vite. One unified test map combines tower gameplay, traffic, blocker geometry, the sight marker/clock probe, timing controls, state inspection and IndexedDB saves. One encounter simulation drives everything; the map uses SVG rather than Three.js/GLB assets. See [Unified test map](../docs/Unified_Test_Map.md).

[Codebase structure](../docs/Codebase_Structure.md) defines module boundaries, content ownership, asset delivery, and the verification plan. [Technical Architecture](../docs/design/Technical_Architecture.md) owns the technology direction. [Foundation implementation](../docs/Foundation_Implementation.md) records implemented scope, decisions, and remaining work.

## Run

Use Node 24 (the tested version is recorded in `.node-version`). From this folder:

```powershell
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. The server binds localhost with a fixed port so a conflict fails clearly. It does not use the Asset Inspector's ports. The console loads no external fonts, models, or services.

Click/tap empty map space to place towers immediately; placement stays active for successive towers. Clicking an existing tower switches to inspection; use **Place on map** above the map to resume placement. The marker tool remains under Sight & target diagnostics. Focus the map and use arrows/Enter for keyboard placement. Tower footprints cannot touch the authored path or Server footprint; the Server also blocks sight. The diagnostic marker is not a Tower and remains path-placeable. Start advances the encounter at 60 Hz; the yellow probe uses that same tick counter rather than a second runtime. Pause and hidden-tab/timing-gap interruption freeze the system until explicit resume.

Save/load is allowed in preparation and after a finished run, not while active or actively paused. New saves include towers and performance overrides, full encounter state, marker, custom wave recipe/content and starting blueprint, in separate `tower-test-map-standard-v6` / `tower-test-map-fragile-v6` databases. Load validates the entire candidate before replacing live state. Load existing saves before overwriting; stale revisions reject. Previous unified v1–v5 and foundation saves remain untouched but are not automatically migrated/loadable in the new version. Browser data can be cleared or evicted; storage failures are surfaced. See [Tower and Copilot core properties and stats](../docs/Tower_Base_Stats.md) for the shared property model, Copilot extension boundary and inspector tuning.

## Unified controls

Open the root URL. Old lab URLs are aliases to this same screen. Use the Product preset for standard/low-health runs on the same map. Start, pause/resume, switch 1x/2x speed, or disable automatic time to advance exactly 1 or 60 ticks. Inspect live entities, resources, sight diagnostics, event history and snapshot JSON.

Place a Base Copilot using map click/tap or arrows/Enter, select it, and inspect coverage, targets, modes/priorities and cooldowns. The blocker is always present; the Cone definition supports facing tests. The separate marker tool tests footprint/sight geometry for free. See [Unified test map](../docs/Unified_Test_Map.md) for recipes and [batch 02](../docs/Encounter_Batch_02.md) for tower rules.

Capture/restore is **memory-only developer inspection**, not a player-facing mid-wave save. It preserves placed towers, partial progress, readiness, commitment, accounting and starting blueprint. Restore selects manual time, clears map selection and does not replay historical events. Reset abandons the attempt and clears the capture; reload/fixture changes also discard it. Encounter content/snapshots/rules are version 6; old captures reject explicitly.

Use the selected-tower inspector for Area/Cone, Mode/Priority and numeric or drag aiming. Use **Edit wave queue** for presets, editable rows and recipe JSON import/export. **Apply queue & prepare** retains a valid starting defense; **Prepare same run again** resets outcomes and restores the defense recorded at Start. See [mechanics guide](../docs/Test_Map_Mechanics.md) for the complete workflow and boundaries.

## Verification commands

```powershell
npm run verify
```

This runs lint, resolved import-boundary checks, 244 core/integration tests, type checks, a production build, and 40 browser cases against that build. Browser checks use installed Microsoft Edge on Windows with four workers, including a touch-emulated viewport; physical mobile performance is not established by those checks. `test:e2e` requires a preceding build and reserves localhost port 5183. If Edge is unavailable, configure a supported installed Playwright browser in `playwright.config.ts`.

Individual commands: `typecheck`, `lint`, `check:boundaries`, `test`, `test:watch`, `build`, `preview`, and `test:e2e`. No repository hosting or CI provider is assumed. Dependencies and their exact resolved versions are recorded in `package-lock.json`; TypeScript 6.0.3 is selected to satisfy the linter's compiler peer range.

## Scope

The original probe/marker remain engineering fixtures. The encounter engine implements Work/Problem traffic, tower placement, local targeting, work/damage actions, completion/resolution rewards and missed/leaked outcomes. Generic targeted/passive Tower contracts, per-type caps, QA Aura, numerical upgrades, explicit ability grants, external modifiers, and replay-validated saves are implemented. Multi-wave progression, the playable Persona tree, debt cleanup/boss behavior, campaign commits, authored Level 1, and runtime GLB integration remain unimplemented. Wave drainage is not Level 1 victory. Do not promote fixture values into approved tuning.

Use **Tower type** to choose Base Copilot, Tester QA probe, or Support-only QA probe. The Tester inspector shows effective aura values, an engineering upgrade, and an external-effect test. See [Tower Foundation Implementation](../docs/Tower_Foundation_Implementation.md) for exact contracts, diagnostic values, and save/repeat semantics.


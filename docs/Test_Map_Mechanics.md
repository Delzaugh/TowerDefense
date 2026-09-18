# Test-map mechanics: implementation and use

The [implementation plan](Test_Map_Mechanics_Plan.md) is implemented in the single [test map](http://127.0.0.1:5173/). The pure contracts/session changes were checked first (168 tests, types, lint and boundaries); the UI was then added and exercised with desktop and touch-emulated browsers. Later lifecycle regressions bring the core suite to 170 tests.

## Quick walkthrough

The [map-first workspace update](Test_Map_Workspace.md) supersedes the original layout: full-width map, sidebar inspector, a Wave Queue dialog, no New tower defaults section, and a 300-Compute / ten-tower test budget.

1. Click/tap empty map space to place a tower. Click a numbered tower, or its button beneath the map, to inspect it.
2. **Selected tower** sits in the sidebar (below the map on narrow screens). Change Area/Cone, Mode or Priority there. Tower type selects Base Copilot or a QA diagnostic probe; controls follow the selected definition. Shape switching is explicitly enabled for these test definitions, not for every production tower.
3. Choose **Cone**. Drag the tower body or the round direction handle to aim. The sector and angle label preview the change; release commits one command. Escape or a cancelled touch discards it. The numeric facing field, Apply angle, ±15° and Rotate 90° provide alternatives. Shape and facing are preparation-only. Mode/Priority can change during active unpaused waves. All tactical changes lock while paused.
4. Use **Edit wave queue** at the top. Choose a quick recipe or edit rows: type, start seconds, count, and interval milliseconds. Duplicate/remove/reorder rows or add new ones. Interval zero makes a simultaneous burst. Route selection appears when the map has multiple routes.
5. Check the draft summary and chronological preview, then **Apply queue & prepare**. Keep starting towers and marker is on by default. Invalid queues never replace the working attempt. Applying during an active/paused run is disabled: first explicitly reset it with **Prepare same run again** (confirmation required for active attempts).
6. Start the run, or turn off automatic time and step. You can edit the next queue draft during combat; **Applied queue** continues showing the actual schedule. Draft edits do not alter the current wave.
7. **Prepare same run again** rebuilds the defense recorded at Start with fresh health, Compute, targets, cooldowns and outcomes. Towers bought during combat are not silently carried back. **Reset encounter** instead clears all towers and diagnostics. Both keep the applied queue. Apply a new draft after preparing to compare the same defense against different traffic.
8. Save locally in preparation or after finishing. Reload and Load save to restore the custom queue, tower coverage/facing/settings, marker and starting blueprint. Recipe JSON import/export offers copy/paste reuse separately from full-state saves; imported data stays a draft until applied.

Changing Product health preserves the applied queue but resets the defense, switches to a separate save slot, and asks before discarding a dirty draft. Queue drafts are not silently persisted by Save locally. Capture/restore remains memory-only and includes the starting blueprint. Restore/reset/load/scenario changes clear map selection and gestures to avoid stale tower IDs.

## Core changes

- Encounter content and snapshot/rules now use version 6. Routes own a validated logical `width`, shared by SVG rendering and exact Tower-footprint placement checks. Path rejection belongs to Tower placement; the diagnostic marker retains an independent path-allowed policy, leaving a deliberate extension point for future item/ability commands. Placed towers store `coverageKind` and performance `statOverrides`; definitions group placement/range and applicable action values in `baseStats`; abilities own their slow/bonus values. See [Tower and Copilot core properties and stats](Tower_Base_Stats.md). Optional `coverageAlternatives` opt a definition into another bounded authored shape; resolved range is shared across shapes. Unsupported coverage rejects atomically.
- `simulation/encounter/coverage.ts` resolves both simulation visibility and SVG preview profiles. Configuration preserves facing and economy, and uses the existing target/commitment clearing rules. `set_facing` still accepts arbitrary finite angles in [0,360) during preparation.
- `simulation/aiming.ts` converts logical +X-toward-+Z direction into normalized tenths of a degree, with a near-center dead zone. Browser gestures never become simulation state; release issues one command.
- `content/waveRecipe.ts` validates versioned recipes before expansion. Maximum 1000 spawns, offsets 0–36000, valid references and the existing travel bound remain enforced. Seconds round to the nearest 60 Hz tick. Offset N spawns on tick N+1; equal-time ties preserve row/within-row order. Reordering rows does not rewrite start times. There is no second scheduler.
- `simulation/encounter/blueprint.ts` reconstructs ordered starting towers through authoritative placement/configuration commands. Invalid or unaffordable layouts fail before replacing the old attempt. No terminal reward, target or cooldown state is transplanted.
- The session atomically swaps validated content, engine, recipe, diagnostics and blueprint while keeping one frame loop. The subscribed view exposes current content and an attempt epoch for clearing UI gestures/selection.

## Storage compatibility

New saves use `tower.test-lab.save` envelope version 5 and `tower-test-map-standard-v6` / `tower-test-map-fragile-v6` databases for the path-placement content revision. The envelope contains resolved content, recipe, snapshot, marker and starting blueprint. Loading recompiles the recipe, verifies content agreement and map/preset compatibility, restores snapshot invariants, and validates the blueprint before replacing anything. Stale revision checks and late-I/O/disposal guards remain in force.

The prior unified `*-v1` through `*-v4` databases and original `tower-foundation-v1` are untouched. Old saves are not automatically migrated or loadable under version-5 rules. The app explains this explicitly. No user data was deleted.

## Verification and limits

`npm run verify` runs 244 core/content/integration tests, type checks, lint, import boundaries, production build, and 40 desktop/touch-emulated browser cases. Browser concurrency is bounded to four workers to avoid test-induced CPU contention with the deliberately strict fixed-clock interruption policy.

New regressions exercise per-instance coverage/eligibility, unsupported configurations, arbitrary angles, queue bounds/ties/reproducibility, atomic apply, starting-defense reconstruction, custom saves, blueprint capture/restore and failed-load preservation. Browser cases cover map placement followed by configuration, handle/body dragging, non-authoritative previews, cancellation, numeric aiming, locks, independent tower settings, draft editing, import/export, preset changes, custom reload and repeat runs.

Touch testing exposed SVG child `touch-action` not preventing browser scroll cancellation: a non-passive touch-start guard now prevents scrolling only on editable Cone towers/handles. Empty map space remains scrollable. SVG text selection is disabled so dragging a tower number cannot cancel aiming. Physical mobile hardware/performance is not claimed.

The UI shows at most 50 preview/applied schedule entries, labelled explicitly; all up to 1000 spawns run in the core. Row reordering uses accessible Up/Down buttons. No live aiming, live spawn injection, enemy-stat editor, additional priority rules, multi-wave orchestration, automatic old-save migration, or 3D renderer is included.


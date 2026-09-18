# Unified test map

The former foundation probe, encounter lab and blocker fixture now share **one screen, one authored map and one active simulation clock**. Open [the test app](http://127.0.0.1:5173/). Old `?lab=foundation`, `?lab=encounter` and blocker links open the same screen; an old fragile fixture link selects the low-health preset.

See the [map-first workspace guide](Test_Map_Workspace.md) for the full-window layout, Wave Queue dialog and ten-tower budget.

## Available together

The [mechanics guide](Test_Map_Mechanics.md) covers selected-tower Area/Cone settings, drag aiming, editable wave recipes and repeatable custom runs.

- Base/Cone tower placement, Compute spending, selection, facing, modes, priorities and current targets.
- Moving Work/Problems, partial progress, cooldowns, rewards, Product health/debt and terminal results.
- An always-present Server blocker and placement grid. The same authored footprint drives tower placement, marker placement and line-of-sight tests.
- The foundation's free sight marker and yellow clock probe, overlaid on the encounter map. Marker sight ignores tower range and is a diagnostic, not a gameplay effect. It never spends Compute or creates a tower.
- Manual start, hard pause/resume, 1x/2x time, 1/60-tick stepping, simulation time/command counts, event history and JSON inspection.
- Full-state local save/load at preparation or after the run finishes, plus memory-only diagnostic capture/restore at any phase.

There is no second running foundation simulation. The yellow probe samples the shared route at `tick / 600`; it freezes whenever the encounter clock freezes, including early drainage or failure. It does not delay wave completion or generate outcomes. Simulation commands count gameplay commands, not read-only selection or diagnostic marker edits.

## How to use it

1. Open `/`. The **Product preset** changes starting/max health: Standard 100 or Failure test 20. Geometry and tools remain identical; the applied custom queue is retained. Reset an active run before switching presets. Changing presets resets the defense and memory capture, and asks before discarding a dirty queue draft.
2. Place a Base at the default **X −5, Z 0**, select it, then start. Standard finishes with 100 health, 0 debt, 304 Compute and two completed Work items. No-tower Standard ends at tick 480 with 70 health and 2 debt; no-tower Failure ends with zero health.
3. Tower placement is active on first load: **click/tap empty map space** to place towers, repeatedly while Compute allows. A Tower's circular footprint may not touch the authored path, the Server footprint, the map boundary or another Tower. Clicking a numbered tower switches to inspection; **Place on map** above the map reactivates placement. The adjacent hint shows the active tool or why edits are locked. **Place marker on map** changes the map tool to the free diagnostic marker; it is not a Tower and may be placed on the path. New towers are Area Base Copilots; adjust their settings after selection. Focus the map and use arrows/Enter for keyboard placement. Tower selection and tower placement switch out of marker mode; drag gestures place neither.
4. In **Sight marker & clock probe**, use **Place left/right**, **Clear marker**. Placement inside the Server at (−1.5, 0) rejects. A marker at (0, 0) has blocked sight to the initial probe, while (−7, 0) is clear.
5. Turn off automatic time to step through both gameplay and the probe. Pause freezes all tactical and marker edits; selecting and inspecting remain read-only.
6. **Save locally** persists the full encounter snapshot and marker. After reload, **Load save** restores towers, geometry diagnostics, resources and timing state, selects manual time, and clears displayed historical events without replaying outcomes. Load existing data before overwriting it; stale revisions reject.
7. **Capture state / Restore capture** also preserves the marker but remains memory-only and permits active-state debugging. It does not relax the local-save boundary. Reset clears captures and markers but leaves local saves untouched.

## Storage and compatibility

New saves use the `tower.test-lab.save` version-5 envelope around the encounter's version-6 snapshot, resolved custom content, wave recipe and starting blueprint, including per-tower performance overrides. They use separate IndexedDB databases, `tower-test-map-standard-v6` and `tower-test-map-fragile-v6`, so a health-preset change cannot overwrite the other preset's save. Existing transactional revision checks remain. All incoming recipe/content/snapshot/marker/blueprint invariants are validated before replacing live state. Pending I/O blocks mutations and late reads after disposal are ignored. Previous unified v1–v5 databases are retained but not migrated or loaded by this version. See [Tower and Copilot core properties and stats](Tower_Base_Stats.md).

The legacy `tower-foundation-v1` database is **not deleted, modified or automatically migrated**. Those marker-only saves are not interchangeable with gameplay saves. The standalone foundation React screen and unused `ProbeMap.tsx` component have been retired; the old pure probe/session implementation and unit tests remain as regression fixtures rather than another active UI/runtime.

## Implementation and verification

- `content/levels/testMap.ts` owns the unified map and health variants.
- `session/createEncounterLab.ts` owns the only frame loop and coordinates diagnostics, captures and repository access.
- `simulation/geometry.ts` provides exact circle/polyline path clearance; `simulation/encounter/towers.ts` applies it only to Tower placement. `simulation/encounter/diagnostics.ts` keeps the marker's independent policy; `persistence/testLabSave.ts` provides the validated save envelope.
- `app/App.tsx` always opens the unified screen. `EncounterLab.tsx` composes shared controls; `TowerLab.tsx` renders the one map and its explicit tools.

`npm run verify` covers **244 core/integration tests and 40 desktop/touch-emulated browser cases**, type checks, lint, resolved module boundaries and the production build. Browser coverage includes stat tuning, path/obstacle placement rejection, inspection/shape settings, drag aiming/cancellation, editable recipes, custom reload/repeat attempts, paused placement, one-map aliases, health-preset storage isolation, stale-tab conflicts and preservation of a seeded legacy database. Screenshots are inspected at desktop and phone sizes. Physical-device performance and campaign/multi-wave saves are not claimed.


# Encounter batch 02: towers, targeting and actions

UI update: the separate labs and blocker fixture have since been merged into the [Unified test map](Unified_Test_Map.md), including local saves and the original marker/probe diagnostics. Use that guide for current navigation and storage behavior; the tower rules and numerical outcomes below remain valid.

The [detailed implementation plan](Encounter_Batch_02_Plan.md) is implemented. Gameplay remains pure TypeScript; the existing encounter lab exposes its new functionality through SVG and browser controls. The independent foundation probe and its IndexedDB saves remain intact.

## Test it in the app

Open [Encounter lab](http://127.0.0.1:5173/?lab=encounter), with `npm run dev` running from `game/`.

### A complete defended encounter

1. On **Mixed traffic**, leave the default Base definition and coordinates **X −5, Z 0**. Press **Place Copilot**. Compute changes from 100 to 70 and Tower 1 is selected.
2. Press **Place Copilot** again at the same coordinates. It rejects overlap and keeps Compute, IDs and tower count unchanged.
3. Uncheck **Advance automatically**, then **Start encounter** and **Step 1 tick**. Tower 1 contributes 5 work immediately; Work 1 has 5 remaining. Its target and 30-tick cooldown appear in the selected panel and the action appears in the log.
4. **Capture state**, step forward, then **Restore capture**. The same tower, partial progress, target, cooldown, resources and counters return. Historical events are not replayed. Captures remain memory-only diagnostic tools, not player saves.
5. Advance using **Step 60 ticks** until the wave drains, or enable automatic time. Compare the exact results below.

| Setup on Mixed traffic | Health | Compute | Debt | Completed Work | Resolved Problems |
| --- | --- | --- | --- | --- | --- |
| No towers | 70 | 100 | 2 | 0 | 0 |
| One Base at (−5, 0), Auto | 100 | 104 | 0 | 2 | 2 |
| Same Base, Build | 70 | 94 | 0 | 2 | 0 |
| Same Base, Defend | 100 | 80 | 2 | 0 | 2 |

Auto clears the fixture at tick 211. Full-health completed Work still pays Compute and Product Progress; no healing above maximum is banked. The 104 Compute result is 100 initial − 30 placement + 24 Work rewards + 10 Problem rewards. All numbers are engineering tuning, not approved Level 1 balance.

### Coverage and configuration

- Choose **Blocker test** to expose an authored Server footprint. Placement at (−1.5, 0) rejects `blocked`. A tower on either side cannot affect targets through the blocker.
- **Place on map** enables click/tap placement. Existing numbered towers are selectable on the map; matching Tower buttons provide keyboard access. Coordinate inputs and **Place Copilot** remain available without pointer interaction. Drag gestures do not place towers.
- Selected or previewed coverage is solid where visible and hatched where occluded. Coverage rendering samples the pure visibility query; target decisions always use exact logical tests. The live-target list gives textual visibility reasons.
- Choose **Probe · Cone** for the diagnostic 90-degree sector variant. Facing 0° points +X; **Rotate 90°** turns toward +Z. Rotation is preparation-only. This variant is not a new Persona or a Level 1 unlock.
- Change **Auto / Build / Defend** and **Closest to Product / First spawned** while unpaused. Auto prefers visible Problems, but keeps a still-valid target for its authored commitment window. Losing sight/range or finishing the target releases it immediately. Player mode/priority edits clear commitment without refunding cooldown.
- **Pause encounter** freezes movement, actions, schedules and tactical commands. Selection and preview remain read-only. Reset abandons the attempt and clears both towers and diagnostic captures.

## Implemented code boundaries

`simulation/encounter/towers.ts` owns placement eligibility and cost checks; `targeting.ts` owns range/Area/Cone/occlusion and selection; `actions.ts` owns target transitions and cooldown-based contribution aggregation; `outcomes.ts` owns accounting. `createEncounter.ts` orchestrates commands and fixed ticks. `content.ts` compiles maps, definitions and schedules; `snapshot.ts` validates restoration. No module imports React, browser services or rendering code.

The tick pipeline is now spawn → select/action at pre-movement positions → aggregate and settle completed targets → move survivors → settle endpoints → clear invalid targets → check terminal state. All towers act against a coherent pre-settlement entity set. Simultaneous pulses consume every contributing tower's cooldown; excess work/damage is discarded, with no same-tick retarget or duplicate reward. Completion wins over a would-be endpoint outcome in that tick. Failure remains latched.

Placement allocates a separate monotonic tower ID only after successful validation. Footprints touching authored exclusions or other towers reject. Geometry does not implicitly prohibit routes or change pathfinding. There is a diagnostic limit of 100 towers; no spatial-index or browser-performance claim follows from that limit.

## Compatibility and verification

Encounter content, snapshot and rules versions are now **2**. Old version-1 memory snapshots reject explicitly; no incompatible automatic migration is attempted. Foundation saves use their existing separate format and database.

Snapshots include tower configuration/readiness/commitments and a bounded per-entity terminal-outcome ledger. Restore checks entity conservation, stable IDs, content references, geometry, target validity, timing bounds and exact reward/spend/health/debt/progress accounting. It validates consistency rather than claiming to prove every historical command as an anti-cheat system. Restoring emits no outcomes. Command recording/replay remains a later milestone.

Verification: **136 unit/integration tests and 18 desktop/touch-emulated Edge browser tests** via `npm run verify`, plus lint, strict compiler checks, resolved dependency boundaries and production build. Tests cover atomic rejection, geometry edges, modes/priorities/commitment, paused actions, exact cooldowns, simultaneous contributions, full-health/capped healing, partial-work misses, identical restore event suffixes, corruption rejection and both UI input paths. Desktop and phone screenshots are inspected from ignored `game/test-results/` output. Physical mobile performance and cross-engine equivalence remain unmeasured.

Next: authored multi-wave lifecycle and reliable between-wave checkpoints, followed by replay/regression tooling. Personas, upgrades, Tester aura, debt cleanup, ambiguity, bosses, campaign commits and Level 1 tuning remain outside this batch.

# Encounter batch 01: contracts, traffic and consequences

Historical batch-01 scope below. [Batch 02](Encounter_Batch_02.md) now adds towers, targeting and successful outcomes, bumps encounter snapshot/rules versions to 2, and records current test coverage. The no-tower fixture outcomes remain valid.

Implemented the first scoped batch from the [TypeScript gameplay plan](TypeScript_Gameplay_Implementation_Plan.md), plus the requested test-app integration. The simulation remains pure TypeScript; SVG and browser timing are adapters. Existing foundation probe behavior and IndexedDB saves remain separate and unchanged.

## Try it

From `game/`, run `npm run dev`, then open [Encounter lab](http://127.0.0.1:5173/?lab=encounter). The original console has an Encounter lab navigation link; Foundation probe returns to the existing geometry/save tests.

1. Choose **Mixed traffic** and press **Start encounter**. Squares are productive Work; circles are Problems. Watch health, debt, spawn counts and the event log.
2. For exact inspection, turn off **Advance automatically**, start the encounter, and use **Step 1 tick** or **Step 60 ticks**. Pausing disables both manual stepping and speed changes; resume before stepping again.
3. **Capture state** stores an immutable diagnostic snapshot in memory. Advance further, then **Restore capture** to return to the exact state. Restore selects manual time and clears the displayed event history without replaying outcomes. If the captured state was paused, it remains paused.
4. Inspect the current state through **Inspect current snapshot JSON**. This includes the content signature, entity IDs/distances, schedule cursor, totals and command/event counters.
5. **Reset encounter** abandons the current attempt and constructs a fresh one with a new run ID. It also clears the diagnostic capture. Switching fixtures or reloading also discards captures.
6. Choose **Failure test** to verify Product destruction and terminal-state freeze.

Capture/restore is a developer test capability, not permission for player-facing mid-wave saves. It does not write IndexedDB, award campaign growth or touch foundation saves.

## Fixture expectations

Each fixture has four authored spawns. Work enters at offsets 0 and 120; Problems enter at offsets 60 and 180. Offset zero enters and moves on active tick 1. The route is 20 units long; speed is 4 units/second at 60 Hz. Therefore endpoint outcomes occur at ticks 300, 360, 420 and 480.

| Fixture | Initial health | Final health | Debt | Compute | Product Progress | Terminal state |
| --- | --- | --- | --- | --- | --- | --- |
| Mixed traffic | 100 | 70 | 2 | 100 | 0 | Wave drained |
| Failure test | 20 | 0 | 2 | 100 | 0 | Product destroyed |

These values are engineering fixtures, not approved Level 1 balance. There are no towers yet, so no productive work completes and no Problems are resolved. Compute and Product Progress correctly remain unchanged. Drainage means every scheduled entity was handled; it is not Production Incident victory.

## Implemented boundaries

- Strict, immutable Work/Problem, Product, single-wave and map contracts; duplicate/reference validation, bounded spawn counts and bounded fixture duration. Base Copilot has a validated content-only shape contract; no placement/action implementation is implied.
- New `simulation/encounter/` API: `createEncounter(content, runId)`, `dispatch(command)`, `advanceOneTick()`, `capture()`, `positions()`, and `restoreEncounter(content, snapshot)`.
- Stable IDs assigned by spawn offset and authored tie order. Allocator/schedule state is captured; IDs are never reused inside an attempt.
- Deterministic movement over compiled polyline geometry. Current static-speed position is derived from elapsed entity age, avoiding accumulated addition drift. A future slow mechanic must change this rule and its restore invariants explicitly.
- Missed Work adds one debt without damage, rewards or immediate Bug spawning. Leaked Problems apply capped actual damage without resolution rewards. Product zero is terminal, including when multiple endpoints coincide.
- Private mutable state with detached frozen snapshots/queries/events. Restore validates content compatibility and reconstructs expected static arrivals to reject inconsistent IDs, routes, progress, health, debt, counters and outcomes without replaying a full tick history.
- An independent lab session owns the frame loop, 1x/2x scheduling, manual steps, hidden-tab/timing-gap pause, bounded event display and cleanup. React does not advance gameplay itself.

## Rule choices for this batch

The single-wave state machine is `preparation → active → drained/failed`; hard pause is an active-state flag. Commands execute synchronously between ticks. Tick processing spawns due traffic, moves all entities, settles endpoints in creation order, then checks drainage. Failure stops remaining endpoint settlement immediately; remaining entities are retained only for terminal diagnostics. No later ticks advance a terminal state.

Rules/snapshot version 1 is specific to this non-combat encounter. It intentionally rejects the old `tower.foundation.save` format. Adding actions, auras, new outcomes, multi-wave state or different ordering requires deliberate compatibility changes; never reinterpret old snapshots under changed rules.

## Verification and remaining work

The suite now includes 101 core/integration tests and 14 browser cases across desktop Edge and touch-emulated Edge. Browser cases exercise both labs, real foundation IndexedDB persistence, manual/automatic encounter timing, hard pause, both terminal outcomes, diagnostic restore, reset and responsive layout. Screenshots are generated under ignored `game/test-results/`. These checks do not establish physical mobile performance or cross-engine determinism.

Run `npm run verify` from `game/` for lint, dependency boundaries, all unit/integration tests, type checks, production build and browser tests.

Next batch: atomic Base Copilot placement and spending, Area/Cone visibility, Build/Defend/Auto targeting, cooldown-based contributions, successful Work/Problem settlement and their rewards. Completion/healing functions have not been added prematurely as unused code. Full normal-wave lifecycle, player save envelopes, replay recording, Personas, auras, debt cleanup, bosses and campaign commits remain later work.

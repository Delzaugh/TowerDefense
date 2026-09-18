# Test-map mechanics improvement plan

Status: Implemented; see [mechanics implementation and use](Test_Map_Mechanics.md) for delivered behavior, validation and compatibility. The original plan below records the design reviewed on 2026-09-12.

## Outcome and scope

Make one test map useful for repeatable experiments: select and configure placed towers, aim Cones directly by dragging, edit a wave queue, and rerun the same defense against different traffic. Keep gameplay authority in the pure TypeScript simulation and keep editor drafts/gestures outside it. No new renderer, scheduler, campaign system, or framework is needed.

## Current code assessment

| Requirement | Existing support | Required change |
| --- | --- | --- |
| Select a placed tower | Map hit testing and numbered buttons in `TowerLab.tsx` | Improve inspector visibility and separate selected settings from placement defaults. |
| Change Mode/Priority | Validated `set_mode` / `set_priority`; target commitment is cleared | Reuse commands and existing rules; no targeting rewrite. |
| Change Area/Cone after placement | Shape currently belongs to an immutable tower definition; the dropdown only changes the next placement | Add a bounded per-instance coverage selection, a validated command, and snapshot validation. |
| Aim a Cone with drag | `set_facing` already accepts any finite angle in [0, 360), during preparation | Add pointer gestures and angle preview/commit; reuse the command. |
| Configure a wave queue | Content already has validated `wave.spawns`; compilation sorts offsets stably | Add a pure recipe-to-content compiler and queue editor, not a second wave scheduler. |
| Repeat custom runs / restore after reload | Session closes over fixed content; save stores a snapshot and marker, not custom content | Add atomic scenario replacement, reusable starting layout, and versioned self-contained experiment saves. |

Evidence: [tower commands](../game/src/simulation/encounter/commands.ts), [dispatch](../game/src/simulation/encounter/createEncounter.ts), [targeting](../game/src/simulation/encounter/targeting.ts), [state](../game/src/simulation/encounter/state.ts), [wave contracts](../game/src/content/schemas/encounter.ts), [schedule compiler](../game/src/simulation/encounter/content.ts), [session](../game/src/session/createEncounterLab.ts), [save envelope](../game/src/persistence/testLabSave.ts).

## Proposed interaction rules

These are defaults for the implementation, not new approved production-game rules.

| Action | Preparation | Active, unpaused | Paused / finished |
| --- | --- | --- | --- |
| Select and inspect | Yes | Yes | Yes |
| Change Mode/Priority | Yes | Yes | No |
| Change Area/Cone or facing | Yes | No | No |
| Edit the next-run queue draft | Yes | Yes, draft only | Yes, draft only |
| Apply queue / start a fresh attempt | Yes | Explicit reset required | Finished: yes; paused active: explicit reset required |

All mutations and scenario replacement remain guarded during storage I/O or session disposal. Draft editing never advances or changes a running simulation. Reset abandons the current attempt; it is not an in-place tactical edit while paused.

The [current design](design/Core_Gameplay_Systems.md#line-of-sight) assigns each tower type one shape and permits rotation during planning. Allowing every production tower to freely switch shapes or rotate during combat would change that design. This plan enables shape switching explicitly for diagnostic tower definitions only, and keeps rotation planning-only. If live aiming is desired, revise the design and core phase guard together as a separate decision.

## 1. Selected-tower inspector and coverage configuration

### UI

- Give the selected tower a clearly titled inspector immediately beside/below the map, not beneath unrelated placement and diagnostic controls.
- Separate **New tower defaults** from **Selected tower N**. Changing defaults must never accidentally reconfigure the selected tower, or vice versa.
- Show coverage (Area/Cone), Mode (Auto/Build/Defend), Priority (Closest to Product/First spawned), facing, range, cone width, target, and cooldown. Range/width are read-only initially; the request does not require arbitrary stat editing.
- Keep map click/tap and keyboard-accessible tower buttons. Selection exits placement/marker mode. Reset/scenario replacement clears selection; restore validates that a selected ID still refers to the same attempt.
- Display lock reasons rather than only disabling controls. Keep the current priority list; adding strongest/last/severity needs separately defined comparisons and is outside this batch.

### Pure core changes

- Preserve `definitionId` as the tower's economic/action identity. Do not implement Area/Cone switching by replacing the tower or changing its definition ID: restore currently derives Compute spent and action timing from that definition.
- Add an instance coverage choice and an explicit optional set of allowed coverage profiles in definition content. Definitions without alternatives retain their single authored shape. Only test definitions opt into both Area and Cone, with bounded authored radius/angle values.
- Introduce a validated `set_coverage` command, preparation-only. Reject unsupported profiles, unknown towers, invalid phases, and malformed commands without mutation.
- Use one pure effective-coverage resolver for simulation visibility and rendered previews. Extend `CoverageTower` and placement previews so no consumer silently falls back to the definition's default after a switch.
- Switching coverage preserves tower identity, position, facing, cost, Mode/Priority, and readiness. It clears target/commitment consistently with existing configuration commands; it must not grant a free action or refund.
- Preserve facing across Area → Cone → Area → Cone. Area ignores facing for eligibility, but does not erase it.
- Bump the encounter snapshot schema/rules versions for the new stored field. Validate that every restored coverage choice is allowed by its definition. Version changed content contracts explicitly and update fixtures deliberately.

## 2. Click-and-drag Cone rotation

- Pointer-down on a tower selects it. For an editable Cone, dragging beyond the existing click threshold enters rotation; a stationary click only selects.
- Also provide a visible, generously sized direction handle for the selected Cone. An Area tower has no rotation handle. Dragging empty space still never places a tower.
- Replace overlapping placement/marker/selection/rotation booleans with an explicit map-tool and gesture state. The pointer-down target owns the gesture; a rotation must never fall through into placement on pointer-up.
- Convert screen coordinates with the existing SVG transform helper. Use a pure angle helper: `atan2(pointer.z - tower.z, pointer.x - tower.x)`, normalized to [0, 360). This matches existing +X toward +Z facing. Ignore points too close to the center; quantize committed angles to 0.1° for stable readable values, not 90° steps.
- During drag, render a local candidate facing, direction arrow, angle label, and effective occluded Cone. Do not dispatch on every pointer move.
- On release, dispatch one `set_facing` command if the angle changed and the same tower/attempt is still editable. Command rejection restores the authoritative view. The core decides the result.
- Escape, pointer cancellation/lost capture, a second pointer, visibility loss, start/pause, reset, restore, selection change, and disposal cancel the preview without a gameplay command.
- Scope touch gesture suppression to the tower/rotation handle, preserving normal page scrolling elsewhere. Use pointer capture for drags outside the map. Test this on touch emulation; do not claim physical-device verification.
- Add a selected-facing numeric control and small left/right angle steps as keyboard/touch alternatives. These use the same command and phase policy.

No new simulation rotation system is needed: the existing command already supports arbitrary angles. Only permitting active-wave rotation would require changing its core phase rule.

## 3. Editable wave queue

### Editor surface

Provide rows with:

- Work/Problem definition, chosen from existing definitions.
- Route, chosen from map routes (read-only if only one exists).
- Start time, count, and interval; friendly seconds entry with the resulting exact ticks shown.
- Add, duplicate, delete, move up/down, and quick batch insertion. Movement changes tie ordering; it does not secretly rewrite explicit start times.

Provide reusable recipes such as current mixed traffic, Work only, Problems only, and a simultaneous burst. Show total spawns, last scheduled spawn time, validation errors, and a chronological preview. Distinguish last spawn time from run duration, which depends on travel, combat and failure.

### Pure recipe compiler

- Add a versioned bounded recipe schema under `content/schemas/` and a pure compiler under `content/`. React owns unfinished input strings; only validated recipes reach the compiler.
- Convert seconds to nearest integer ticks at 60 Hz and make rounding visible. Store canonical integers, not accumulated floating-point seconds.
- Expand each row to ordinary spawn records: `startTick + index * intervalTicks`. Zero interval means simultaneous spawns. Validate counts and expanded totals before allocating arrays.
- Preserve stable row order and within-row order, then use the existing encounter compiler's offset/order sorting. Equal-time ordering affects entity IDs and First spawned priority and must be visible and deterministic.
- Enforce current limits: 1–1000 expanded spawns, offsets 0–36000, valid definition/route references, and the existing 216000-tick travel bound. An empty draft is allowed in the editor but cannot be applied.
- Preserve current scheduling semantics: offset 0 spawns on simulation tick 1; offset N spawns on tick N+1. Label the preview accordingly. Do not change tick ordering as part of editor work.
- Build a complete immutable encounter candidate and pass it through `parseEncounter`. The simulation continues consuming the same expanded spawn structure.
- Runtime queue display derives scheduled/spawned/settled state from the compiled order and snapshot, including distinguishing not-yet-spawned rows after early failure. UI row IDs do not become gameplay IDs.

## 4. Repeatable runs and persistence

### Session lifecycle

- Distinguish the editable recipe draft, the applied recipe/content, and the active attempt. Show when a draft differs from the running setup; edits never silently affect the current run.
- **Apply queue & prepare** validates a complete candidate before replacing anything. Default to retaining the planning tower layout/settings; provide an explicit clear-layout option.
- Recreate retained towers through valid placement/configuration commands in deterministic order. Recalculate initial Compute spending. Never transplant a terminal snapshot's rewards, health, targets, cooldowns, or spawn cursor into a new run. If the layout is unaffordable or invalid, leave the old attempt intact and explain why.
- Capture a starting blueprint on Start: applied recipe, preset, ordered tower placements/settings, and diagnostic marker. **Prepare same run again** reconstructs that blueprint at tick 0. Active-wave changes do not silently redefine the starting blueprint.
- Applying a different queue can reuse that starting blueprint for A/B testing. Do not automatically retain towers bought from mid-wave rewards. The user can revise the retained layout in preparation.
- Swap validated content/engine/diagnostics atomically within the session, reset clock/events/captures, and expose fresh content through the subscribed view. Audit all closures: current `content`, probe route, preview methods, save validation, and `session.content` otherwise keep referring to the original fixture.
- Keep one frame loop. A candidate engine can be constructed for validation but is never independently scheduled. Cancel pending UI gestures and clear stale selection when the attempt changes.
- Product preset changes must preserve the applied custom recipe deliberately, or ask before discarding a dirty draft. Remove hard-coded expected-outcome text for custom queues; show fixture expectations only for the exact matching default setup.

### Storage contract

- Custom saves must contain enough versioned data to reconstruct their exact encounter content, not only a snapshot/content signature. Include validated applied recipe, compatible resolved content, snapshot, marker, and the starting blueprint needed for reruns. Do not silently apply an unsaved draft when loading a saved run.
- Recompile the saved recipe and verify it matches resolved wave content, then run full snapshot/marker/blueprint validation before an atomic load. Retain save boundaries: preparation/finished only; memory captures remain separate.
- Add bounded recipe JSON import/export for easy experiment reuse. Recipes are data only; validate size, version, and references before applying. No executable scripts or arbitrary asset loading.
- Use a new explicit save-envelope/database version; leave current unified v1 and original foundation databases untouched. Do not silently reinterpret old saves after snapshot/content changes. State clearly in the UI that previous saves are retained but require an explicit compatibility migration to load in the new version. Automatic migration is not part of this batch.
- Preserve stale-tab revision conflict protection, storage failure reporting, busy guards, and ignored late I/O after disposal.

## Delivery sequence

1. **Contracts and regression fixtures:** add allowed coverage selection/resolution, command and restore validation, versioning, and pure unit tests. Keep existing default tower behavior unchanged.
2. **Selected-tower inspector:** split placement defaults from instance controls, surface Mode/Priority/Coverage, and fix selection lifecycle. Verify switching shapes changes actual targeting, not only the drawing.
3. **Rotation interaction:** add pure angle helpers, gesture states, preview/cancel/commit, and numeric fallback. Verify mouse/touch and phase locks.
4. **Queue compiler and editor:** bounded recipes, expansion, chronological preview, presets, and per-row validation. No live queue mutation.
5. **Session and persistence:** atomic apply, retained starting layout, repeat attempts, self-contained new save format and recipe import/export. Remove fixture-only assumptions in the UI.
6. **End-to-end verification and documentation:** update the unified guide and design notes to mark coverage switching as diagnostic-only. Run `npm run verify`, inspect desktop/phone screenshots, and record actual test counts.

## Acceptance tests

- Select tower A, change its coverage/mode/priority, and confirm tower B and new-tower defaults are unchanged. Verify mode category eligibility, priority tie ordering, and shape-dependent targets in core tests.
- Round-trip Area/Cone and arbitrary facing through capture/restore and local save/load. Reject disallowed coverage and malformed snapshots without modifying live state or Compute.
- Drag a Cone to cardinal angles and across 359°/0°, including touch; preview is non-authoritative and release emits exactly one configuration command. Click alone, drag cancellation, scroll, pointer loss, reset, and phase transitions never place/rotate accidentally.
- Editing while paused cannot bypass the simulation guards. Active Mode/Priority remain available; active facing/coverage remain locked.
- Compile equal-offset rows, bursts, fractional-second entries, row reordering, maximum sizes, empty/invalid rows and dangling references. Identical recipes produce identical schedules and outcomes under identical commands/ticks.
- Apply a draft without losing the valid starting defense; invalid apply leaves the entire existing attempt unchanged. Rerunning resets outcomes/cooldowns/resources rather than carrying earned rewards forward.
- Edit a draft during a run and confirm the current schedule is unchanged. Reload a saved custom run and confirm the exact queue, tower settings and blueprint restore even when the default fixture differs.
- Verify stale saves, storage failure, legacy data preservation, snapshot content mismatch, lifecycle cleanup, desktop/touch layout, and existing no-tower/defended outcomes.

## Explicit exclusions

No production-wide free shape switching, active-wave aiming, tower moving/selling, new priority algorithms, custom enemy-stat authoring, live spawn injection, multi-wave progression, automated batch analytics, or 3D rendering. Those can follow once these experiments expose a concrete need.

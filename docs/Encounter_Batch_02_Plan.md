# Batch 02 — tower placement, targeting and actions

## Scope and deliverables

Extend the existing pure TypeScript encounter and its SVG diagnostic lab. Implement Base Copilot placement/spending, Area/Cone visibility, local Build/Defend/Auto selection, integer-tick cooldowns, aggregated work/damage pulses and exactly-once rewards. Preserve both original no-tower fixtures and the independent foundation console. No Personas, upgrades, selling, campaign commits, multi-wave orchestration, player saves, or 3D assets are added.

## Implementation sequence

1. **Contracts and compatibility:** integrate validated Base Copilot definitions into encounter content; add placed tower state, modes, priorities, facing, target commitment and readiness ticks. Introduce bounded settled-outcome records to validate the now variable health/economy on restoration. Bump encounter content/snapshot/rules versions; reject old memory snapshots explicitly. Foundation IndexedDB saves are unaffected.
2. **Atomic placement:** share a pure preview/dispatch eligibility check. Reject unknown definitions, outside-buildable footprints, map obstacles, touching/overlapping towers, insufficient Compute, paused/terminal phases and the 100-tower diagnostic limit. Only after all checks pass allocate a separate monotonic tower ID and deduct cost. Selection is presentation state, not a gameplay mutation.
3. **Visibility and target selection:** use authored logical coordinates, never SVG geometry, for range/shape/occlusion. Implement closest-to-Product and first-spawned priorities with numeric ID tie-breaking. Build sees only Work, Defend only Problems, Auto prefers Problems except during its current valid commitment. Losing sight/range or resolving a target releases it immediately. Explicit mode/priority changes clear commitment. Facing changes are preparation-only.
4. **Actions and outcomes:** spawn → target/action evaluation at pre-movement positions → aggregate contributions per target → settle completions/resolutions → move survivors → settle endpoints → clear invalid targets → terminal check. Ready towers act immediately on acquisition; a pulse sets an absolute next-ready tick, with no idle burst. Concurrent pulses all consume cooldown, excess output is discarded, and targets settle only once. Completed Work pays Compute, capped healing and one Product Progress; resolved Problems pay Compute. Missed Work/leaks retain batch-01 consequences.
5. **Restore invariants:** validate IDs/references/geometry, schedule/entity/outcome conservation, remaining-work bounds, target eligibility, readiness/commitment clocks, and exact health/debt/progress/Compute accounting. Reconstruct outcomes without replaying them. A restored engine must produce identical future events and state. Restores are consistency checks, not anti-cheat proofs of every historical command.
6. **Lab integration:** place via map click/tap or explicit coordinate controls; inspect preview rejection and nominal/effective coverage; select towers through map/list; change mode/priority/facing; display target, cooldown, work progress, rewards and event history. Add an authored blocker fixture and a clearly diagnostic Cone definition. Preserve exact stepping, pause, capture/restore and reset.
7. **Verification:** run pure unit/integration tests, regression tests for batch 01, then build and desktop/touch browser tests. Visually inspect screenshots. Update implementation/testing notes with actual results.

## Explicit fixture policies

All numerical values are engineering tuning, not approved Level 1 balance. Base target origin is its placed center. Facing is measured in degrees from +X toward +Z; boundaries are inclusive, blocker tangency occludes. No implicit route placement exclusion is introduced. Area is the Base fixture; Cone is a test variant, not a new Persona. Auto commitment lasts the authored number of ticks from acquisition. Non-Auto priorities reevaluate each tick. Health/damage/work/Compute remain integers.

The one-wave `drained` result still does not mean Level 1 victory. Captures remain developer-only, memory-only snapshots. Successful work may now drain a wave before its original last arrival tick, but never before every scheduled spawn has been handled.

## Acceptance checklist

- Rejected placement/configuration leaves the complete snapshot and event sequence unchanged; no money or IDs consumed.
- Placement boundaries, circular overlap, blocker tangency, Area/Cone edges and facing produce repeatable results.
- All three modes enforce category rules; priorities and Auto commitment/ties are stable; occluded targets cannot receive contributions.
- Integer cooldowns respect pause and 1x/2x scheduling; same-tick contributions cannot duplicate payouts or also cause a leak.
- Full-health Work still pays Compute/progress, actual healing is capped, partial Work pays nothing, terminal failure cannot recover.
- Captures with placed towers, partial work, readiness and commitment restore identical continuations; corrupt versions, references, accounting and positions reject.
- The browser lab supports placement, rejection feedback, tower selection/configuration, progress, rewards, capture/restore and reset on desktop and touch-emulated viewports.

Status: implemented and verified. See [batch implementation notes](Encounter_Batch_02.md) for testing recipes, exact fixture outcomes, compatibility changes and verification evidence.

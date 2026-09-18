# Tower foundation audit

2026-09-17 · Assessment and proposed work, not an implemented refactor.

**Follow-up:** batches 1 and 2 have now been implemented. This audit preserves the pre-change findings; [Tower Foundation Implementation](Tower_Foundation_Implementation.md) records the delivered contracts, engineering choices, and remaining limits.

The current architecture can be extended without replacing the simulation, session, or UI stack. The main constraints are a Base-Copilot-only content/state contract, one targeted action per Tower, fixed-speed travel, fixed rewards, and save validation built around those assumptions. QA Aura makes the movement and reward limitations immediate implementation dependencies, even before Human Towers arrive.

## Accepted design inputs

- Towers share placement and lifecycle foundations. Family, Tower type, capabilities/behavior, and progression are distinct concerns.
- Copilot progression stays family-specific. Human Towers are future content; Senior Developer is powerful, expensive, and limited to one on the map. People Manager is non-placeable player support.
- Tester has an independent passive QA Aura alongside its main action. It slows Enemies by 10% and adds bonus Compute on productive completion. The bonus amount/formula remains open.
- QA Aura shares the Tower's resolved action range and effective coverage, including shape, facing, and obstacle blockage. It has no independent radius. Main-action mode, target, and cooldown do not gate the passive.
- Overlapping QA Auras select the strongest effective slow and bonus separately. Other effects declare their own combination policies as introduced.
- Numerical modifiers alter existing stats. Adding abilities or changing behavior requires explicit upgrade operations. External modifier sources and specific upgrades remain to be designed.

Canonical rules: [Copilot design](design/Copilot_Agent_Design.md#tester-quality-aura--prototype-rule), [Tower stats and modifiers](Tower_Base_Stats.md#ability-and-effect-modifiers), [future families](design/Content_Design.md#human-towers-and-supporting-characters).

## Findings

These are extension constraints, not claims that the present Base Copilot prototype is broken.

| Area | Evidence in current code | Required direction |
| --- | --- | --- |
| Family versus behavior | `content/schemas/gameplayDefinitions.ts` exposes only `baseCopilotSchema`; `encounter.ts` accepts only that schema. All seven placement/action stats are mandatory in `towerStats.ts`. | Separate shared placement/identity from applicable action and ability contracts. Do not require dummy Work/damage/cooldown fields on a future support-only Tower or classify a Human as `base_copilot`. |
| Capabilities and instance state | `simulation/encounter/state.ts` requires mode, priority, target, readiness, and commitment on every Tower. `targeting.ts:eligible` derives category support solely from positive output. | Declare capabilities explicitly, while zero output may still disable effective action eligibility. Keep action-specific state with the action behavior and Copilot progression with its family. |
| Commands and UI | `createEncounter.ts` initializes every Tower with the same controls; mode and priority commands have no per-definition permission check. `TowerInspector.tsx` always exposes those controls; `TowerStatsPanel.tsx` assumes the full action stat set. `TowerLab.tsx` hardcodes `base_copilot`. | Validate controls against the definition in the simulation and show applicable controls in the UI. Resolve the placement choice from available content. Preserve the current one-choice Alpha experience until another choice is introduced. |
| Independent passives | `actions.ts:act` loops over one selected target and one readiness timestamp per Tower; there is no ability/effect evaluation stage. | Evaluate passive coverage independently of main-action targeting and cooldown. Reuse `targeting.ts:visibility`, not `eligible`: the latter would incorrectly disable Enemy slow in Build mode and Work rewards in Defend mode. |
| Dynamic movement | `content.ts` precomputes `arrivalTick`; `distanceAt` derives distance from elapsed time and immutable speed. `createEncounter.ts` overwrites distance with that formula and leaks entities on the precomputed arrival tick. | Accumulate authoritative distance using effective speed and detect actual endpoint crossing. An aura cannot be implemented by changing only rendering speed or the authored definition. Preserve fixed-step determinism and completion-before-movement behavior. |
| Modified rewards | `outcomes.ts:settle` always pays `definition.computeReward`. `snapshot.ts` reconstructs the same fixed reward. | Resolve the applicable bonus at productive completion using shared visible coverage and strongest-only selection, independent of which Tower finished the Work. Record enough settlement context to validate the reward later without depending on present-day aura state. Preserve one payout per entity and unchanged healing/Product Progress. |
| Modifiers and timing | `stats.ts` merges authored defaults with absolute diagnostic overrides only. No upgrade ownership, source tracking, or expiration exists. `snapshot.ts` bounds readiness against current cooldown/commitment values. | Add typed production modifier resolution when used by concrete abilities/upgrades. Keep test overrides distinct. Define how an in-flight cooldown behaves when its stat changes; current save bounds can reject legitimate old deadlines after a cooldown reduction. Ability changes are separate operations. |
| Placement limits | `towers.ts` checks total `towerLimit`, occupancy, budget, and geometry; no per-type count restriction exists. | Add an optional per-type cap using the authoritative placement validator, including restore validation and readable rejection. Senior Developer can later use a cap of one. Shared restrictions across future variants remain a separate design choice. |
| Persistence and replay of starting defenses | `snapshot.ts` requires exact fixed-speed distance, static arrival timing, and fixed rewards. `blueprint.ts` copies a fixed set of controls and unconditionally replays coverage/mode/priority commands. `persistence/testLabSave.ts` embeds content, snapshot, and blueprint schemas. | Change validation, blueprints, and save contracts with each feature. Preserve applicable configuration/progression and reconstruct fresh transient action/effect state for repeat attempts. Version incompatible formats explicitly; retain old data rather than silently reinterpret it. |

Evidence paths above are relative to [game/src](../game/src/). Main integration points: [tick and command orchestration](../game/src/simulation/encounter/createEncounter.ts), [snapshot validation](../game/src/simulation/encounter/snapshot.ts), [coverage query](../game/src/simulation/encounter/targeting.ts), and [Tower inspector](../game/src/app/TowerInspector.tsx).

## Foundations to retain

- Pure TypeScript rules separated from React, browser persistence, and presentation; existing dependency rules enforce this boundary.
- The common stat resolver and range/shape/obstacle visibility query. QA Aura should consume the same resolved coverage, without another radius field or geometry implementation.
- Authoritative, atomic command rejection and placement preview, including reuse of placement validation on restore.
- Fixed ticks, hard pause, coherent simultaneous action contributions, discarded overkill, and exactly-once outcome accounting.
- Definition references on placed Towers, detached snapshots, versioned content, and repeatable starting-defense blueprints.

## Recommended bounded sequence

### 1. Shared Tower contract refactor

Separate family/type identity, placement properties, capabilities, supported controls, and the current targeted-action behavior. Carry existing Base and Cone diagnostic definitions through the new contract without changing their outcomes. Add an optional per-type placement cap. Adapt command validation, UI assumptions, blueprints, and snapshots together. Verify restrictions with diagnostic fixtures rather than inventing playable Human Towers or their progression.

This is the first recommended implementation batch. Its acceptance criteria are unchanged Base Copilot behavior, content-driven controls, rejection of unsupported commands, atomic duplicate-limit rejection, and exact capture/restore and repeat-attempt behavior.

### 2. QA Aura as the first concrete passive/effect feature

Implement the passive alongside its main action, reuse Tower visibility, and introduce only the effect/modifier operations required by concrete fixtures. Refactor movement and endpoint handling for effective speed, and reward settlement for an independently resolved completion bonus. Save source/lifetime and settlement state needed for exact continuation and validation. Define modifier ordering, bounds, tick evaluation order, and cooldown-change semantics before coding this batch.

Test bonus Compute with clearly labeled engineering values until its production amount/formula is chosen. This audit does not approve balance values or a complete Tester upgrade tree. Other combination policies can be added when a concrete effect needs them; QA Aura exercises strongest-only.

### 3. Add content and progression against the proven contracts

Introduce playable Personas/upgrades and later Human Towers as their designs become concrete. Keep skill/model/context systems, Human abilities, and supporting-character interactions deferred. Existing Tower IDs and snapshot validation assume no selling/removal; revisit those assumptions when that lifecycle is designed, rather than invent replacement rules now.

## Verification plan for implementation

- Preserve existing Base Copilot outcomes, action cadence, simultaneous contribution behavior, blocked coverage, placement accounting, and pause restrictions.
- Verify QA Aura without a main target, in all three modes, behind blockers, at range boundaries, and after a range change. Action and aura coverage must agree.
- Verify 10% Enemy slow without slowing Work; entering/leaving coverage; strongest-only overlap; and independent strongest bonus selection.
- Verify completion rewards once when multiple Towers contribute, without changing healing or Product Progress. Apply the cleanup exception when cleanup content is introduced.
- Verify movement/endpoints after slow changes, modifier removal/expiration, and restoration during an active effect. Fixed-speed arrival assumptions must not remain in restore or outcome validation.
- Verify malformed modifier/ability references, unsupported commands, impossible placement counts, corrupted settlement accounting, and snapshot consistency. Do not replace existing accounting checks with unchecked bonus fields.
- Review the current maximum-tick/fixture-duration bounds when slow effects extend encounters. Establish safe bounds without assuming immutable travel time.
- Run the full existing verification command after implementation, including browser tests for applicable controls, effective values, and local save/repeat flows.

## Audit validation

Read-only inspection of content schemas, simulation, targeting/coverage, placement, actions, movement, outcomes, snapshots, blueprints, UI, and test-lab persistence. `npm test` passed: **229 tests across 13 files**. `npm run check:boundaries` passed with no dependency violations across 51 modules. No gameplay source was changed by this audit. Design documentation was updated for the accepted coverage, effect-combination, and explicit-upgrade boundaries. Browser behavior and future features were not validated by this audit.

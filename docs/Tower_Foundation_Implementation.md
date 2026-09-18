# Tower foundation and QA Aura implementation

2026-09-17 · Implements batches 1 and 2 of the [Tower foundation audit](Tower_Foundation_Audit.md). Playable Human content and the Copilot Persona tree remain future work.

**Subsequent design baseline:** the [accepted seven-Tower definitions and stats](Tower_Base_Stats.md#tower-overview-and-playtest-stats) now include Analyst, Security, Architect and Linter. This implementation report describes the existing foundation and diagnostic fixtures, not delivery of those new behaviors. [Architecture follow-ups](design/Technical_Architecture.md#accepted-roster-implementation-follow-ups) records the required extensions. No test results below validate unimplemented roster mechanics.

## What changed

Tower definitions now separate `family` (`copilot` or `human`) from behavior `kind` (`targeted` or `passive`). Targeted definitions declare Work/Problem capabilities and supported modes/priorities. Passive definitions require only placement/range stats and coverage, with no dummy action stats. Placed Towers have nullable `action` state; only a targeted action owns mode, priority, target, cooldown, and commitment.

Each definition can declare `placementLimit`, independent of the total map limit. Placement rejects a second instance of a capped type before allocating IDs or spending Compute. Restoration verifies the same command rules. Human support and one-per-map behavior are verified with a diagnostic test fixture; no Senior Developer gameplay or People Manager placement was introduced. Future variants sharing one uniqueness identity still need an explicit grouping design.

The inspector follows each definition's controls. The test map provides Base Copilot, Tester QA probe, and a passive-only QA probe. These probes are development fixtures, not an alternative Alpha progression design. The Base Copilot retains its original stats and encounter outcomes.

## QA Aura

- Passive behavior runs independently of the main action, its mode, target, and cooldown.
- Both effects reuse resolved Tower range, shape, facing, and obstacle visibility. No independent aura radius or blocker bypass exists.
- Enemies inside coverage move 10% slower at base strength. Work remains at ordinary speed.
- Productive Work completed in coverage receives a bonus, independent of which Tower contributes the final action. Healing and Product Progress are unchanged; simultaneous contributions pay once.
- Each aura declares strongest-only combination separately for slow and bonus. Overlapping Testers can supply different winning effects.
- Target diagnostics show effective slow or completion bonus. QA labels identify passive emitters; selected/previewed coverage shows the same blocked region as the action.

The Tester probe uses **+2 Compute**, **3 Work/damage per action**, a **20-Compute upgrade** granting **+5 percentage points slow and +1 Compute**, and a free diagnostic **5-second external boost of +5 percentage points slow**. These remain engineering fixtures. The accepted initial Tester design preserves Base's **5 Work/damage**, uses **10% slow** and **+1 Compute**, and costs **20 Compute to specialize from Base**. That Persona price is separate from the probe's diagnostic enhancement; fixture alignment and the Persona transition remain pending.

## Modifiers and explicit upgrades

Definitions author available upgrades and external effect definitions. `buy_upgrade` validates ownership, ability availability/conflicts, phase, budget, and paused state. An upgrade can contain `modify` operations or an explicit `add_ability` operation. The implemented ability is QA Aura; adding another behavior requires its own typed contract and execution rules.

Numerical resolution is:

`authored stats → diagnostic overrides → owned upgrades → active external effects → effective values`

Within each modifier stage, additions precede multipliers. Upgrades resolve in authored order; external instances sort by source ID then effect ID, using ordinal comparisons. `qaSlowPercent` additions are percentage points; multiplication is a relative factor. Bounds apply after each nonempty stage, and integer action/output stats round after resolution. QA slow rounds to 0.01 percentage points. Effective slow is bounded to 0–90%, preserving forward movement; modified range is bounded to 0.01–100. Unmodified authored/diagnostic ranges retain their existing >0–100 contract. Other action stats retain their schema bounds. These are implementation rules, not final upgrade balance.

`apply_effect` accepts only an effect authored for the receiving Tower and records `effectId`, `sourceId`, application tick, and expiry tick. Reapplying the same effect from the same source refreshes one instance. Distinct sources are separate modifiers. `remove_effect` removes only the named source/effect pair. Other systems can use these authoritative commands when their source mechanics are introduced. The test inspector exposes the authored effect fixtures only on definitions opted into diagnostic tuning.

A duration of N affects exactly the next N simulation steps and freezes while paused. Effective stats update immediately on commands. Existing action cooldown and commitment deadlines retain their scheduled times when stats change; subsequent actions/acquisitions use the new values. Lost range or visibility still releases targets immediately.

Numerical enhancement of a Tower's aura does not change how overlapping aura effects combine. Additive/refresh-duration policies for other emitted effects remain extension points until an actual effect needs them.

## Movement and settlement

The simulation no longer computes endpoint arrival from an immutable speed. Each moving entity accumulates integer `travelUnits` (10,000 units per normal-speed tick). QA slows reduce that tick's contribution. Distance derives from accumulated travel and authored speed; endpoints settle only when the entity actually reaches the route end. This preserves unmodified movement calculations while avoiding accumulated fractional-tick drift.

Tick order is spawn → main actions and completion settlement → movement using aura coverage at pre-movement positions → endpoint settlement → expire effects → clear invalid targets → terminal check. An effect applied between ticks lasts through its final movement/action step and is removed before that step's snapshot is published. Completions still win over a would-be leak/miss in the same tick.

Content validation conservatively permits up to ten times normal Enemy travel duration if any available Tower/upgrade can produce QA Aura, matching the 90% slow ceiling. Encounters must remain within 216,000 ticks. Work is not slowed. Technical Debt cleanup is not implemented in this slice; its future content must preserve the no-reward rule.

## Saves and repeat attempts

Content, snapshots, and rules use **version 6**, content revision **v06**, and the test-lab envelope uses **version 5**. The databases are `tower-test-map-standard-v6` and `tower-test-map-fragile-v6`. Earlier databases remain intact; no automatic migration is provided. Wave recipe JSON remains version 1.

Snapshots include a bounded journal of accepted commands with their simulation ticks. Restore structurally validates the candidate, replays those commands against the exact content from a fresh simulation, advances to the saved tick, and compares the entire resulting state. This verifies movement, historical bonus rewards, upgrade spending, sources/expiration, geometry, capabilities, counts, targets, and counters together. It rejects corrupt result fields rather than accepting an unchecked bonus ledger. Historical replay events do not reappear in the session's event list. This is deterministic consistency validation, not proof against someone rewriting both history and state.

The diagnostic limit is 10,000 accepted commands per run; effect instances are limited to 32 per Tower. Restore cost grows with run duration, traffic, and command history; large diagnostic recipes have not been device-performance profiled. Player saves retain the existing preparation/finished-run restriction; memory captures can restore active effects.

Starting blueprints retain purchased upgrades and applicable configuration, charge their costs again against fresh starting Compute, and rebuild fresh action state. Temporary external effects are run state, so repeat attempts do not copy them from the previous run. Saved snapshots still preserve such effects exactly.

## Code ownership

| Concern | File |
| --- | --- |
| Definitions, capabilities, controls, placement cap | [gameplayDefinitions.ts](../game/src/content/schemas/gameplayDefinitions.ts) |
| Abilities, modifiers, upgrade operations, effect definitions | [abilities.ts](../game/src/content/schemas/abilities.ts) |
| Stat and ability resolution | [stats.ts](../game/src/simulation/encounter/stats.ts) |
| Passive coverage and effect combination | [effects.ts](../game/src/simulation/encounter/effects.ts) |
| Commands, tick order, movement, authoritative replay | [createEncounter.ts](../game/src/simulation/encounter/createEncounter.ts) |
| Saved state and structural validation | [state.ts](../game/src/simulation/encounter/state.ts), [snapshot.ts](../game/src/simulation/encounter/snapshot.ts) |
| Repeatable starting defense | [blueprint.ts](../game/src/simulation/encounter/blueprint.ts) |
| Diagnostic content | [testMap.ts](../game/src/content/levels/testMap.ts) |

## Verification

`npm run verify` passed: **244 unit/integration tests and 40 desktop/touch-emulated Edge browser cases**, plus lint, type checking, dependency boundaries, and production build. The dedicated preview process needed manual cleanup after browser tests completed; the verification command then exited successfully. Desktop and touch QA screenshots were visually inspected. Physical-device performance is not claimed.

The original 229 tests preserve their behavioral assertions after adapting to nested action state and the revised schema. New simulation tests cover passive/Human definitions, per-type caps, unsupported controls, independent aura effects, blockers/cones/range, upgraded and external effects, exact expiration, immutable bases, adding abilities, saved cooldown deadlines, repeat attempts, and tamper rejection. Browser cases cover QA controls/rewards/upgrades/effects, save/reload, and passive-only controls.

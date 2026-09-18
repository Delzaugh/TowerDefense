# Pure TypeScript gameplay implementation plan

Status: Proposed implementation plan, based on the current foundation and design. This document schedules work; it does not mark gameplay as implemented or approve unresolved balance values.

Implementation update: [Batch 01](Encounter_Batch_01.md) delivers strict single-wave traffic contracts, IDs/spawning/movement, missed-work debt, Product damage/failure and snapshot restore. At the user's request, it also adds an interactive encounter lab despite the original UI exclusion below. Successful completion/reward functions, tower rules, multi-wave progression and replay recording remain pending; this is not completion of all M1–M5 scope.

Subsequent update: [Batch 02](Encounter_Batch_02.md) implements placement/spending, Area/Cone visibility, local targeting, actions, completion/resolution rewards and expanded lab inspection. M4 multi-wave/player checkpoint work and M5 replay recording remain pending. The original sequencing below is retained as the plan history.

## 1. Outcome and scope

Build a headless, deterministic encounter that can be constructed, commanded, advanced, saved as data, restored, and tested without React, a browser, Three.js, models, or storage I/O.

The first completed slice supports moving productive Work and Problems, Base Copilot placement, Build/Defend/Auto targeting, completion/resolution/leak outcomes, Compute, fixed-maximum Product health, Product Progress, debt accumulation, authored normal waves, and explicit encounter success/failure. An automated script must be able to play it entirely through the public API.

This expands the earlier five milestones—contracts, entity lifecycle, combat, encounter lifecycle, and replay/tests—without turning them into a full Level 1 implementation. Work is a first-class entity from the beginning, not an enemy with renamed health. Cleanup has a distinct outcome contract, introduced when the sprint is implemented.

Not part of this tranche:

- Rendering, GLB delivery, animation, UI, input gestures, audio, or browser storage changes.
- Full Level 1 scripts and balance, Developer/Tester mechanics, ambiguity, debt cleanup, or Production Incident behavior. Their follow-on order is recorded below.
- Campaign persistence, wave retry, selling/refunds, or recovery bonuses.
- ECS frameworks, networking, backend services, generic ability/plugin systems, or dormant future AI layers.

## 2. Source of truth and existing implementation

The plan follows [Core Gameplay Systems](design/Core_Gameplay_Systems.md), [Agent Design](design/Copilot_Agent_Design.md), [Content Design](design/Content_Design.md), and [Level 1](design/levels/Level_01_Just_One_Small_Feature.md). Those documents retain ownership of game rules and their Locked/Prototype/Hypothesis statuses. [Technical Architecture](design/Technical_Architecture.md) and [Codebase Structure](Codebase_Structure.md) own module boundaries.

Current code inspected for this plan:

| Existing code | Reuse or required change |
| --- | --- |
| `game/src/content/schemas/data.ts` | Reuse strict parsing, structured errors, deep freezing, stable IDs and canonical logical-content comparison. |
| `game/src/content/schemas/scenario.ts` | Reuse logical points, rectangles and routes. The current scenario is a timed probe, not a wave/encounter contract. |
| `game/src/simulation/geometry.ts` | Reuse distance-based polyline sampling and rectangle tests; extend with tower-sized placement, circle overlap and Area/Cone visibility. Do not reuse the fixture's fixed marker radius as tower tuning. |
| `game/src/simulation/createSimulation.ts` | Preserve synchronous commands, fixed ticks and snapshot discipline. Its single marker and duration-driven completion are probe-specific. |
| `game/src/simulation/state.ts` | Do not reuse its `eventSequence = commandSequence + completion` invariant: gameplay commands/ticks may emit zero, one or many events. |
| `game/src/session/fixedStepClock.ts` | Reuse unchanged for later integration and clock-equivalence tests; no wall-clock logic enters the encounter. |
| `game/src/persistence/saveSchema.ts` | Leave the foundation save format intact. A gameplay checkpoint is a new versioned contract, not an implicit conversion of a marker save. |
| Compiler, lint, dependency checks and tests | Extend existing gates. The foundation's recorded baseline is 51 unit/integration cases and 8 browser cases; this planning task does not rerun or recertify them. |

### Compatibility strategy

Keep the current diagnostic console and probe API operational. Add the gameplay engine under `simulation/encounter/`, with `createEncounter` and `restoreEncounter` as its entry points. Share real geometry/data helpers, but do not build a generic engine abstraction merely to unify the probe and gameplay implementations.

The existing session is explicitly coupled to the probe's phases and queries. Adapting it to encounters is a later integration task, not a silent consequence of this work. Gameplay tests instantiate the new engine directly. Foundation saves stay readable by the existing console and are never overwritten by headless tests.

## 3. Module ownership and proposed files

Paths below are planned files, created only when their implementation lands. Continue using one npm package.

```text
game/src/
  content/
    schemas/
      gameplayDefinitions.ts      # Work, Problem, Base Copilot, Product data
      encounter.ts                # Waves, spawns, initial economy, end policy
    levels/
      headlessSlice.ts            # Explicit engineering fixture; not Level 1
  simulation/
    geometry.ts                   # Existing shared logical geometry
    encounter/
      index.ts                    # Narrow public exports
      createEncounter.ts          # Construction, dispatch and tick orchestration
      state.ts                    # Runtime state and public snapshot types
      snapshot.ts                 # Snapshot parsing and semantic invariants
      commands.ts                 # Commands, validation and rejection reasons
      events.ts                   # Typed payloads and stable event order
      entities.ts                 # IDs, insertion, lookup and removal
      movement.ts                 # Route distance and endpoint candidates
      visibility.ts               # Range, shape and occlusion queries
      targeting.ts                # Eligibility, priority and commitment
      actions.ts                  # Cooldowns and work/problem contributions
      outcomes.ts                 # Exactly-once removal, rewards, leaks and debt
      towers.ts                   # Atomic placement and configuration rules
      waves.ts                    # Authored scheduling and wave transitions
      lifecycle.ts                # Preparation, active and terminal rules
      queries.ts                  # Detached previews and derived logical views
      checkpoint.ts               # Pure between-wave checkpoint contract
      replay.ts                   # Command recording/playback and diagnostics
game/tests/
  fixtures/encounter.ts
  content/encounter.test.ts
  simulation/encounter/            # Tests corresponding to implemented systems
  integration/encounterRestore.test.ts
  integration/encounterReplay.test.ts
  performance/encounter.bench.ts   # Headless measurements, not browser FPS
```

Content imports schemas only, never rules. Simulation imports validated content and its own pure modules. Modules receive explicit state/content arguments; no singleton stores, dependency injection container, global event bus, or browser callbacks. Mutable collections remain private. Public commands, snapshots, events and queries use plain serializable values and detached read-only data.

Use a simple entity collection plus explicit ordered iteration initially. Do not make a spatial index or object pooling a prerequisite; measure the real workload first.

## 4. Decisions to record before implementing behavior

These are proposed engineering policies, not claims that the GDD already specifies them. Record them beside the tests in milestone 0. Fixture values can unblock implementation; unresolved design choices must remain labeled and cannot be presented as approved Level 1 rules.

| Decision | Proposed first-slice policy |
| --- | --- |
| Time | Keep 60 Hz. Spawn times, cooldowns and commitment windows are integer simulation ticks. Advancing one tick never accepts variable delta time. |
| Numeric state | Integer health, Compute, work units and counters; bounded finite route distances in world units. Any fractional output needs an explicit fixed-unit scale/remainder and rounding rule before implementation. |
| Identity | Monotonic numeric entity sequence per run, never reused after removal. Caller supplies run ID. Save the next allocator value; no UUID generation inside simulation. |
| Ordering | Spawns ordered by tick, authored spawn order, then ordinal. Towers/entities use numeric creation order; ties never depend on locale-sensitive sorting or container accident. |
| Target priorities | Implement `closest_to_product` first, comparing remaining route distance, with creation ID as tie-breaker. Add other named priorities only with precise comparison rules; do not expose unsupported enum values. |
| Combat cadence | Instant logical work/damage pulses at authored cooldown ticks. Animation/projectile timing is outside scope. A ready tower may act on acquisition; no stored burst of missed attacks while idle. |
| Same-tick resolution | Assess targets/actions at tick-start positions, settle successful actions, then move surviving entities and apply endpoint outcomes. A task completed this tick cannot also become missed work. |
| Lethal leaks | Once leak processing reduces health to zero, failure is latched for that tick. No later event can resurrect the run. Work completion/healing already settled before movement. |
| Rotation | Accept facing at placement and allow rotation during preparation. Keep active-wave rotation disabled pending a design decision; active modes/priorities and placement remain supported. |
| Paths and placement | Reject tower overlap and map-authored prohibited footprints. Do not invent a ban on route placement unless route exclusion geometry is authored. No dynamic path rerouting. |
| First-slice terminal state | `encounter_succeeded` means this explicitly labeled normal-wave fixture cleared with health remaining. It is not Level 1 victory and emits no campaign unlock/growth commit. |

Auto's Problem-first behavior, immediate release on invalid targets, hard-freeze pause, and all-or-nothing Work rewards come from the design and are not optional policies. Auto commitment duration and output/cost/health values remain tuning inputs.

## 5. Milestone 0 — protect the foundation and define the seam

**Dependencies:** none. **Deliverable:** small scaffolding/contract change, no gameplay feature claims.

1. Run the existing checks and record the actual baseline before editing.
2. Introduce the encounter entry point and state/command/event names without changing the probe API.
3. Ensure the no-DOM/no-Node compiler and purity lint/dependency rules cover every new file. The current `simulation/**` and `content/**` patterns already cover the proposed locations.
4. Add shared test helpers: construct fixture content, dispatch validated commands, advance an exact tick count, collect events, serialize/restore.
5. Record tick ordering and fixture-only assumptions from section 4. Add a basic manually started encounter test.

**Acceptance:** existing probe checks stay green; importing a browser/session/storage module into the encounter fails the boundary gate; advancing during preparation does nothing. Do not add passing placeholder tests for absent systems.

## 6. Milestone 1 — gameplay contracts and validated content

**Dependencies:** M0. **Ownership:** `content/schemas`, encounter state/commands/events/snapshot.

### Implementation

- Define distinct discriminated content types for productive Work and Problems. Work has required work and completion rewards; Problems have durability, severity/leak damage and resolution rewards. Do not give productive Work an enemy damage-on-leak default.
- Define Base Copilot data: placement cost, footprint radius, target-origin offset, Area/Cone coverage, work/problem action amounts and cooldowns, and Auto commitment ticks. Do not add unfinished persona or upgrade variants to runtime unions.
- Define Product maximum/initial health and initial Compute. Level-local debt and Product Progress start at zero for a new run.
- Define versioned encounter content referencing validated map/routes, definitions, explicit ordered waves and bounded spawn entries. Use offsets relative to the active wave's tick, never browser time.
- Validate duplicates, missing references, finite positive speed/range, valid cone angles, integer timing/cost/output, health bounds, roster support, and limits on expanded spawn counts. Reject unsupported behavior before construction.
- Produce a frozen resolved content bundle and logical-content signature once per construction. Compiled lookup tables/route caches are derived, not serialized or recomputed every tick.
- Separate runtime state from definitions: entity ID, definition ID, route ID/distance, remaining work/durability; tower identity/configuration/target/cooldown; Product/economy; phase and wave clocks; schedule cursor; counters and run totals.
- Define typed command rejections and event payloads with affected IDs and actual deltas. Events describe facts; subscribers never apply rewards back into simulation.

**Acceptance tests:** invalid cross-references and incompatible kinds reject with useful paths; content mutation cannot change a run; unknown fields and unsupported versions reject; every runtime ID refers to valid content; fixture content is visibly named as a headless slice and does not masquerade as Level 1.

**Checkpoint:** contracts are usable by tests with no UI, asset references or filesystem access.

## 7. Milestone 2 — entity lifecycle, movement and Product outcomes

**Dependencies:** M1. **Ownership:** entities, movement, outcomes, initial spawn scheduling, snapshot invariants.

### Implementation

1. Create/remove entities through one owner. Persist the allocator and ensure removal cannot trigger a second payout or leak.
2. Materialize due spawns using deterministic wave-local offsets and a saved schedule cursor. A spawn at offset zero enters on the first active update.
3. Store route distance, advancing by authored speed divided by 60. Reuse compiled route sampling; clamp overshoot and traverse multiple short segments in one tick correctly.
4. Produce endpoint candidates, then settle each entity once in explicit order. Remove terminal entities after settlement without skipping neighbors during iteration.
5. A Problem endpoint applies severity damage and grants no resolution reward. Unfinished Work adds one debt, with no Compute, healing, Product Progress, direct Product damage or immediate Bug spawn.
6. Add the productive-completion and Problem-resolution outcome functions, initially tested directly and connected to tower actions in M3. Completion heals only to maximum, still pays at full health, and adds exactly one Product Progress point.
7. Expose derived positions and counts through read-only queries. Save route distance, not an independent second authoritative position that can drift.
8. Validate restored allocator values, entity uniqueness, bounds, routes, schedule cursors and legal active/terminal combinations.

**Acceptance tests:** multiple simultaneous spawns; variable route segment lengths; exact endpoint/overshoot; multiple leaks in one tick; fatal leak; missed-work debt once; no ID reuse; pause freezes movement/schedules; mid-route restore continues identically.

**Checkpoint:** a headless wave reaches the Product and applies the correct Work/Problem consequences without towers. This is the first useful implementation handoff.

## 8. Milestone 3 — tower placement, local targeting and actions

**Dependencies:** M2. **Ownership:** geometry extensions, towers, visibility, targeting, actions and outcome integration.

### 3A. Placement and command validity

- Replace marker-like placement with a real tower command, definition reference, position and facing. Validate footprint containment, authored exclusions, overlap and affordability before any mutation.
- Spend Compute and allocate the tower only after all checks pass. Failed placement must not consume money, IDs, command sequence or events.
- Support `set_mode` and `set_priority` during preparation/active play, but reject all tactical commands while paused. Unknown/removed tower IDs reject.
- Use the same pure eligibility query for previews and dispatch; dispatch revalidates against current state. A preview is not a reservation.

### 3B. Visibility and target selection

- Visibility is the conjunction of nominal range, Area/Cone shape and unobstructed segment from the logical target origin. Use map blocker data, not art anchors or meshes.
- Keep initial Base Copilot fixture coverage Area-based; test Cone geometry independently so shared schema support is real.
- Build selects only productive Work; Defend only Problems; Auto selects visible Problems first, otherwise Work. Neither searches outside local coverage.
- Preserve valid Auto targets during commitment, but release immediately on completion, resolution, range exit or occlusion. After commitment expires, switch when a newly eligible target outranks the current one.
- Mode/priority commands take effect at the next action evaluation. Proposed policy: explicit player configuration clears the old commitment; confirm and test this policy rather than accidentally inheriting stale targets.

### 3C. Actions and settlement

- Advance cooldowns only in simulation time. Store absolute readiness ticks or an equivalent serialized integer counter, using one convention consistently.
- Evaluate towers in creation order against a coherent pre-action state. Collect contributions, then aggregate them per target before settling outcomes. Multiple towers can contribute to one Work item without duplicate completion rewards.
- Proposed policy: if multiple towers selected the same target, all committed pulses consume their cooldown; excess contribution is discarded, with no same-tick retarget. Test this explicitly.
- Emit action and terminal events in a documented order. Clear references to removed targets before publishing the final snapshot. Acquisition and resolution cannot depend on event listeners.

**Acceptance tests:** placement tangency/overlap/insufficient funds; Area and Cone boundaries/facing; blocker tangency and immediate sight loss; every mode/category pairing; equidistant tie; Problem arrival during Auto commitment; pause rejection; cadence at exact ticks; two towers finishing one target; completion healing cap; complete-versus-endpoint precedence; no negative remaining work/durability or duplicate rewards.

**Checkpoint:** a script places a Base Copilot and demonstrates both work completion and Problem resolution on the same route, using all three modes.

## 9. Milestone 4 — authored waves, economy and encounter lifecycle

**Dependencies:** M3. **Ownership:** waves, lifecycle, queries, checkpoint and full snapshots.

### Implementation

- Complete the normal-wave state machine: `preparation → active → preparation` for subsequent waves, or `encounter_succeeded`; any fatal Product outcome transitions to `failed`. Pause is an active-state flag, not a separate tactical planning state.
- The player manually starts every wave. A wave ends only after its schedule is exhausted and all active Work/Problems have received their terminal outcome. An empty interval before a later spawn is not completion.
- Preserve Product health, Compute, debt, Product Progress and towers across waves. Never grant unapproved wave income or refill health. Clear invalid target references while preserving other meaningful cooldown/configuration state.
- Keep a monotonic run tick and a separate wave-local tick. Tick zero and wave-transition behavior must not depend on the number of frame callbacks during preparation.
- Provide immutable next-wave previews using the same compiled schedule the simulation executes.
- Return a serializable terminal result and actual run totals: completed/missed Work, resolved/leaked Problems, earned/spent Compute, actual healing and damage, debt and Product Progress. No campaign side effects.
- Implement a pure gameplay checkpoint envelope with explicit format, schema/rules/content versions, and a full snapshot. Permit it only at supported between-wave preparation boundaries in this tranche. Terminal result storage and browser adapter integration are separate work.
- Restore by fully validating a candidate before construction, without replaying events, outcomes or start commands. Unknown versions fail explicitly; no automatic foundation-save migration.
- Full restart constructs a new encounter from initial content and caller-supplied new run ID; it does not load an incomplete wave checkpoint or mutate campaign data. Wave retry remains deferred.

**Acceptance tests:** manual start each wave; no early clear between spawns; mixed entities must drain; resource persistence; final clear once; failure takes precedence over success; terminal ticks/commands do not continue play; preview equals actual spawns; between-wave JSON round trip; paused-active checkpoint rejection; changed logical content rejection; restart resets only attempt-local state.

**Checkpoint:** a deterministic multi-wave headless fixture can succeed or fail and resume at preparation with identical subsequent behavior. This remains normal-wave encounter completion, not the Production Incident victory rule.

## 10. Milestone 5 — replay, restore and regression hardening

**Dependencies:** recording conventions begin in M1; completion follows M4. Tests accompany every earlier milestone rather than waiting until this stage.

### Replay contract

- Record validated accepted commands with run tick, accepted-command sequence and normalized payload. Multiple commands can occur at the same tick—including pause and resume—so tick alone is not an ordering key.
- The header pins replay format, rules version, logical-content signature and initial state identity. Rejected command attempts may be a separate diagnostic trace but never become deferred gameplay input.
- Playback advances exactly to the recorded tick, dispatches same-tick commands in order, and compares acceptance/events. Report an impossible advance while paused or after terminal state as an invalid replay; never hang attempting it.
- Keep the log outside the simulation snapshot to avoid unbounded snapshot growth. Restore needs full state, not the entire event history. Checkpoints taken inside a same-tick command group must retain the last consumed command sequence, so continuation neither skips nor duplicates input.
- Compare canonical snapshots and event streams at selected checkpoints and report the first divergent tick/field. A digest may accelerate diagnostics later; a hash alone is not proof of correctness.

### Randomness

Do not introduce randomness into authored fixture waves just to exercise an RNG. If a concrete randomized mechanic is approved, add an explicit algorithm/version, supplied seed and serialized generator state in the same change. Cover known-answer sequences, state restoration and deterministic draw ordering before that mechanic ships. Until then, deterministic authored schedules require no RNG subsystem.

### Regression and measurement suite

- Repeated runs with identical content/initial state/commands have equal snapshots and ordered events.
- Restore immediately before/after spawn, action readiness, completion, leak and wave transition; compare the entire remaining event suffix, not only final health.
- Exercise same-tick command sequences, malformed snapshots, stale target IDs, invalid readiness ticks, duplicated entities, impossible schedule cursors and counter overflow bounds.
- Assert invariants after every step in generated bounded command sequences: Product bounds, nonnegative economy/debt, unique IDs, valid references and no repeated terminal outcomes. Start with reproducible table-driven generators using existing test tools.
- Feed the fixed-step clock different supported frame partitions and 1x/2x speed schedules. Compare gameplay state at equal simulation ticks; scheduler/control metadata may legitimately differ unless the command trace is identical. Pause produces no gameplay progress.
- Add reproducible headless benchmarks at the architecture's 100-moving-entity target, with explicitly reported tower/blocker counts, dense overlapping coverage and long multi-wave runs. Separate tick, capture and replay costs; check bounded retained state/log ownership.
- Record machine/runtime and measurements before setting timing budgets. Do not claim a Node benchmark proves phone FPS, browser memory use, or cross-engine numeric equivalence.

**Acceptance:** all earlier tests and boundary/type checks pass; replay and restore agree on states and events; unsupported formats reject clearly; benchmark output is reproducible and has no placeholder performance claim.

## 11. Exact active-tick pipeline

Proposed initial pipeline, to freeze in M0 tests:

1. Reject advancement unless active and unpaused; advance the run tick and process the current wave offset using the documented offset-zero convention.
2. Spawn due entities in authored order.
3. Derive logical positions/visibility and validate commitments at pre-movement positions.
4. Select targets and collect ready tower contributions in tower creation order.
5. Aggregate contributions and settle completions/resolutions, including Compute, actual capped healing and Product Progress.
6. Move surviving entities; identify endpoints in entity creation order.
7. Settle leaks/missed work; latch fatal failure. On fatal failure, stop further gameplay settlement and retain a terminal snapshot for diagnostics; no later reward or victory can occur.
8. Clear removed target references and evaluate schedule/entity exhaustion if not failed.
9. Publish the ordered event batch and expose a detached snapshot on request.

Dispatch is synchronous between ticks. Accepted commands may change control/configuration state immediately; attacks remain tick-driven. Explicit stages avoid mutation-during-iteration bugs and make boundary behavior reproducible. Later aura/ambiguity systems must receive an explicit position in this pipeline with updated versioned rules/tests.

## 12. Delivery order and verification gates

Use reviewable changes, each leaving the existing console operational:

| Change | Scope | Demonstrable result |
| --- | --- | --- |
| 1 | M0 + M1 | Strict encounter contract, pure API and fixture validation. |
| 2 | M2 | Spawn → movement → correct Product/debt outcomes. |
| 3 | M3A/B | Atomic placement, visibility and deterministic local selection. |
| 4 | M3C | Work/problem actions and exactly-once settlement. |
| 5 | M4 lifecycle | Manual multi-wave success/failure with persistent level-local state. |
| 6 | M4 checkpoint | Complete headless checkpoint/restore and clean restart. |
| 7 | M5 | Replay diagnostics, restore matrix and measured workload. |

Run `npm run lint`, `npm run check:boundaries`, `npm run typecheck` and `npm run test` during each change. Before handoff run `npm run verify`, which also checks the production build and existing browser console. Browser tests protect the unchanged probe; they do not certify the new headless gameplay. New gameplay assertions belong in Node-based unit/integration tests.

Update [Foundation Implementation](Foundation_Implementation.md) with actual delivered scope and commands as milestones land. Do not replace the original probe checks until their behavior is deliberately retired. No dependency upgrades or new runtime libraries are needed to begin this plan.

## 13. Follow-on pure TypeScript milestones, not prerequisites

Once the five core milestones pass, extend the same engine in this order:

1. **Personas and simple upgrades:** permanent Base → Developer/Tester branches; affordability/unlock checks; explicit authored upgrade effects. Implement Tester's non-stacking strongest slow and completion bonus, leaving normal active actions intact. First decide aura occlusion, boundary sampling, bonus rounding and upgrade cooldown behavior; those details are not settled by the existing design.
2. **Ambiguous Requirement:** choose affected-task selection and reversible work-burden semantics. Define how already-earned progress behaves when the source disappears; no accidental instant/duplicate completion. Do not guess these from the art or create immediate missed-task Bugs.
3. **Debt Sprint:** introduce cleanup as a distinct runtime entity/outcome, one per incoming debt, with no productive rewards or extra debt on expiry. Author cleanup position/movement and duration; handle zero debt, full cleanup and timeout. Preserve exact post-sprint save state.
4. **Production Incident:** implement baseline spawns, exactly one extra Bug per locked unresolved debt, and the remaining-extra final burst on early boss defeat. Stop baseline spawning on defeat; win only after boss defeat, exhausted extra budget and remaining Problems handled with Product alive. Resolve boss movement/leak behavior and generated-Bug rewards before implementation.
5. **Pure campaign reducer:** accept successful level results exactly once by run identity, preserve prior unlocks on failure and add committed Product growth/Analyst unlock. Add `progression/**` to the core compiler include before introducing code there. A pure reducer's deduplication does not replace the later atomic storage transaction.

Full Level 1 authoring follows these implemented behaviors and explicit balance decisions. Wave retry, selling/refunds and recovery bonuses require their own approved semantics. Future AI layers remain absent.

## 14. Recommended first implementation request

Implement changes 1 and 2 only: validated dual-flow encounter contracts, stable entities, authored spawning, route movement, Product damage and missed-work debt, with headless tests and snapshot restoration. Preserve the existing console and save format. Use clearly labeled fixture values, and stop at a tested wave reaching the Product before adding towers.

That is a concrete, independently verifiable next step toward the full pure TypeScript loop.

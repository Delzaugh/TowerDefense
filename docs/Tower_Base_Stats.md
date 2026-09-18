# Tower and Copilot core properties and stats

[Master GDD](design/00_Master_GDD.md#tower-taxonomy) · [Core rules](design/Core_Gameplay_Systems.md#tower-targeting-line-of-sight-and-work-modes) · [Copilot family](design/Copilot_Agent_Design.md)

This document owns the shared Tower stat overview and the separate passive/special ability specifications. It also separates the generic Tower contract from Copilot-family rules and records what the current TypeScript slice actually implements. The playtest design below is distinct from the engineering defaults documented later; neither is final game balance.

## Tower overview and playtest stats

**Status: Accepted initial playtest design baseline for all seven Towers — 2026-09-17; gameplay alignment pending.** Values remain tunable after playtests; they are not final production balance.

Document shared Tower stats in a comparison table. Reference passive and special abilities by name only in that table; define their effects, numerical stats, coverage and interaction rules in separate ability sections. Future abilities must not introduce a new shared Tower-table row for every ability-specific effect. A Tower with multiple abilities can list their names together.

These values describe initial Persona specialization before later upgrades or external modifiers. Developer, Tester, Analyst, Security, Architect and Linter Agent are permanent upgrades from a placed Base Copilot, not independently purchased placements. Base has no separate long-term generalist upgrade path. Availability remains separate from design acceptance: Level 1 uses Base, Developer and Tester; Analyst unlocks after Level 1, Security later, and Architect/Linter unlock milestones remain undefined. Human Towers remain outside this roster.

| Property / stat | Base Copilot | Developer | Tester |
| --- | --- | --- | --- |
| Short description | Affordable starting Tower, used to upgrade into a Persona | Direct-output specialist with faster actions and higher damage | Base direct output plus support within its coverage |
| Direct Action | Completes Work and damages Enemies | Completes Work faster; attacks faster with higher damage per action | Same Work output, damage and action speed as Base |
| Passive Ability | None | None | [QA Aura](#qa-aura) |
| Special | None | None | None |
| Initial Base placement cost | 30 Compute | 30 Compute | 30 Compute |
| Persona upgrade cost | — | 20 Compute | 20 Compute |
| Total investment | 30 Compute | 50 Compute | 50 Compute |
| Footprint radius | 0.4 map units | 0.4 map units | 0.4 map units |
| Action range | 5 map units | 5 map units | 5 map units |
| Action interval | 0.5 sec / 30 ticks | 0.4 sec / 24 ticks | 0.5 sec / 30 ticks |
| Action speed | 2 actions/sec | 2.5 actions/sec | 2 actions/sec |
| Damage per action | 5 | 7 | 5 |
| Work per action | 5 | 5 | 5 |
| Ideal damage/sec | 10 | 17.5 | 10 |
| Ideal Work/sec | 10 | 12.5 | 10 |
| Auto target commitment | 0.5 sec / 30 ticks | 0.5 sec / 30 ticks | 0.5 sec / 30 ticks |
| Additional per-type placement limit | None | None | None |

All three remain subject to the map's overall Tower limit. Action coverage uses the Tower's coverage shape, facing and obstacle blockage. The simulation runs at 60 ticks per second. Damage and Work rates are alternative ideal outputs with continuous eligible targets: each Tower performs one action at a time. Commitment is an Auto-mode target-selection rule, not extra action delay.

Developer has 25% faster actions and 40% higher damage per action than Base, yielding 75% higher ideal damage throughput and 25% higher ideal Work throughput. Tester preserves Base direct output and adds QA Aura. Matching Persona prices, range and footprint makes the direct-output versus support choice easier to compare during playtests. Later upgrade values remain open.

**Implementation boundary:** Base already uses these core engineering values. The playable Persona transition and Developer tuning remain unimplemented. The current Tester diagnostic probe still uses 3 damage and 3 Work per action, and +2 bonus Compute; this design targets 5 damage, 5 Work and the QA Aura values below. Diagnostic upgrade/effect fixtures are not production upgrade balance.

### Additional Towers

**Status: Accepted initial playtest design baseline; not implemented.** These four Personas extend the roster with support, specialist defense, bombardment and radial attacks.

| Property / stat | Analyst | Security | Architect | Linter Agent |
| --- | --- | --- | --- | --- |
| Short description | Passive Developer support and Work opportunities | Hidden-threat detection and security specialization | Long-range bombardment against groups | Short-range radial defense |
| Direct Action | None | Single-target Work or damage | Select an Enemy; explosion centered on that target | Radial projectile volley; no individual target |
| Passive Ability | Opportunity Discovery; Clear Briefing | Threat Scan | None | None |
| Special | None | Threat Response | Structural Impact | Rule Burst |
| Initial Base placement cost | 30 Compute | 30 Compute | 30 Compute | 30 Compute |
| Persona upgrade cost | 30 Compute | 20 Compute | 30 Compute | 20 Compute |
| Total investment | 60 Compute | 50 Compute | 60 Compute | 50 Compute |
| Footprint radius | 0.4 map units | 0.4 map units | 0.4 map units | 0.4 map units |
| Action / support range | 8 units; always 360° Area | 6 units | 8 units | 3 units |
| Action interval | — | 0.5 sec / 30 ticks | 1.2 sec / 72 ticks | 0.5 sec / 30 ticks |
| Action speed | — | 2 actions/sec | Approximately 0.83 actions/sec | 2 volleys/sec |
| Damage per action | — | 5 | 16 per affected Enemy | 2 per projectile hit |
| Work per action | — | 3 | None | None |
| Ideal damage/sec | — | 10 normally; 20 against security Enemies | Approximately 13.33 per affected Enemy | 4 per connecting projectile direction |
| Ideal Work/sec | — | 6 | — | — |
| Auto target commitment | —; no direct action | 0.5 sec / 30 ticks | **0.5 sec / 30 ticks; Enemies only** | —; radial volley, no individual target |
| Additional per-type placement limit | None | None | None | None |

Architect's Enemy-only eligibility does not remove target commitment. It holds a valid selected Enemy for the commitment window, after which normal priority rules may select another Enemy before the next shot. Its 0.5-second commitment is independent of its 1.2-second action interval; neither promises an immediate shot nor implies a new cluster-selection algorithm. Work is never an eligible Architect target. Invalid targets may be released before commitment expires under the shared targeting rules.

All four remain subject to the overall map Tower limit. Linter's theoretical aggregate damage is 32/sec only if all eight projectiles connect every volley; actual output depends on placement and targets. Ability values are separated below from these shared stats.

## Passives and specials

Each named ability owns its own stats and effects. Document its owner, activation or trigger, affected targets, coverage, effect values, duration, overlap rules and enhancement support here. Only applicable fields are needed; future special abilities can define their own behavior without expanding the shared Tower stat table.

### QA Aura

**Status: Initial playtest design baseline.** Owned by Tester; passive and continuously active while the Tower is present.

| Ability property / stat | Value / effect |
| --- | --- |
| Enemy slow | 10% slower movement; affected Enemy speed is multiplied by 0.90 |
| Slow targets | Enemies / moving Problems only; not productive Work or Technical Debt cleanup items |
| Bonus Compute | +1 Compute per productive Work item fully completed within effective coverage |
| Completion credit | Bonus applies regardless of which Tower finishes the Work |
| Coverage | Shares the Tower's resolved action range, coverage shape, facing and obstacle blockage; initially 5 map units of range |
| Slow duration | Applies only while the Enemy is inside effective coverage; no lingering slow after leaving |
| Reward timing | Evaluate coverage at productive Work completion; no bonus before completion |
| Main-action dependency | None; remains active in Auto, Build and Defend, including while idle or on cooldown |
| Overlap | Strongest effective slow and strongest effective Compute bonus apply separately; QA Auras do not stack |
| Other rewards | Does not alter Product healing, Product Progress, task completion requirements or Technical Debt cleanup rewards |
| Enhancement support | Eligible upgrades and external effects may improve slow strength or bonus Compute; Tower range modifiers also change aura coverage |

The strongest slow and strongest Compute bonus may come from different Testers. Numerical modifiers do not implicitly change the overlap rule. QA Aura has no separate radius stat. Later enhancement prices, values and external sources remain open; implemented modifier and duration rules are documented in [Tower Foundation Implementation](Tower_Foundation_Implementation.md#modifiers-and-explicit-upgrades).

### Additional abilities

**Status: Accepted initial playtest design baseline; not implemented.** Ability-specific stats live here rather than becoming fields on every Tower.

| Ability | Owner | Effects / values |
| --- | --- | --- |
| Opportunity Discovery | Analyst | Each Unclear Requirements Enemy killed within effective coverage generates one ordinary productive Work item at the Work route entrance, regardless of which Tower delivers the kill. Overlapping Analysts still generate only one item per kill. |
| Clear Briefing | Analyst | Developer Personas within effective coverage gain 20% action speed for both damage and Work. Overlaps use the strongest applicable bonus, without stacking. |
| Threat Scan | Security | Reveals hidden Enemies while they remain within effective coverage. Other Towers still need their own valid range and visibility to attack. |
| Threat Response | Security | +100% damage against explicitly designated security Enemies: 5 becomes 10 damage per action. |
| Structural Impact | Architect | Explosion radius 1.5 units around impact, dealing 16 damage to each eligible Enemy, with no initial damage falloff. Blockage is checked from the impact point. |
| Rule Burst | Linter Agent | Eight straight projectiles evenly spaced at 45° per volley. Each deals 2 damage, hits one Enemy and travels up to the Tower's range. No homing; obstacles stop projectiles. Fires when an eligible Enemy is within effective range. |

Passive coverage uses the owner's resolved range and obstacle blockage, independently of any main action. Analyst always uses a large 360° Area with no direct action, Work contribution or individual target. Both of its passives share that coverage. Clear Briefing affects the Copilot Developer Persona; no interaction with the future Human Senior Developer is implied. Its 20% action-speed boost divides the Developer's action interval by 1.20: the baseline changes from 24 to 20 ticks, or from 2.5 to 3 actions/sec. Damage and Work per action stay unchanged.

Generated Work grants rewards only when completed and follows normal missed-Work consequences, including Technical Debt. It can receive the Tester's ordinary QA completion bonus when completed inside QA coverage. Opportunity Discovery checks the Enemy's position at death and produces one Work item per qualifying kill, even when several Analysts cover it. It does not directly reduce ambiguity burdens or erase debt. Unclear Requirements refers to the Enemy concept currently documented as Ambiguous Requirement; a content rename is not implemented by this table.

Architect and Linter perform no productive Work or Technical Debt cleanup. Architect has no separate debt bonus. Linter's projectiles may miss, never home, and disappear after their first Enemy hit or reaching their range limit; obstacle collisions also stop them. Future upgrades and external effects may enhance applicable numerical stats, with each ability retaining its explicit overlap policy.

### Implementation follow-ups

The accepted definitions are design targets, not newly implemented content. The current foundation supports targeted/passive definitions, QA Aura, numerical modifiers and authored ability grants. It does not yet implement the playable Persona transition, Analyst kill-triggered Work generation or a Developer buff aura, hidden-Enemy detection and security-class damage, Architect explosions, or Linter projectile volleys. Projectile travel speed, impact timing, generated Work template selection and later unlock milestones still need implementation/content specifications; this document does not invent them. Save/restore, repeat attempts, rewards and encounter completion must account for generated Work and in-flight attacks when those behaviors are implemented. See [architecture follow-ups](design/Technical_Architecture.md#accepted-roster-implementation-follow-ups).

## Terminology and ownership

- A **property** describes identity, capability, configuration, geometry, content references, or mutable state. Properties are not necessarily numerical or tunable.
- A **stat** is a numerical gameplay parameter used by a rule or behavior, such as cost, range, output, or cooldown.
- A **Tower definition** is immutable authored content shared by every instance of that Tower type.
- A **Tower instance** is one placed Tower's mutable run state.
- A **Copilot** is one Tower family. Copilots inherit the generic Tower contract and add Copilot-specific identity, Persona progression, and later agent-capability layers.

Do not copy a shared Tower value into a separate Copilot field. A Copilot uses the applicable Tower definition and resolved Tower stats; its Persona, upgrades, and later agent layers modify or extend that baseline through explicit rules.

## Layer boundaries

| Layer | Owns | Examples |
| --- | --- | --- |
| Tower definition | Shared placement, capability, targeting/action, and stat defaults for one Tower type | Definition ID, family/behavior kind, interaction capabilities, cost, footprint, coverage, supported controls, base stats |
| Tower instance | Mutable state for one placed Tower | Instance ID, definition reference, position, facing, selected configuration, target, action readiness, commitment, modifiers |
| Copilot family | Rules common to Copilot Towers only | Base Copilot identity, Work/Problem generalism, Persona eligibility, agent progression layers |
| Persona / upgrade / effect | Explicit changes applied to an eligible Tower | Developer throughput, Tester aura, purchased upgrades, later Model or status modifiers |
| Presentation | Visual binding without gameplay authority | Runtime asset/version, anchors, clips, state-to-animation mapping |

## Core Tower properties

Every Tower type must eventually answer the following questions. “Core” means the shared contract can represent the property; it does not mean every Tower must support every optional interaction.

| Property group | Required design answer | Current TypeScript slice |
| --- | --- | --- |
| Identity | What is the definition ID, Tower family, and behavior kind? | `id` and `label` identify the type; `family` is Copilot/Human independently of targeted/passive behavior `kind`. |
| Placement | What does placement cost, what space is occupied, where may it be placed, and does its type have a placement limit? | Compute cost and circular `footprintRadius` are implemented with map-edge, authored-path, obstacle, overlap, budget, and total map Tower-limit validation. Optional per-type `placementLimit` is enforced atomically, including on restore. |
| Interaction capabilities | Can it complete Work, resolve Problems, perform both, support other Towers, or use another behavior? | Targeted definitions explicitly declare Work/Problem capabilities. Effective output must also be positive. Passive-only definitions have no action stats. |
| Action model | Does it acquire a target and act on a cooldown, apply an aura, trigger an ability, or use another declared behavior? | Targeted cooldown actions and independent passive QA Aura are implemented. Projectile, splash, and additional behaviors remain future extensions. |
| Coverage and visibility | Does its effect require range, Area/Cone coverage, facing, and unobstructed line of sight? | Range, Area/Cone, facing, blockers, and target visibility are implemented for target-capable Towers. |
| Player configuration | Which modes, priorities, rotation, upgrades, or other controls may the player change, and in which phases? | Definitions declare supported modes/priorities, rotation, alternative coverage and diagnostic tuning. Commands and UI enforce the same permissions. |
| Progression and modification | Which upgrades or family systems may modify it, and how are modifiers ordered and bounded? | Owned upgrades, explicit ability grants, numerical modifiers, and timed source-tracked external effects are implemented. The playable Persona tree and final upgrade tuning remain TODO. |
| Presentation binding | Which registered runtime asset and visual contract represent this gameplay definition? | Runtime GLB integration is not yet connected to gameplay definitions. Art manifests remain presentation data, not gameplay behavior. |

## Core Tower stats: implemented baseline action model

Human Towers are a future use case for this generic contract. Senior Developer has a powerful, expensive, one-per-map concept, but no approved numerical stats or behavior specification yet. It does not inherit Copilot Persona progression. People Manager is a non-placeable supporting character and does not need a Tower definition. See [content classification](design/Content_Design.md#human-towers-and-supporting-characters) and the [architecture extension boundary](design/Technical_Architecture.md#tower-family-extension-boundary).

Placement/range and applicable targeted-action stats live in validated `baseStats`. QA Aura owns its separate slow/bonus stats and reuses Tower range. Shared stats are independent of family.

| Stat | Base Copilot engineering default | Meaning / supported bounds |
| --- | --- | --- |
| `cost` | 30 | Compute charged once at placement; integer 0–1,000,000 |
| `footprintRadius` | 0.4 | Circular occupied radius in logical map units, not targeting range; >0–10 |
| `range` | 5 | Target/effect coverage radius in logical map units; >0–100 |
| `cooldownTicks` | 30 (500 ms) | Shared interval between damage/work actions; integer 1–3,600 ticks |
| `damagePerAction` | 5 | Problem durability removed per action; integer 0–1,000,000 |
| `workPerAction` | 5 | Work units completed per action, not a percentage; integer 0–1,000,000 |
| `commitmentTicks` | 30 (500 ms) | Auto-mode target commitment while eligible; integer 0–3,600 ticks |

The simulation runs at 60 Hz. Lower cooldown means faster actions. Derived ideal rates are `60 / cooldownTicks` actions/s and that rate multiplied by damage/work per action. Actual throughput depends on available targets, coverage, occlusion and overkill. A ready Tower acts immediately when an eligible target becomes available; this is a cooldown, not a wind-up. Auto mode acts on one category per action, not both at once. Zero output currently excludes that category from targeting. Invalid or out-of-range targets can be released before commitment expires; Build and Defend do not use Auto commitment.

These seven fields are required for `kind: targeted`. The `passive` variant requires only cost, footprintRadius and range; action fields are rejected. Additional behaviors should extend the discriminated contract using only applicable stats.

## Core Tower instance state

The saved instance contains shared identity/placement/coverage, diagnostic overrides, owned upgrade IDs, and active effect sources/lifetimes. Nullable `action` state owns mode, priority, target ID, readiness and commitment only when a targeted behavior is present. Future state must follow the same ownership rule: generic state belongs on the Tower instance; Copilot-only state such as Persona or Model Profile belongs in a Copilot-specific extension, not on every Tower by assumption.

## Core Copilot properties

Every Copilot is a Tower and inherits the applicable generic placement, coverage, targeting, and instance rules. The Copilot family additionally owns:

| Copilot property | Alpha rule |
| --- | --- |
| Family identity | The Tower is explicitly a Copilot; this is not inferred from its appearance or asset ID. |
| Base form | A newly placed Alpha Copilot begins as a neutral Base Copilot. |
| Interaction role | Base can contribute to productive Work, resolve Problems and perform Technical Debt cleanup. A Persona can narrow or replace these capabilities: Analyst is passive; Architect and Linter are combat-only. |
| Configuration | Base, Developer, Tester and Security use Work/Enemy modes and target priority. Analyst needs no direct-action controls; Architect selects Enemies with commitment; Linter has a radial action with no individual target. |
| Persona state | A placed Base Copilot can make one permanent Persona choice. Developer and Tester are available in Level 1. |
| Progression eligibility | Copilot upgrades and later Specialization, Model Profile, Skill, Tool/MCP, Instruction, Plugin, Hook, Sub-agent, and Context layers apply only when their designs explicitly permit them. |

## Core Copilot stats and modifiers

There is no second copied “Copilot stats” block. A Base Copilot starts from an authored set of Core Tower stats. Copilot-specific design defines relationships and modifiers on that baseline:

| Copilot layer | Stat ownership |
| --- | --- |
| Base Copilot | Authored Tower cost, footprint, range, cooldown, work output, Problem-resolution output, and commitment baseline. Current exact values are engineering fixtures. |
| Developer Persona | Specializing Base into Developer improves both action speed (shorter cooldown) and damage per action above Base and initial Tester. Faster actions also increase Work throughput. Developer has no passive ability. The initial values are recorded in the [playtest stat table](#tower-overview-and-playtest-stats); later upgrade increments remain open. |
| Tester Persona | Initial specialization preserves Base Work/damage output and cadence, adding QA Aura: Enemy slow (10% base) and bonus Compute. QA Aura reuses resolved Tower range and obstacle-blocked action coverage rather than owning a radius. Eligible upgrades and external effects may modify its ability stats. They are not fields required on every Tower. The existing 3-output QA probe is an earlier diagnostic fixture, pending alignment with this design. |
| Analyst / Security / Architect / Linter Agent | Accepted initial stats and abilities are recorded above; their behavior contracts and production implementation remain follow-ups. Only applicable action and ability stats belong on each definition. |
| Upgrades and later agent layers | Explicit deterministic modifiers applied only to eligible Copilots; exact definitions remain open. |

## Stat resolution

The intended production resolution path is:

`Tower definition base stats → eligible family/variant modifiers → upgrades → later capability/status effects → resolved instance stats`

For a Copilot, the family/variant stage includes its Persona modifiers. A different Tower family supplies only its own approved modifier layers.

The current implemented path is:

`Tower definition base stats → diagnostic overrides → owned upgrades → active external effects → resolved stats`

All production modifier stages must use one deterministic resolver, define stacking and bounds, and preserve exact save/restore outcomes. Cost and footprint are placement properties that remain fixed on a purchased Tower unless a future rule explicitly validates and records their change.

### Ability and effect modifiers

**Status: Implemented for QA Aura, numerical upgrades, explicit ability grants, and timed external modifiers; further behaviors remain Future**

A Tower can have multiple simultaneous behaviors, such as the Tester's targeted main action and passive QA Aura. An ability owns its applicable stats, coverage, affected-target rules, and effects; it need not share the main action's target, cadence, or coverage values. A passive ability does not need a selected main-action target to operate. Family identity and supported capabilities remain separate concerns.

Upgrades and external elements must be able to modify eligible ability stats as well as shared action stats. QA Aura is the first concrete example: its base Enemy slow is 10%, and it awards bonus Compute for productive Work completed within coverage. It uses the Tower's resolved action range, shape, facing, and obstacle blockage; it has no independent radius. Modifiers can enhance slow strength or bonus Compute, while a Tower range modifier changes both action and aura coverage. The initial bonus and coverage values are recorded in [QA Aura](#qa-aura); later tuning remains subject to playtests.

Use the common deterministic resolution approach for ability stats: authored baseline plus eligible modifiers produces effective values without overwriting the baseline. Each modifier must identify its source, affected ability/stat, operation, and applicability/lifetime. The implemented ordering, bounds, expiration semantics and explicit distinction between additive percentage points and multipliers are recorded in [Tower Foundation Implementation](Tower_Foundation_Implementation.md#modifiers-and-explicit-upgrades). Preserve the source state needed for exact save/restore, and show effective values to the player.

Modifying one ability and combining effects from multiple abilities are separate rules. Resolve each Tester's enhanced aura first; then use only the strongest applicable slow and strongest applicable bonus Compute across overlapping QA Auras. This does not define how unrelated future slow effects combine. Specific external enhancement sources and upgrade choices remain future design, not a requirement for placeholder systems now.

Effect definitions must declare their combination policy rather than rely on a universal stacking rule. The architecture must accommodate policies such as strongest-only, additive, or refresh-duration as concrete effects require them. QA Aura uses strongest-only separately for its slow and bonus Compute; no other effect's policy is decided by this example.

Numerical modifiers adjust existing stats, such as output, cooldown, range, and aura strength. Adding an ability or changing behavior is a separate, explicit upgrade operation with its own validation and saved state. Do not encode a new stun, action model, or capability as a numerical modifier or infer it from a stat crossing a threshold.

## Where to author and extend

- `game/src/content/schemas/towerStats.ts` owns reusable placement/range stats, the targeted-action extension, and narrower test overrides. `gameplayDefinitions.ts` owns the family/behavior union, capabilities and controls; `abilities.ts` owns ability and modifier contracts.
- `game/src/content/levels/headlessSlice.ts` contains the current authored Base and Cone probe definitions; `testMap.ts` opts Base and QA probes into tuning.
- `game/src/simulation/encounter/stats.ts` resolves defaults, diagnostic overrides, owned upgrades and active external modifiers. Targeting, action output/cadence, coverage, placement and snapshot invariants use this shared resolver.
- `coverage.ts` combines the resolved range with the selected Area/Cone shape. No duplicate radius lives in coverage profiles.

Copilot and Human definitions can use the implemented targeted/passive behaviors through content. New behaviors still require explicit contracts and execution code. Cost and footprint vary by type and remain fixed for that purchased Tower. Placement checks the whole footprint against map edges, the authored route width, obstacles and other Towers, charges the resolved cost exactly once, and rejects atomically. Path exclusion is a Tower rule, not a universal placeable rule, so a future item or ability can declare its own surface policy without adding a Tower bypass. SVG footprint, path width, hit area and placement-price guidance read the same logical properties. Current footprint geometry is circular; non-circular footprints require a geometry-contract extension.

Upgrades and external effects use deterministic modifier stages with explicit bounds and tick-based expiration. Cost discounts need a purchase-time price record before they can vary during a run; footprint-changing upgrades need atomic occupancy validation. Neither is simulated as a post-purchase stat override. Actual new tower behaviors, projectiles, splash, critical hits and new effect behaviors are still separate future features.

## Test app

1. Place/select a tower, then expand **Base stats & tuning** in its inspector. Cost and footprint are shown as type-defined placement properties.
2. Edit range, action interval in milliseconds, damage/work per action and target commitment in milliseconds. Base references stay visible. Drafts do not affect the live simulation or map until **Apply stats**.
3. Timing rounds to the nearest 60 Hz tick, with the effective draft timing displayed. For example, 125 ms becomes 8 ticks / 133.333 ms. An action interval rounding to zero is invalid, unlike a wave queue burst. Negative, empty, non-finite or out-of-bounds values cannot apply.
4. Applied rates and the map coverage reflect the selected tower only. New placements retain authored defaults. **Reset stats** clears all performance overrides and drafts.

Tuning requires explicit definition opt-in and unpaused preparation. No live/paused-wave performance editing is allowed. Cost and footprint are authored in content, not editable on placed towers; changing them does not require altering placement algorithms. There is no New Tower Defaults section or full tower-type authoring UI.

Core command: `set_stats` with `towerId` and a strict partial `overrides` object. It replaces the entire override set, not a patch; `{}` resets to type defaults. Cost/footprint keys are rejected. Overrides survive captures, custom-queue application, local saves and starting-defense reconstruction. Save/restore verifies both property bounds and definition permissions before replacing state.

## Compatibility and validation

Encounter content/snapshot/rules are version 6, content revision `v06`, and test-lab save envelope version 5. Current databases are `tower-test-map-standard-v6` and `tower-test-map-fragile-v6`. Earlier v1–v5 and foundation saves remain untouched, but are not automatically migrated or loadable. Wave recipe JSON remains version 1 with integer ticks.

`npm run verify` covers 244 unit/integration tests and 40 desktop/touch-emulated browser cases, plus types, lint, module boundaries and production build. Stat regressions cover bounds, detached defaults, atomic invalid commands, specialists, actual action cadence/output, permissions, variable costs/footprints, path/obstacle geometry, snapshots, recipes, repeat attempts, browser drafts/reset, timing rounding, per-tower isolation, saves and phase locks. Physical-device performance and production balance are not claimed.

The [foundation implementation](Tower_Foundation_Implementation.md) details accepted-command replay validation, effect-aware movement/rewards, upgrade-preserving blueprints, engineering fixture values, and remaining limits.



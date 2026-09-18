# Core Gameplay Systems

[Master GDD](00_Master_GDD.md) · [Agents](Copilot_Agent_Design.md) · [Content](Content_Design.md) · [Level 1](levels/Level_01_Just_One_Small_Feature.md)

Owns shared simulation rules and lifecycle. Content-specific boss behavior belongs to Content Design; level scripts and tuning belong to Level 1.

Statuses follow the [Master GDD](00_Master_GDD.md#commitment-statuses). A more specific status overrides its enclosing section. Unspecified values remain open; restructuring does not approve new mechanics or tuning.

## Play rhythm and interaction principles

**Status: Locked — interaction principles; pacing estimates are Hypothesis**

- Design around manageable active-play segments, untimed planning, and reliable save opportunities rather than fixed stopwatch targets. A typical active wave may run about 3–6 minutes; a full level may take up to roughly 30 minutes including planning, the Technical Debt Sprint, boss preparation, and the boss. These are general pace guidelines, not hard rules.

- Planning and reconfiguration primarily happen between waves, where time is untimed and the player starts each wave manually when ready.

- Early active-wave interaction stays focused on core orchestration: tower placement and upgrades, Build/Defend/Auto changes, and target-priority changes. Active waves otherwise play out in real time.

- Pause is a hard freeze for real-life interruptions. No gameplay action is allowed while paused: no building, upgrading, retargeting, mode switching, priority changes, or other tactical edits.

- Soft counters over hard lockouts. Most agents remain broadly useful; specialist mechanics add flavor and mastery.

- Readable strategy over guessing. Upcoming waves and route topology should normally be visible.

- Progression introduces systems gradually. Do not require a mechanic before the player has the tool needed to answer it.

- Teach only mechanics that create a distinct player decision. Enemy variety is secondary to teaching clarity, especially in Level 1.

- Major unlocks should answer a problem the player has just survived, making progression feel narratively earned.

- The SDLC should influence mechanics, not merely provide visual theming.

## Wave lifecycle

**Status: Prototype**

- MVP levels use authored waves, stored as data rather than hard-coded gameplay logic.

- Wave compositions are deliberately paced to teach mechanics and tell a small story.

- Light randomness may vary counts or timing, but should not undermine planning.

- The next wave should be previewed so specialization and targeting decisions feel informed.

- A baseline target is about 8 authored rounds per level, including a pre-boss Technical Debt Sprint and the final boss encounter. Normal waves → Technical Debt Sprint → boss prep → boss → post-level Product growth is the prototype sequence.

Normal waves use untimed preparation, a next-wave preview, manual start, and active real-time play. The Technical Debt Sprint and boss preparation follow the transitions below. Wave-count and duration estimates are **Hypothesis**, not fixed requirements. Light count/timing randomness is optional and must preserve planning.

## What the Player Protects: The Product

**Status: Prototype**

The protected objective is simply the Product. This is friendlier and broader than “production stability” and remains coherent across the entire SDLC.

- Completed work restores Product health up to a fixed maximum. It does not increase maximum health during the level.

- Healing beyond the fixed maximum is discarded; completing work at full health still awards Compute and Product Progress.

- Problems that reach the Product deal damage according to severity.

- Different threats have different impact values; a small bug should not damage the Product as much as a severe security incident or major production failure.

- If Product health reaches zero, the Product is destroyed and the level fails.

- Permanent account/campaign unlocks are never lost on failure.

### Product Progress and visible growth

- Track fully completed work during waves as Product Progress. For the prototype, each completed work item contributes one point; partial or unfinished work contributes none.

- After successfully completing a level, show the completed-work total and visibly evolve the Product based on that contribution: a feature appears, a module lights up, or the application gains another visible component.

- Across completed levels, these contributions accumulate into a visibly larger, more developed Product. The first prototype needs only a completion summary and a simple post-level growth reveal.

- Product Progress is initially mostly visual/narrative. It is not a spendable currency, does not increase maximum health or other combat stats, and is not an additional victory requirement.

### Level completion

- Prototype victory requires defeating the Production Incident and clearing any remaining active problems, including its Technical Debt Bugs, while Product health remains above zero. Problems that leak apply their normal damage and leave play. After all scheduled Technical Debt Bugs have entered play, the defeated boss generates no further problems; unresolved debt itself is not a separate victory blocker after its Technical Debt Bugs have been handled.

## Dual Flow: Work and Problems

**Status: Prototype; additional debt sources and task-slowing skills are Future**

The central gameplay differentiator is that productive work and harmful problems can move along the same SDLC path. Player-placed Towers decide what to work on or resolve in real time. Copilots are the Alpha's first Tower family, not the name for the entire Tower category.

### Productive work

- Coding tasks and other work items move continuously along the path.

- They have a completion/progress meter. Agents reduce the remaining work while the task continues moving.

- Multiple agents may work on the same task at once, accelerating completion and rewarding overlapping coverage.

- A work item only pays out when fully completed; partial progress alone provides no reward.

- Completing work awards Compute, restores Product health up to its fixed maximum, and adds Product Progress for post-level visual growth.

- If a coding task or other productive work item reaches the end unfinished, it awards no Compute, no Product healing, and no Product Progress, and adds +1 Technical Debt in the prototype. It does not immediately spawn a Bug or directly damage the Product.

- A future skill may slow a work item while an agent actively works on it, giving the agent more time without making stopping movement the default rule.

### Problems

- Bugs and other problems move toward the Product.

- Resolving a problem awards Compute.

- If the problem leaks through, it damages the Product according to severity.

- Advanced problems may transform, split, return, buff other problems, become hidden, or create downstream consequences.

### Technical Debt

- Technical Debt is a visible, level-local counter of accumulated liability, starting at zero. It is not a normal enemy, a combat stat, or a spendable resource.

- Each unfinished productive work item adds +1 debt in the prototype, regardless of partial completion. The counter accumulates through normal waves without immediately adding enemy traffic.

- Before the boss, the Technical Debt Sprint turns accumulated debt into actionable Technical Debt cleanup items. Each completed Technical Debt cleanup item removes one debt; any debt left at the end increases the Production Incident's pressure as defined in [Production Incident](Content_Design.md#production-incident).

- Clearing debt does not retroactively complete the original task or grant its Compute, Product healing, or Product Progress. Recovery removes a future liability; normal task completion remains more valuable.

- Debt does not carry into the next level. Additional debt sources, such as shortcuts or Code Smells, are future possibilities rather than first-prototype requirements.

## Tower Targeting, Line of Sight, and Work Modes

**Status: Prototype; initial Tower commitment values are accepted in [Tower stats](../Tower_Base_Stats.md#tower-overview-and-playtest-stats). The final priority list remains Hypothesis.**

### Core Tower contract

**Tower** is the umbrella category for player-placed gameplay units and structures. **Copilot** is one Tower family. Each Tower type declares which interactions and configuration controls it supports; future Tower types are not assumed to use Copilot Personas or to perform both productive Work and Problem resolution.

The shared rules below apply to target-capable Towers that expose these features. The first playable roster of Base, Developer and Tester uses Build / Defend / Auto. The accepted broader Copilot roster also includes fully passive Analyst, Enemy-targeting Architect and radial Linter; Copilot family identity does not imply a direct action or the full mode set. Security retains both Work and Enemy targeting.

- The **Tower definition** owns immutable identity, family/behavior kind, placement rules, interaction capabilities, supported controls, coverage, and base stats.
- The **Tower instance** owns mutable placed state such as position, facing, current configuration, target, readiness, commitment, and resolved modifiers.
- Shared numerical placement and target-action fields are **Core Tower stats**, not Copilot stats. Copilots inherit them and add family, Persona, upgrade, and later agent-layer rules without duplicating values.
- A non-targeting or support Tower declares the behavior and properties it actually needs. Analyst has passive coverage without action stats; Linter has a timed radial action without an individual target. Neither requires dummy targeting fields.

Tower definitions can declare a per-type `placementLimit` independently of the map's total Tower limit. Senior Developer's intended maximum of one on the map is a future content use case. The simulation enforces the restriction before spending resources or creating an instance, and state restoration validates the same rule. Identity grouping across future variants and any replacement/selling rules remain open. The shared mechanism is implemented and tested; playable Human content remains outside the Copilot-only Alpha.

[Tower and Copilot core properties and stats](../Tower_Base_Stats.md) owns the complete property/stat separation, current implementation mapping, and intended modifier resolution path. [Copilot / Agent Design](Copilot_Agent_Design.md) owns the Copilot-specific extension.

### Primary operating mode

- Auto — default. Balances both flows locally: handle visible Problems first, otherwise work on visible productive tasks.

- Build — focuses only on productive work such as coding tasks and ignores Problems.

- Defend — focuses only on Problems and ignores productive work.

Player-facing meaning: **Build:** “Only work.” **Defend:** “Only problems.” **Auto:** “Handle visible problems first, otherwise work.”

### Line of Sight

- A target is **visible** to a Tower only when it is inside that Tower's nominal range, inside its line-of-sight shape, and has an unobstructed sight line from the Tower's target origin to the target. Direct target acquisition and range-based passive effects require this coverage. Separate action effects follow their explicit collision rules: Architect selects a visible Enemy and checks blast blockage from the impact point; Linter projectiles stop at obstacles. Hidden-Enemy detection is an additional eligibility rule supplied by Security's Threat Scan; reveal does not grant other Towers unlimited range or sight through obstacles.

- Every target-capable Tower type declares one line-of-sight shape. A non-targeting Tower does not need a targeting shape unless its support effect uses authored coverage. **Area** is a 360-degree radius centered on the Tower. **Cone** is a forward-facing sector with a configured radius and angle. The Tower's facing direction is part of its placed state; rotating a cone during planning changes its coverage. Exact radius, cone angle, and which Tower types use a cone remain tuning data.

- Map obstacles can provide both a placement footprint and a line-of-sight blocker. A blocker hides targets whose sight line crosses its authored blocking shape; a target that moves around the obstacle becomes visible again immediately. Obstacles do not reduce a tower's nominal range or change pathing unless a map separately authors that behavior.

- A server building is the first named map obstacle: it blocks line of sight and its footprint is prohibited for tower placement. Its visible model, placement footprint, and sight-blocking shape must be authored from the same map instance so visual and simulation state cannot disagree.

- The selected tower and placement preview must show the effective coverage shape. Occluded portions/targets and blocked placement space need a distinct, non-colour-only treatment so the player can plan around them. A tower that loses sight of its current target releases it immediately, including during an Auto commitment window.

### Local target selection and commitment

- A tower considers only targets it can see inside its own range. It has no knowledge of or influence on targets elsewhere on the map for targeting purposes.

- In Auto, a valid visible Problem has category priority over productive work. If there are no valid visible Problems, Auto selects a valid visible productive work item. If neither category has a valid target, the tower is idle until one becomes visible.

- Build uses the same local selection rules for productive work only. Defend uses them for Problems only. Build never selects a Problem and Defend never selects productive work, even when their preferred category is absent.

- Within its eligible category, each tower uses the player's selected targeting priority, such as closest to Product, highest severity, first, last, or another readable rule. The priority compares only valid targets currently visible to that tower.

- Auto keeps its current target while it remains valid. It changes target when the current target is completed or resolved, leaves line of sight or range, or another valid target becomes higher priority.

- Apply a short target commitment window after Auto acquires a target. Completion, resolution, and losing line of sight or range release the target immediately; otherwise Auto waits for the commitment window before changing to a newly higher-priority target. This prevents rapid switching and visual jitter while preserving responsive local defense.

- Architect's Enemy-only automatic targeting retains the same commitment concept: its 0.5-second commitment is independent of its 1.2-second firing interval. Once the commitment expires, ordinary target priority may choose a different valid Enemy before the next shot. This does not introduce automatic cluster scoring. Analyst has no direct-action target; Linter has no individual target and therefore no target commitment.

- There is no global Emergency Zone near the Product and no map-wide Auto override. Reaching a Problem is a placement and coverage decision.

### Target priority

The player can configure simple priority rules. The exact final list can be tuned, but the intended family includes priorities such as closest to Product, first, last, strongest/highest severity, and similar readable modes. A safe default is closest to Product.

Configuration is primarily handled during untimed planning between waves. During early active waves, only the core orchestration controls remain available: tower placement/upgrades, Build/Defend/Auto changes, and target-priority changes. No configuration changes are available while paused.

During the Technical Debt Sprint, Technical Debt cleanup items use work-style progress and are eligible for Build and Auto when they are visible to a Work-capable tower. Defend ignores Technical Debt cleanup items. Base Copilots, Developers, Testers and the later Security Persona can contribute through their Work actions. Analyst has no direct Work action; Architect and Linter are combat-only and perform no cleanup. The sprint preview should make this targeting distinction clear.

## Economy: Compute

**Status: Prototype; numerical placeholders and candidate dampeners are Hypothesis**

Compute is the primary build resource. It represents the infrastructure and hosting budget required to spin up and improve AI agents.

- Spend Compute to place a base Copilot.

- Spend Compute to specialize or upgrade an agent.

- Earn Compute by fully completing work items.

- Earn Compute by resolving bugs and other problems. Technical Debt cleanup is an exception: it removes debt without a Compute payout.

- Compute is level-local unless a future mode explicitly introduces a meta-resource.

### Prototype starting numbers

- Starting Compute: approximately 100.

- Base Copilot: approximately 30 Compute.

- Early persona specialization: approximately 20 Compute, equal across early branches.

- Basic bug resolution reward: approximately 5 Compute.

- Basic coding-task completion reward: approximately 10–12 Compute.

- Simple early upgrade: approximately 15–20 Compute.

- Selling/refund target: approximately 70% for a forgiving prototype.

These are tuning placeholders, not immutable balance values.

### Anti-snowball rules

- Success should compound, but not run away uncontrollably.

- Completed work grants Compute, capped Product healing, and visual Product Progress. Missing it loses all three rewards and adds debt; the delayed cleanup opportunity replaces immediate missed-task Bug spawns.

- Debt cleanup grants none of the original task rewards. Tune the sprint so it supports recovery without making deliberate non-completion preferable.

- Potential dampeners include slightly increasing marginal costs for additional Copilots, capped rewards, and small guaranteed wave income.

- The goal is to prevent an early lead from making the rest of a level trivial while avoiding punitive rubber-banding.

## Technical Debt Sprint and boss preparation

**Status: Prototype**

Boss encounters get an explicit dramatic transition rather than simply arriving as another wave.

### Technical Debt Sprint

- After the last normal wave and before boss prep, announce the Technical Debt Sprint and show the accumulated debt total.

- Use the normal untimed preparation and manual-start flow, followed by a time-limited cleanup round. The amount of debt determines the amount of cleanup work; the exact duration and work required per item are tuning values.

- Each point of debt is represented by one clearly marked **Technical Debt cleanup item** with a progress meter. Agents work on these items during the sprint; fully clearing an item removes one point from the counter immediately.

- Cleanup is a recovery opportunity, not an ordinary enemy wave. Technical Debt cleanup items do not attack or deal leak damage. An unresolved item leaves its existing debt unresolved and never creates another point of debt.

- Clearing Technical Debt cleanup items grants no Compute, Product healing, or Product Progress, and does not repay the original missed task rewards.

- End the sprint when its time expires or all debt is cleared. With zero debt, show a brief all-clear and proceed directly to boss prep.

At sprint end, lock the unresolved debt total for the encounter and display its consequences during preparation. The exact extra-Bug budget and spawn rules belong to [Production Incident](Content_Design.md#production-incident).

### Boss preparation

- Show a clear warning and dedicated boss-prep moment or animation.

- Boss prep is an untimed planning state after the Technical Debt Sprint. Preview the boss and the exact Technical Debt Bug count from unresolved Technical Debt cleanup items before the player starts it.

### Future resource conversion

**Status: Future**

- If AI Tokens are implemented, expose a special resource-conversion control only during this state. Resource conversion is not required for the first core-loop prototype.

- Allow Compute to be converted into AI Tokens as an emergency lever.

- Allow AI Tokens to be converted back into Compute when the player has tokens to spare but needs one more tower or upgrade.

- Conversion should be intentionally lossy in both directions so it is a tactical rescue/optimization tool, not an always-optimal arbitrage loop.

## Failure, Retry, and Recovery

**Status: Prototype; wave retry is conditional, and failure recovery bonus is Hypothesis**

- If Product health reaches zero, the level fails.

- The player can replay the current wave or restart the full stage, subject to prototype implementation details.

- Permanent unlocks and Product growth from previously completed levels are always retained.

### Between-wave saves

- The player can save between waves, including after the Technical Debt Sprint and during boss preparation when those are between active combat segments.

- A save is a full-state save, not a checkpoint. Loading it restores the exact level state rather than restarting the current wave or granting a recovery benefit.

- Preserve all persistent level-local state: Product health, Compute, Technical Debt, Product Progress, tower placement and facing, persona choices, upgrades, targeting modes and priorities, target-commitment state where relevant, the current/next wave progression, boss and spawned-problem state, and any other active level-local state.

- Mid-wave saving is not required for the first prototype. Between-wave saves are the reliable stopping points for a level that may span several active-play segments.

- A full level restart resets Technical Debt and the current attempt's Product Progress. If wave retry is implemented, restore the wave-start state consistently, including health, resources, debt, and progress, so replaying a wave cannot duplicate rewards or erase its incoming liabilities.

- Commit the current level's visual Product growth only on successful completion; debt does not persist into another level.

- Level-local economy normally resets, but a failed run may provide a capped recovery bonus based on part of the resources earned in that attempt.

- The recovery bonus should provide momentum without making intentional failure an optimal farming strategy.

## Map Topology and Time Controls

**Status: Prototype for early topology and basic speed controls; later topology is Future and 3x is Hypothesis**

### Topology

- Early levels use a single, highly readable path.

- Later levels can introduce visible forks and merges such as hotfix branches, integration routes, or security detours.

- Branching should usually be deterministic and visible in advance. The game should reward strategy, not route guessing.

- Avoid maze-building as the core identity; the SDLC path remains authored and readable.

- Map topology includes intentional line-of-sight blockers and prohibited placement footprints. A Server building is the first example: it creates a readable blind spot and cannot be built on, adding placement and coverage decisions without changing the authored route.

### Speed controls

- Support standard time-speed controls such as 1x, 2x, and potentially 3x to respect the player’s time.

- Speed controls do not change the rule that tactical edits occur in real time while the wave is active.

## AI Tokens: Global Tactical Resource

**Status: Future**

AI Tokens are a future tactical resource, introduced after the first core-loop prototype alongside Skills, MCP connections, and special abilities. They are absent from Level 1, including token collection and caches, so they do not affect its pacing. When introduced, Compute builds and grows the team; AI Tokens fuel high-impact active abilities.

### Future token rules

- AI Tokens belong to one global player pool, not to individual towers.

- The player starts a level with a fixed token pool and must manage it across the entire level, including the boss.

- Basic tower actions do not consume tokens. Special abilities and high-impact actions may consume them.

- Different model profiles can modify token costs and ability effectiveness.

- The player may concentrate the whole token budget into one powerful agent or distribute it across many agents.

### Token recovery

- There is no guaranteed full refill after every wave.

- Optional token caches may appear on the map. The player clicks the cache directly within its availability window to claim extra tokens.

- Copilots do not spend time collecting these caches; the player is the orchestrator who gathers tactical resources for the agents.

- Future events or bonuses may increase token capacity or create additional recovery opportunities.

## Open shared-system questions

**Status: Hypothesis**

- Exact fixed Product maximum health, healing per task, and severity/damage scale.
- Visual Product growth milestones and completed-work presentation, without combat-stat scaling.
- Technical Debt Sprint duration, work per cleanup item, placement, and pacing; Level 1 owns its chosen values.
- Final priority list, Auto commitment duration, and target-change feedback; confirm local Problem-first behavior is understandable without a global Emergency Zone.
- Full-state save/restore details: wave/boss state, commitments, and other persistent effects, with no duplicated rewards or changed outcomes.
- Line-of-sight geometry representation, cone angles/radii, initial tower shape assignments, and coverage/occlusion feedback that stays readable on touch devices.
- Exact anti-snowball formula, guaranteed-income candidates, and failure recovery bonus.
- Validate the 3–6 minute active-wave and up-to-30-minute full-level estimates against manageable play segments.

**Status: Future — unresolved values**

- Compute/AI Token exchange rates, token-cache frequency and rewards, and token introduction timing.

Agent throughput and aura values are owned by [Agent Design](Copilot_Agent_Design.md#stats-and-upgrade-tuning). Content movement, required work, ambiguity, and boss budgets are owned by [Content Design](Content_Design.md#open-content-tuning). Level-specific choices are tracked in [Level 1](levels/Level_01_Just_One_Small_Feature.md#level-specific-tuning).

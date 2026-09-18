# Content Design

[Master GDD](00_Master_GDD.md) · [Core rules](Core_Gameplay_Systems.md) · [Agents](Copilot_Agent_Design.md) · [Level 1](levels/Level_01_Just_One_Small_Feature.md)

Owns gameplay content and its specific behavior, including future Human Tower concepts and supporting-character roles. Copilot-family behavior remains with Copilot / Agent Design. Keep productive work, problems, debt consequences, bosses, and future concepts together until roster growth justifies a split.

Statuses follow the [Master GDD](00_Master_GDD.md#commitment-statuses). A more specific status overrides its enclosing section. Unspecified values remain open; restructuring does not approve new mechanics or tuning.

## Human Towers and supporting characters

**Status: Locked — classification; Human Tower gameplay and supporting-character details remain Future**

- **Human Towers** are a future roster direction alongside AI-agent Copilot Towers. Each can have its own concept, role, and defining elements; Copilot Persona and agent-capability rules do not automatically apply.
- **Senior Developer** is a distinct Human Tower concept. The agreed direction is a powerful, very expensive special Tower with at most one placed on the map at a time. This is specific to Senior Developer, not a blanket rule for every Human Tower. Exact output, price, abilities, progression, availability, and replacement/selling rules remain undefined. It is separate from the Copilot **Developer Persona**.
- **People Manager (Bert)** is a supporting character towards the player, not a placeable gameplay element. Its interactions and presentation remain to be refined; no placement, combat, aura, or Tower-progression mechanics follow from its character model.
- **Special Tower** is currently descriptive language, not an approved additional family or shared ruleset. The relationship between future Human and Special Towers can be refined with their gameplay.

These decisions establish future direction without expanding Alpha's Copilot-only playable roster. Existing character art records visual choices; asset names and storage categories do not override this gameplay classification. The [Tower-family extension boundary](Technical_Architecture.md#tower-family-extension-boundary) describes how later implementation must accommodate these concepts without adding dormant systems now.

## Productive Work / Coding Tasks

**Status: Prototype**

The initial productive content is a moving coding task with a completion meter. Multiple in-range agents can contribute simultaneously. Content tuning defines required work and movement speed; [Core dual-flow rules](Core_Gameplay_Systems.md#dual-flow-work-and-problems) own completion payouts, healing, Product Progress, and missed-task consequences. Partial progress has no payout.

Ambiguous Requirement (called **Unclear Requirements** in the Tower definitions) is a targetable moving enemy that increases an affected task's required work visibly while it remains active. The names refer to the same Enemy concept; this documentation update does not rename runtime content IDs. It follows the shared Problem lifecycle: agents can resolve it, and a leak damages the Product according to its severity. It must remain achievable with the available Developer and Tester before Analyst unlocks. A missed affected task uses the ordinary missed-work rule; ambiguity does not directly spawn Bugs.

After Analyst becomes available, resolving this Enemy inside its effective coverage triggers Opportunity Discovery: one ordinary productive Work item enters at the Work route entrance, regardless of which Tower delivers the kill. Overlapping Analysts do not duplicate the item. Creation itself pays nothing; completion earns ordinary rewards, including QA Aura's bonus when applicable, while a miss follows the normal debt rule. Clear Briefing supports Developer action speed; Analyst does not directly reduce required Work or remove debt. [Tower ability definitions](../Tower_Base_Stats.md#additional-abilities) own these effects. Generated Work template selection and encounter scheduling/settlement integration remain implementation follow-ups.

**Status: Hypothesis**

Exact task movement speed, required work, and ambiguity burden remain open. The source does not define separate task variants or multi-stage completion for Level 1.

## Problems / Enemies

**Status: Prototype**

Bug is the baseline problem. Ambiguous Requirement lightly introduces upstream difficulty in Level 1. Production Incident is the boss defined separately below. [Core problem-flow rules](Core_Gameplay_Systems.md#dual-flow-work-and-problems) own resolution rewards and severity-based leak damage.

### SDLC roster

**Status: Future except Bug, Ambiguous Requirement, and Production Incident (Prototype)**


#### Requirements and planning

- Ambiguous Requirement / Unclear Requirements — a targetable moving enemy that visibly increases affected tasks' required Work while active. Resolving it removes the source of that burden; a leak damages the Product. A missed task adds ordinary Technical Debt and ambiguity does not directly spawn Bugs. Analyst later turns its resolution within coverage into a productive Work opportunity and supports Developers through Clear Briefing; it does not directly reduce the ambiguity penalty. Developer and Tester must be able to handle affected Work before Analyst unlocks.

- Scope Creep — slow support-style problem that can make other work/problems harder.

#### Development

- Bug — simple baseline problem.

- Syntax Error — fast, fragile nuisance.

- Code Smell — can create lingering debuffs or future debt.

#### Quality

- Regression — may return unless handled correctly, giving Tester a natural role.

- Flaky Test — changes state or vulnerability over time.

#### Security

- Security Vulnerability / CVE — potentially hidden or high-impact and suited to Security's Threat Scan. Threat Response's damage bonus requires an explicit security Enemy classification; severity alone does not make an Enemy a security target. Exact content classifications and concealment behavior remain to be authored.

- Future severe incidents can include breaches/hacks as boss-scale threats rather than routine units.

#### Integration and release

- Merge Conflict — potential fusion/interference mechanic.

- Deployment Failure / Production Incident — natural boss and late-stage threats.

The prototype systemic story is causal: Ambiguous Requirement → harder/riskier work → unfinished task → Technical Debt → Technical Debt Sprint → unresolved debt worsens Production Incident. Analyst later supports Developer throughput and creates Work opportunities from resolved uncertainty; it does not bypass this chain or erase existing debt. Regression and other problem interactions can extend this story in later levels.

## Technical Debt as a systemic consequence

**Status: Prototype**

Technical Debt is accumulated liability, not a moving, slow, or tanky enemy. Unfinished productive work builds the counter; the pre-boss sprint exposes it as cleanup work. This connects upstream ambiguity to delayed incident pressure. [Core Gameplay Systems](Core_Gameplay_Systems.md#technical-debt-sprint-and-boss-preparation) owns the counter and cleanup rules, including +1 per missed work item, one debt removed per completed cleanup item, and no task rewards for cleanup.

The content chain is Ambiguous Requirement → harder work → missed task → Technical Debt → Technical Debt Sprint → unresolved debt worsens Production Incident. Analyst supports Developers and creates new Work when qualifying Enemies are resolved in coverage. Clearing debt removes a future liability without retroactively delivering the original work. Architect's bombardment role grants no debt-cleanup bonus.

**Status: Future**

Shortcuts and Code Smells may become additional debt sources. Regression may extend the causal story in a later level; it does not belong to Level 1.

## Bosses

### Production Incident

**Status: Prototype**

Level 1's contained incident has authored baseline Bug spawns and a finite additional Bug budget determined by unresolved debt. This section owns that boss-specific conversion and spawn behavior. Core owns the victory/failure test and boss-prep state; Level 1 owns encounter timing and tuning.


- At sprint end, lock and display the unresolved debt total for the boss encounter.

- Prototype rule: each unresolved Technical Debt cleanup item adds exactly one **Technical Debt Bug** spawn during the Production Incident, in addition to the boss's authored baseline spawns. A Technical Debt Bug is the specialized Bug generated by that unresolved cleanup work. This is a total extra spawn budget for the encounter, not an addition to every spawn cycle.

- Example: enter the sprint with 5 debt and clear 3. Boss prep shows: “Remaining Technical Debt: 2. Production Incident will generate 2 Technical Debt Bugs.”

- Use an authored, visible schedule for these Technical Debt Bugs. If the boss is defeated before all Technical Debt Bugs have spawned, release the remaining scheduled extras as its final incident burst; stop baseline spawns on defeat. Unresolved debt does not also secretly increase boss health, damage, or spawn rate.

The [Core victory condition](Core_Gameplay_Systems.md#what-the-player-protects-the-product) requires the boss's defeat and resolution of all remaining active problems with Product health above zero, including the finite Technical Debt Bugs. Unresolved debt is not an independent victory blocker.

### Later bosses

**Status: Future**

Deployment Failure and severe security incidents such as breaches/hacks are possible boss-scale threats. No complete behavior or encounter specification exists yet.

## Future content concepts


### Progressive Work Complexity — Prototype Investigation

**Status: Hypothesis; investigate after the simple loop is proven, outside Alpha requirements**

This is a promising mechanic but is not yet a locked MVP requirement.

Early work items may require only implementation. Later task types could gain optional or required quality dimensions such as refinement, implementation, review, validation, documentation, or security. For example, Product may clarify a task, Developer implements it, and Tester validates it. A well-handled handoff could increase rewards or reduce the chance of downstream issues.

- Never introduce a mandatory work dimension before the player has unlocked a tool capable of handling it.

- Work complexity should rise alongside player capability.

- Prototype this only after the simple moving-task completion loop is proven fun.

### SDLC Coverage Still Available for Future Content

**Status: Future**

The current design touches planning, coding, testing, security, release, and production, but several real SDLC areas remain useful sources of future mechanics and content.

- Architecture and technical design.

- Build systems, CI, and integration.

- Code review and pull requests.

- Documentation.

- Monitoring and observability.

- Maintenance and feedback loops.

- Governance, compliance, and policy.

- Dependency and supply-chain management.

These should be distributed across enemies, personas, specializations, skills, level modifiers, bosses, and future modes rather than each becoming a mandatory standalone system.

## Open content tuning

**Status: Hypothesis**

- Exact task movement speed and required work; problem movement, durability, and severity values.
- Ambiguous Requirement's work increase, affected-task selection, severity, movement, and visual warning. Keep affected tasks achievable before Analyst unlocks.
- Production Incident baseline behavior and its visible schedule for the finite debt-Bug budget. Keep any final burst readable if defeated early.
- Reward budgets for boss-generated Bugs so accumulating debt or prolonging the encounter is not profitable.
- Numeric content choices used in the first playable are recorded in [Level 1 tuning](levels/Level_01_Just_One_Small_Feature.md#level-specific-tuning); common economy and agent output remain with their owners.

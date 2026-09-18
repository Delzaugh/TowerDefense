# Copilot Tower Defense — Terminology & Glossary

[Master GDD](00_Master_GDD.md) · [Core rules](Core_Gameplay_Systems.md) · [Agents](Copilot_Agent_Design.md) · [Content](Content_Design.md) · [Level 1](levels/Level_01_Just_One_Small_Feature.md)

This is the design set’s shared vocabulary. It gives each maintained term one concise meaning, its current commitment status, and the document that owns the detailed rule. It standardizes language; it does not replace the linked owner or turn a hypothesis or future concept into a requirement.

## Conventions

- Use the bold term as the preferred design and player-facing name. Capitalize named systems and content: **Product**, **Compute**, **Technical Debt**, and **Production Incident**.
- Statuses are canonical in the [Master GDD](00_Master_GDD.md#commitment-statuses). When the glossary conflicts with a linked detailed owner, update both deliberately and defer to the detailed owner for behavior.

## Design and status vocabulary

| Term | Definition | Status | Owner |
| --- | --- | --- | --- |
| **Alpha 1.0.0** | The first playable: one readable map and Level 1, proving the dual-flow loop and Base Copilot-to-Persona model without dormant future systems. | Locked | [Master](00_Master_GDD.md#alpha-100-scope-boundaries) |
| **Commitment status** | A label indicating whether a statement is an agreed boundary, prototype baseline, unvalidated proposal, or deferred direction. | Locked | [Master](00_Master_GDD.md#commitment-statuses) |
| **Future** | A direction beyond Alpha 1.0.0; preserved for later design and not required in the alpha. | Locked | [Master](00_Master_GDD.md#commitment-statuses) |
| **Hypothesis** | An unvalidated proposal, candidate, estimate, or unresolved choice; not an implementation requirement. | Locked | [Master](00_Master_GDD.md#commitment-statuses) |
| **Locked** | An agreed vision, principle, or scope boundary. It changes deliberately and may still be unimplemented. | Locked | [Master](00_Master_GDD.md#commitment-statuses) |
| **Prototype** | The current first-playable / Alpha 1.0.0 baseline to implement and validate. Explicit placeholders remain tunable. | Locked | [Master](00_Master_GDD.md#commitment-statuses) |
| **SDLC** | Software development lifecycle. It shapes mechanics and the route, rather than acting as visual flavor only. | Locked | [Master](00_Master_GDD.md#game-vision) |

## Core game loop and state

| Term | Definition | Status | Owner |
| --- | --- | --- | --- |
| **Active wave** | The real-time portion of a wave after manual start. Early tactical controls remain available, except while paused. | Prototype | [Core](Core_Gameplay_Systems.md#play-rhythm-and-interaction-principles) |
| **Boss prep** | An untimed planning state after the Technical Debt Sprint that previews the boss and exact Technical Debt Bug count from unresolved Technical Debt cleanup items. | Prototype | [Core](Core_Gameplay_Systems.md#technical-debt-sprint-and-boss-preparation) |
| **Dual flow** | The central loop in which productive Work and harmful Problems, including enemies, share a path, requiring local allocation between building and defending. | Prototype | [Core](Core_Gameplay_Systems.md#dual-flow-work-and-problems) |
| **Level completion** | Victory after the Production Incident is defeated and every active Problem, including Technical Debt Bugs, is resolved while Product health remains above zero. | Prototype | [Core](Core_Gameplay_Systems.md#level-completion) |
| **Manual start** | The player explicitly begins a wave after untimed preparation; waves do not start on a timer. | Prototype | [Core](Core_Gameplay_Systems.md#wave-lifecycle) |
| **Planning / preparation** | Untimed between-wave time for placement, upgrades, configuration, and next-wave review. | Locked | [Core](Core_Gameplay_Systems.md#play-rhythm-and-interaction-principles) |
| **Product** | The protected objective: a growing software product that Work improves and Problems threaten. The term is reserved for this objective, not a Persona. | Prototype | [Core](Core_Gameplay_Systems.md#what-the-player-protects-the-product) |
| **Product health** | The Product’s fixed, capped health during a level. Completed Work restores it, leaking Problems damage it, and zero health fails the level. | Prototype | [Core](Core_Gameplay_Systems.md#what-the-player-protects-the-product) |
| **Product Progress** | A current-level completed-Work total used for post-level visual Product growth. It is neither currency, combat scaling, nor a victory requirement. | Prototype | [Core](Core_Gameplay_Systems.md#product-progress-and-visible-growth) |
| **Product growth** | Persistent visual Product development, committed after a successful level according to completed Work. It has no combat-stat benefit in the prototype. | Prototype | [Core](Core_Gameplay_Systems.md#product-progress-and-visible-growth) |
| **Wave** | An authored, data-driven encounter composition. Normal waves lead to Technical Debt Sprint, boss prep, boss, and growth reveal. | Prototype | [Core](Core_Gameplay_Systems.md#wave-lifecycle) |
| **Wave preview** | A visible preview of the next wave, route, and relevant boss consequences to support informed planning. | Prototype | [Core](Core_Gameplay_Systems.md#wave-lifecycle) |

## Work, Problems, and outcomes

| Term | Definition | Status | Owner |
| --- | --- | --- | --- |
| **Ambiguous Requirement / Unclear Requirements** | Two names for the same targetable Enemy concept that increases affected Work requirements while active. A leak damages the Product; missed Work follows the ordinary debt rule. A kill within Analyst coverage can generate a productive Work opportunity. No runtime ID rename is implied. | Prototype Enemy / Accepted later interaction | [Content](Content_Design.md#productive-work--coding-tasks) |
| **Bug** | The baseline moving Problem. Resolving it awards Compute; leaking it damages the Product according to severity. | Prototype | [Content](Content_Design.md#problems--enemies) |
| **Technical Debt cleanup item** | A clearly marked work-style item in the Technical Debt Sprint, representing one point of Technical Debt. Completing one removes that debt but grants none of the missed task’s rewards. An unresolved item creates one Technical Debt Bug in the Production Incident. | Prototype | [Core](Core_Gameplay_Systems.md#technical-debt-sprint) |
| **Coding task** | The initial productive Work content: a moving item with a completion meter that needs enough Work before reaching the path end. | Prototype | [Content](Content_Design.md#productive-work--coding-tasks) |
| **Completed Work** | A Work item fully completed before it leaves the path. It awards Compute, capped Product healing, and one Product Progress in the prototype. | Prototype | [Core](Core_Gameplay_Systems.md#productive-work) |
| **Leak** | A Problem reaching the Product. It applies its severity-based damage and then leaves play. | Prototype | [Core](Core_Gameplay_Systems.md#problems) |
| **Problem** | A harmful moving entity, such as a Bug, that travels toward the Product and must be resolved. | Prototype | [Core](Core_Gameplay_Systems.md#problems) |
| **Productive Work** (or **Work**) | A beneficial moving item, initially a coding task, that agents progress while it travels along the path. | Prototype | [Core](Core_Gameplay_Systems.md#productive-work) |
| **Required Work** | The amount of agent progress a Work item needs for completion. Content tuning defines it; Ambiguous Requirement can increase it. | Prototype | [Content](Content_Design.md#productive-work--coding-tasks) |
| **Resolve** | To eliminate a Problem before it leaks. Resolution awards Compute in the prototype. | Prototype | [Core](Core_Gameplay_Systems.md#problems) |
| **Severity** | A content-defined Problem impact value used to determine Product-health damage on a leak. | Prototype | [Core](Core_Gameplay_Systems.md#what-the-player-protects-the-product) |
| **Unfinished Work** (or **missed Work**) | A Work item reaching the end without full completion. It pays no rewards and adds exactly one Technical Debt; it neither damages the Product nor immediately spawns a Bug. | Prototype | [Core](Core_Gameplay_Systems.md#productive-work) |

## Economy, debt, and recovery

| Term | Definition | Status | Owner |
| --- | --- | --- | --- |
| **Compute** | The primary level-local resource for placing, specializing, and upgrading Copilots. It comes from completed Work and resolved Problems, never debt cleanup. | Prototype | [Core](Core_Gameplay_Systems.md#economy-compute) |
| **Technical Debt Bug** | A specialized Bug in the Production Incident generated by one unresolved Technical Debt cleanup item. It is separate from the boss’s authored baseline Bug spawns; each unresolved item creates exactly one. | Prototype | [Content](Content_Design.md#production-incident) |
| **Technical Debt Sprint** | The time-limited pre-boss cleanup round that turns Technical Debt into actionable Technical Debt cleanup items. It is a recovery opportunity, not an enemy wave. | Prototype | [Core](Core_Gameplay_Systems.md#technical-debt-sprint) |
| **Level-local** | State/resources applying only to the current level attempt. Compute, Technical Debt, and current-run Product Progress are level-local. | Prototype | [Core](Core_Gameplay_Systems.md#between-wave-saves) |
| **Permanent unlock** | A campaign-level capability kept after failure once earned. Persona unlocks are permanent. | Prototype | [Core](Core_Gameplay_Systems.md#failure-retry-and-recovery) |
| **Technical Debt** (or **debt**) | A visible, level-local accumulated-liability counter. In the prototype, each unfinished Work adds one; it is not an enemy, combat stat, or spendable resource. | Prototype | [Core](Core_Gameplay_Systems.md#technical-debt) |
| **Unresolved debt** | Debt represented by a Technical Debt cleanup item that remains after the Technical Debt Sprint. Its total is locked for boss prep and each item causes exactly one finite Technical Debt Bug in the Production Incident. | Prototype | [Content](Content_Design.md#production-incident) |

## Towers, Copilots, Personas, and configuration

| Term | Definition | Status | Owner |
| --- | --- | --- | --- |
| **Auto** | Default operating mode: select a visible Problem first, otherwise visible Work. A short commitment window prevents targeting jitter. | Prototype | [Core](Core_Gameplay_Systems.md#primary-operating-mode) |
| **Base Copilot** | The friendly, neutral general-purpose Copilot Tower placed with Compute before a permanent Persona choice. | Prototype | [Agents](Copilot_Agent_Design.md#base-copilot) |
| **Base stats** | Immutable numerical defaults authored on a Tower definition before eligible modifiers are applied. | Prototype | [Tower properties and stats](../Tower_Base_Stats.md#core-tower-stats-implemented-baseline-action-model) |
| **Build** | Operating mode that selects only visible Productive Work and ignores Problems. | Prototype | [Core](Core_Gameplay_Systems.md#primary-operating-mode) |
| **Copilot** | AI-agent Tower family with a Base form and permanent Persona progression. Persona behavior can provide Work, Enemy attacks, passive support or radial actions; not every Copilot has an individual target or both flows. | Locked taxonomy / Accepted roster | [Agents](Copilot_Agent_Design.md#scope-within-the-broader-tower-roster) |
| **Core Tower property** | A shared identity, capability, placement, configuration, geometry, reference, or state field that the Tower contract can represent. It is not necessarily numerical, and optional interactions need not apply to every Tower type. | Locked | [Tower properties and stats](../Tower_Base_Stats.md#core-tower-properties) |
| **Core Tower stat** | A shared numerical gameplay parameter used by an applicable Tower rule or behavior, such as cost, footprint, range, output, or cooldown. It is inherited by Copilots rather than redefined as a parallel Copilot value. | Locked | [Tower properties and stats](../Tower_Base_Stats.md#core-tower-stats-implemented-baseline-action-model) |
| **Defend** | Operating mode that selects only visible Problems and ignores Work and Technical Debt cleanup items. | Prototype | [Core](Core_Gameplay_Systems.md#primary-operating-mode) |
| **Developer** | Early direct-throughput Persona with faster actions and higher damage per action than Base, the same Work per action, and no passive ability. | Accepted playtest baseline | [Agents](Copilot_Agent_Design.md#persona-roster-and-availability) |
| **Human Tower** | A future Tower family direction for human characters with distinct concepts, roles, and elements, separate from AI-agent Copilots and their Persona progression. | Locked classification / Future gameplay | [Content](Content_Design.md#human-towers-and-supporting-characters) |
| **Senior Developer** | A future Human Tower concept: powerful, very expensive, and limited to one placed on the map at a time. Separate from the Copilot Developer Persona; exact mechanics and values remain open. | Future | [Content](Content_Design.md#human-towers-and-supporting-characters) |
| **Special Tower** | Descriptive language for concepts such as Senior Developer; not yet a separate family or a shared ruleset for all Human Towers. | Future / unresolved taxonomy | [Content](Content_Design.md#human-towers-and-supporting-characters) |
| **People Manager (Bert)** | A supporting character towards the player, not a placeable element or Tower. Its supporting interactions remain undefined. | Locked classification / Future details | [Content](Content_Design.md#human-towers-and-supporting-characters) |
| **In range / visible** | Inside a target-capable Tower’s own nominal range, its Area or Cone shape, and with an unobstructed sight line; only then is a target eligible for local selection. | Prototype | [Core](Core_Gameplay_Systems.md#line-of-sight) |
| **Line of Sight** | A Tower’s targetable coverage after applying its Area or forward-facing Cone shape and map blockers. An obstacle blocks targets behind its authored sight-blocking shape without reducing nominal range. | Prototype | [Core](Core_Gameplay_Systems.md#line-of-sight) |
| **Local targeting** | Target selection confined to one target-capable Tower’s visible coverage. There is no map-wide Auto override or global emergency zone. | Prototype | [Core](Core_Gameplay_Systems.md#local-target-selection-and-commitment) |
| **Operating mode** (or **work mode**) | A supported Tower's local-allocation policy. Base, Developer, Tester and Security expose Auto, Build and Defend; other behaviors expose only applicable controls. | Accepted design / Partial implementation | [Core](Core_Gameplay_Systems.md#tower-targeting-and-work-modes) |
| **Persona** | A permanent identity branch for a placed Base Copilot that defines its strategic role. A new Base Copilot may specialize differently. | Prototype | [Agents](Copilot_Agent_Design.md#persona-branching) |
| **Analyst** | Post-Level-1 passive support Persona with a large 360° Area, Developer speed support and Work opportunities from qualifying Enemy kills. No direct attack or Work action. | Accepted playtest baseline / Implementation pending | [Agents](Copilot_Agent_Design.md#unlockable-personas) |
| **Architect** | Long-range, slow Enemy-only bombardment with area damage and target commitment. No Work, debt-cleanup bonus or passive. | Accepted playtest baseline / Implementation pending | [Agents](Copilot_Agent_Design.md#unlockable-personas) |
| **Linter Agent** | Short-range radial projectile Persona. Fires in eight directions without an individual target; no Work or passive. | Accepted playtest baseline / Implementation pending | [Agents](Copilot_Agent_Design.md#unlockable-personas) |
| **Opportunity Discovery** | Analyst passive that generates one ordinary Work item per qualifying Unclear Requirements Enemy killed within coverage; overlapping Analysts do not duplicate it. | Accepted playtest baseline / Implementation pending | [Abilities](../Tower_Base_Stats.md#additional-abilities) |
| **Clear Briefing** | Analyst passive that increases nearby Developer Personas' action speed, affecting Work and damage; strongest overlapping bonus applies. | Accepted playtest baseline / Implementation pending | [Abilities](../Tower_Base_Stats.md#additional-abilities) |
| **Threat Scan / Threat Response** | Security's passive hidden-Enemy reveal and direct-action damage bonus against explicitly classified security Enemies. | Accepted playtest baseline / Implementation pending | [Abilities](../Tower_Base_Stats.md#additional-abilities) |
| **Structural Impact** | Architect's area-damage special centered on its selected Enemy, with blast blockage checked from impact. | Accepted playtest baseline / Implementation pending | [Abilities](../Tower_Base_Stats.md#additional-abilities) |
| **Rule Burst** | Linter's straight radial projectile volley; each projectile stops at its first Enemy hit, obstacle or range limit. | Accepted playtest baseline / Implementation pending | [Abilities](../Tower_Base_Stats.md#additional-abilities) |
| **QA Aura** (Quality Aura) | Tester's passive Enemy slow and productive-Work completion bonus, sharing the Tower's resolved obstacle-blocked action coverage. No independent radius. Overlaps use the strongest effective slow and strongest bonus separately. Numerical values live in the ability specification; current test fixtures still need alignment. | Accepted playtest baseline / Foundation implemented | [Ability](../Tower_Base_Stats.md#qa-aura) |
| **Resolved Tower stats** | Final values after authored bases, diagnostic overrides, owned upgrades, and active external modifiers. Action/ability stats exist only for applicable behaviors. Copilot Persona progression remains future implementation. | Prototype implementation | [Tower properties and stats](../Tower_Base_Stats.md#stat-resolution) |
| **Server building** | A map infrastructure obstacle whose authored footprint rejects Tower placement and whose authored blocker shape occludes Line of Sight. | Prototype | [Core](Core_Gameplay_Systems.md#line-of-sight) |
| **Specialization** | A future permanent sub-branch within a Persona. It develops the Persona without replacing its identity. | Future | [Agents](Copilot_Agent_Design.md#long-term-agent-architecture) |
| **Target commitment window** | Period in which automatic targeting keeps a valid target despite a newly higher-priority one; independent of firing cooldown. Also applies to Enemy-only Architect. Invalid targets release immediately. Analyst and Linter have no individual-target commitment. | Accepted playtest baseline / Partial implementation | [Core](Core_Gameplay_Systems.md#local-target-selection-and-commitment) |
| **Target priority** | A player-selected readable rule among valid targets in one target-capable Tower’s eligible category/range, such as closest to Product, first, last, or highest severity. | Hypothesis | [Core](Core_Gameplay_Systems.md#target-priority) |
| **Tester** | An early Copilot Persona that remains an active Work/Problem Tower while providing the placement-focused Quality Aura. It has lower direct throughput than Developer. | Prototype | [Agents](Copilot_Agent_Design.md#persona-roster-and-availability) |
| **Tower** | The umbrella category for player-placed gameplay units or structures. A Tower may complete Work, resolve Problems, support other Towers, or provide another explicitly defined function. Copilot is one Tower family; future families need not use Copilot Persona or progression rules. | Locked | [Master](00_Master_GDD.md#tower-taxonomy) |
| **Tower definition** | Immutable authored content shared by all instances of one Tower type: identity, family/behavior kind, capabilities, placement and coverage rules, supported controls, and base stats. | Locked boundary / Prototype schema | [Tower properties and stats](../Tower_Base_Stats.md#layer-boundaries) |
| **Tower instance** | One placed Tower's mutable run state, including its definition reference, position, configuration, target/readiness state, and eligible modifiers. | Prototype | [Tower properties and stats](../Tower_Base_Stats.md#core-tower-instance-state) |

## Bosses, content roster, and Level 1

| Term | Definition | Status | Owner |
| --- | --- | --- | --- |
| **Authored baseline spawns** | The Production Incident’s designed Bug schedule, independent of Technical Debt. These stop when the boss is defeated. | Prototype | [Content](Content_Design.md#production-incident) |
| **Final incident burst** | Remaining scheduled Technical Debt Bugs released if the Production Incident dies before all of them have spawned. This keeps debt consequences finite and visible. | Prototype | [Content](Content_Design.md#production-incident) |
| **Just One Small Feature** | Level 1: the first playable’s tutorial level and day-to-day development scenario. It teaches the reduced core roster and unlocks the Analyst Persona on success. | Prototype | [Level 1](levels/Level_01_Just_One_Small_Feature.md#level-1-just-one-small-feature) |
| **Production Incident** | Level 1’s contained boss: authored baseline Bug spawns plus a finite budget of one Technical Debt Bug per unresolved Technical Debt cleanup item. | Prototype | [Content](Content_Design.md#production-incident) |
| **Regression** | A future Quality Problem that may return unless handled correctly; deliberately excluded from Level 1. | Future | [Content](Content_Design.md#sdlc-roster) |
| **Security** (Persona) | Detects hidden Enemies, deals bonus damage to classified security threats and retains weaker Work output. Locked in Level 1, with a later unlock. | Accepted playtest baseline / Implementation pending | [Agents](Copilot_Agent_Design.md#unlockable-personas) |
| **Syntax Error** | A future fast, fragile nuisance Problem, deliberately excluded from Level 1. | Future | [Content](Content_Design.md#sdlc-roster) |

## Control, persistence, and pacing

| Term | Definition | Status | Owner |
| --- | --- | --- | --- |
| **Between-wave save** | A full-state save made between active segments, including after the Sprint and in boss prep. Loading restores exact level state; it is not a checkpoint or recovery benefit. | Prototype | [Core](Core_Gameplay_Systems.md#between-wave-saves) |
| **Full level restart** | Starting the attempt over. It resets current-attempt debt and Product Progress while retaining permanent unlocks and committed Product growth. | Prototype | [Core](Core_Gameplay_Systems.md#between-wave-saves) |
| **Hard-freeze pause** | A pause that stops gameplay and forbids all tactical edits until play resumes. | Locked | [Core](Core_Gameplay_Systems.md#play-rhythm-and-interaction-principles) |
| **Speed controls** | Time-speed settings, initially 1x and 2x with 3x still a candidate, that respect player time without changing active-wave tactical rules. | Prototype / 3x Hypothesis | [Core](Core_Gameplay_Systems.md#speed-controls) |
| **Wave retry** | A conditional recovery option that restores consistent wave-start state, including health, resources, debt, and progress, so rewards cannot be duplicated. | Prototype | [Core](Core_Gameplay_Systems.md#failure-retry-and-recovery) |

## Future AI-native layers

Every term here is intentionally absent from Alpha 1.0.0 unless later design explicitly promotes it.

| Term | Definition | Status | Owner |
| --- | --- | --- | --- |
| **AI Tokens** | A future global tactical resource for high-impact active abilities. Compute builds the team; Tokens fuel special actions. | Future | [Core](Core_Gameplay_Systems.md#ai-tokens-global-tactical-resource) |
| **Context** | A future per-agent operational constraint. High load may reduce efficiency or require compaction; it is not currency or an identity branch. | Future | [Agents](Copilot_Agent_Design.md#context-future-per-agent-operational-constraint) |
| **Hook** | A future reactive trigger that fires when specified conditions occur. | Future | [Agents](Copilot_Agent_Design.md#future-ai-native-growth-layers) |
| **Instruction** | A future passive behavioral modifier, potentially affecting priorities, efficiency, or specialization. | Future | [Agents](Copilot_Agent_Design.md#future-ai-native-growth-layers) |
| **MCP connection** | A future external-system-style capability attachment, grouped with Tools as an advanced capability. | Future | [Agents](Copilot_Agent_Design.md#future-ai-native-growth-layers) |
| **Model Profile** | A future lightweight operating modifier for a Copilot. It changes performance and tradeoffs without replacing Persona or Specialization. | Future | [Agents](Copilot_Agent_Design.md#model-selection) |
| **Plugin** | A future bundle or higher-level capability package available to a Copilot. | Future | [Agents](Copilot_Agent_Design.md#future-ai-native-growth-layers) |
| **Skill** | A future active or passive ability that modifies Work and defense behavior. | Future | [Agents](Copilot_Agent_Design.md#future-ai-native-growth-layers) |
| **Sub-agent** | A future delegated helper that may perform Work and interact with Context mechanics. | Future | [Agents](Copilot_Agent_Design.md#future-ai-native-growth-layers) |
| **Tool** | A future capability or external-system-style attachment that expands a Copilot’s options; MCP connections are the related connection form. | Future | [Agents](Copilot_Agent_Design.md#future-ai-native-growth-layers) |

## Causal chain to preserve

**Ambiguous Requirement → harder Work → unfinished Work → Technical Debt → Technical Debt Sprint → unresolved Technical Debt cleanup item → Technical Debt Bug.**

The **Analyst Persona** supports Developers through Clear Briefing and generates productive opportunities from qualifying Enemy kills through Opportunity Discovery. It does not directly reduce ambiguity penalties or erase debt. Clearing debt removes future incident pressure but never retroactively grants missed Work rewards.

# Copilot / Agent Design

[Master GDD](00_Master_GDD.md) · [Core rules](Core_Gameplay_Systems.md) · [Content](Content_Design.md) · [Level 1](levels/Level_01_Just_One_Small_Feature.md)

Owns the Copilot Tower family's identity, Persona behavior, upgrades, stats, and future agent layers. It does not own every future Tower family. Shared target-selection algorithms are owned by Core Gameplay Systems.

Statuses follow the [Master GDD](00_Master_GDD.md#commitment-statuses). A more specific status overrides its enclosing section. Unspecified values remain open; restructuring does not approve new mechanics or tuning.

## Scope within the broader Tower roster

**Status: Locked — terminology and ownership boundary**

A **Tower** is any player-placed gameplay unit or structure. A **Copilot** is a specific Tower family built around AI-agent identity and progression. The terms are not interchangeable.

Alpha 1.0.0 intentionally uses Copilots for its complete playable Tower roster. Future Tower families may complete Work, resolve Problems, support other Towers, or provide another explicit function, but they do not automatically use Personas, Model Profiles, or the other Copilot-specific layers in this document. Their behavior and progression require their own approved design.

Senior Developer is a future **Human Tower**, separate from the Developer Persona below. People Manager (Bert) is a non-placeable supporting character for the player. Their classification is owned by [Content Design](Content_Design.md#human-towers-and-supporting-characters).

## Copilot Tower Model

**Status: Accepted playtest definitions for Base, Developer, Tester, Analyst, Security, Architect and Linter Agent; production Persona implementation pending.** Level availability remains governed by the campaign scope below.

### Base Copilot

Within the Copilot family, every newly placed Alpha Copilot begins as the same friendly, general-purpose Base Copilot. The base unit is intentionally understandable and neutral. The player then commits that individual Copilot to a Persona branch. This rule does not require every future Tower to begin as a Copilot.

**Agreed role refinement — 2026-09-17:** Base Copilot is the affordable starting form used to upgrade into a Persona. It can contribute while the player saves or decides, but Alpha does not give remaining a Base Copilot a separate long-term generalist upgrade path. Meaningful progression proceeds through the permanent Persona choice and subsequent Persona upgrades; no automatic specialization deadline is implied.

### Core Copilot properties and stat ownership

A Core Copilot starts with Copilot family identity, neutral Base form, Work and Problem capabilities, Build / Defend / Auto configuration, target priority, and eligibility for a permanent Persona choice. A Persona may replace these capabilities and controls: the family does not require every specialized Copilot to retain a targeted action or both flows. Analyst is fully passive; Architect and Linter are combat-only.

Cost, footprint, range, action cooldown, Work output, Problem-resolution output, and target commitment are shared Core Tower stats. A Copilot receives authored values for those fields; it does not own a duplicate numerical schema. Persona and upgrade rules apply explicit modifiers or separate behavior stats. For example, Tester aura slow and bonus Compute belong to Tester behavior rather than to every Tower; aura coverage reuses the Tower's resolved range and obstacle-blocked action coverage.

[Tower and Copilot core properties and stats](../Tower_Base_Stats.md) owns the definition/instance/property/stat boundary. The implemented schema separates Copilot/Human family from targeted/passive behavior; [Tower Foundation Implementation](../Tower_Foundation_Implementation.md) records ability, upgrade, effect, and save support. The playable Copilot Persona tree remains to be designed in detail and implemented.

### Persona branching

A persona choice is permanent for that placed Copilot. The player remains free to place another base Copilot and specialize it differently. This preserves experimentation without allowing one tower to become everything.

#### Persona roster and availability

- Developer — direct throughput specialist with no passive ability. Upgrading Base Copilot into Developer improves both action speed (shorter cooldown between actions) and damage per action compared with Base Copilot. It also increases direct Work throughput through faster shared action cadence, while preserving Base Work output per action in the initial playtest baseline. Developers complete coding tasks and resolve Bugs and other problems more quickly than other early personas. Choose this Persona when a part of the map needs more raw output. Initial values are defined in the [Tower playtest stat table](../Tower_Base_Stats.md#tower-overview-and-playtest-stats); later upgrade increments remain open.

- Tester — quality and leverage specialist. Upgrading Base Copilot into Tester preserves its direct Work output, Problem-resolution output, and action cadence, and adds QA Aura. At the initial Persona stage, Tester therefore has the same direct throughput as Base Copilot and lower direct throughput than Developer, comparing equivalent modifiers. Tester continues working on productive tasks and attacking Enemies while its passive aura improves nearby outcomes. Later Persona upgrades are a separate design question.

##### Tester Quality Aura — prototype rule

The canonical [QA Aura specification](../Tower_Base_Stats.md#qa-aura) owns its effects, values, coverage, timing, overlap and enhancement rules. The shared [Tower overview](../Tower_Base_Stats.md#tower-overview-and-playtest-stats) lists the ability by name, keeping passive-specific stats out of the Tower comparison table.

The [QA probe](../Tower_Foundation_Implementation.md) exercises the ability, upgrades and external modifiers. It still uses the earlier 3 Work/damage per action and +2 Compute fixtures; aligning it with the playtest design and implementing the playable Base-to-Tester Persona transition remain follow-ups.

Every Tester projects one clearly visible QA Aura. Its obstacle-blocked action coverage must be readable on placement, while selected and during play so that placing a Tester is an intentional coverage decision.

Regression and Technical Debt interactions are future Tester upgrades or specialization options, not initial Persona rules.

#### Unlockable Personas

**Status: Accepted initial playtest definitions; implementation pending.** [Tower stats](../Tower_Base_Stats.md#additional-towers) owns their numerical baseline; [Passives and specials](../Tower_Base_Stats.md#additional-abilities) owns ability effects and values.

- Analyst — fully passive support with a large, always-360° Area. Opportunity Discovery generates productive Work when an Unclear Requirements Enemy is killed inside coverage; Clear Briefing increases the action speed of Developer Personas within coverage. It never attacks, contributes directly to Work, reduces ambiguity requirements directly, or erases debt. It relies on teammates to kill Enemies and complete generated Work.

- Security — single-target specialist defense with weaker Work output. Threat Scan reveals hidden Enemies in coverage so eligible teammates can attack; Threat Response increases damage against explicitly designated security Enemies. Ordinary damage throughput remains below Developer's, while its specialist damage is higher.

- Architect — long-range, slow bombardment. It selects only Enemies, applies a target commitment window independently of its firing interval, and uses Structural Impact to damage an area centered on the selected Enemy. Its sustained damage per affected Enemy is below Developer's, while clustered targets increase its total output. It performs no Work or debt cleanup and has no passive or separate debt bonus.

- Linter Agent — short-range radial defense. Rule Burst sends eight straight projectiles in fixed, evenly spaced directions without selecting an individual target. Each projectile hits one Enemy and can miss; bends and loops make more directions useful. It has no passive and performs no Work or debt cleanup.

Developer and Tester are available in Level 1. Analyst and Security are visible but locked there: Analyst unlocks after successful Level 1 completion, while Security remains a later milestone. Architect and Linter unlock milestones remain undefined. Accepting these definitions does not expand the first playable Level 1 roster. Developer and Tester retain equal specialization prices; the broader roster uses the prices in the shared stat tables.

The player-facing distinction is: **Developer:** “I personally get more done.” **Tester:** “I still contribute, but I improve what happens around me.” Both remain useful for productive work and problem defense; Developers create direct throughput, while Testers create value through placement and nearby activity.

#### Future personas

**Status: Future**

Additional personas may cover documentation, observability, governance, or other SDLC disciplines as the game expands. DevOps / Batch Processing is discarded from the current roster. Debugger / Focused Debugging is deferred and is not part of the accepted roster. Architect's earlier debt-specialist direction is superseded by its bombardment role above.

## Targeting configuration

**Status: Prototype**

Controls follow the Persona's behavior. Base, Developer, Tester and Security expose Auto / Build / Defend and a readable target priority, with closest to Product as the safe default. Architect selects Enemies only and retains its target commitment; it has no Work mode. Analyst exposes no direct-action targeting controls, while Linter fires radial volleys without an individual target. Direct target acquisition requires range and unobstructed coverage; blast and projectile collision rules belong to their abilities. Analyst's large Area and other passive coverage must remain visible for placement decisions.

The canonical mode eligibility, local priority comparison, Auto target commitment, cleanup targeting, and permitted times for changes are in [Tower Targeting and Work Modes](Core_Gameplay_Systems.md#tower-targeting-and-work-modes). This document owns the agent's configuration surface, not a separate selection algorithm.

## Stats and upgrade tuning

**Status: Prototype**

Alpha needs simple upgrades alongside permanent Persona choices. Compute pays for placement, specialization, and upgrades; [Core economy](Core_Gameplay_Systems.md#economy-compute) owns costs and refund candidates. Early Persona branches share a specialization price.

This section owns Copilot-specific stat relationships and modifiers. It does not redefine the Core Tower stat schema or copy its values.

**Status: Initial playtest baseline recorded in [Tower stats](../Tower_Base_Stats.md#tower-overview-and-playtest-stats); final balance and later upgrade definitions remain open.**

| Characteristic | Existing design constraint | Still to define |
| --- | --- | --- |
| Base work / problem output | Neutral general-purpose starting form used to upgrade into a Persona; no separate long-term Base upgrade path in Alpha. | Final balance after playtests. |
| Developer work / problem output | Persona upgrade improves both action speed and damage per action above Base and initial Tester; faster actions also increase Work throughput. | Final balance and later upgrade increments; initial Work output per action matches Base. |
| Tester work / problem output | Initial Persona preserves Base Work/damage output and cadence, adding QA Aura; lower direct throughput than Developer under equivalent modifiers. | Final balance shared with Base, and later Persona upgrade effects/increments. |
| Analyst | Passive support, large fixed Area, Work opportunities and Developer speed support; no direct action. | Final balance, generated Work template selection and later upgrades. |
| Security | Hidden-Enemy reveal and security-class damage; weaker Work output. | Final balance, explicit Enemy classifications and later upgrades. |
| Architect | Long-range, slow Enemy-only area damage with target commitment; no Work or debt bonus. | Final balance, projectile/impact timing and later upgrades. |
| Linter Agent | Short-range radial projectiles with no individual target; no Work. | Final balance, projectile travel speed and later upgrades. |
| Target range and line of sight | All targeting is local and requires unobstructed Area or Cone coverage. | Final range balance, coverage shapes, cone angles, facing controls, and later upgrade effects. |
| Quality Aura | Passive; base Enemy slow is 10%; adds Compute on productive completion; shares resolved Tower range and obstacle-blocked action coverage. Overlapping auras use the strongest effective value for each effect. Upgrades and external elements can modify ability stats. | Final balance and enhancement definitions; initial ability values and existing modifier rules are linked from the [ability specification](../Tower_Base_Stats.md#qa-aura). |
| Simple upgrades | Required alpha layer. | Purchasable effects, limits, and exact cost within economy tuning. |

Regression/debt interactions are future Tester upgrades or specializations, not base-Tester behavior. No additional upgrade effects are approved by this restructure.


## Long-Term Agent Architecture

**Status: Future architecture; Alpha boundary is Locked**

The game should be designed for the following long-term layers now and implement them later. Models, Skills, Tools/MCP connections, Instructions, Plugins, Hooks, Sub-agents, and Context are core long-term concepts, even though Alpha 1.0.0 does not require them.

- Layer 1 — Base Copilot.

- Layer 2 — Persona: permanent branch choice, such as Developer or Tester.

- Layer 3 — Specialization: Personas may later gain a small number of permanent sub-specializations. Two-way branching is the preferred starting pattern for readability and symmetry, not an architectural requirement; the number and shape must follow useful gameplay roles.

- Layer 4 — Model Profile: a lightweight operating-profile modifier applied to a Copilot. It adjusts base performance without replacing the Persona or Specialization.

- Layer 5 — Advanced capabilities: Skills, Tools/MCP connections, Instructions, Plugins, Hooks, and later Sub-agents. These define advanced capabilities beyond the Persona, Specialization, and Model layers.

- Context — a cross-cutting per-agent operational constraint that can interact with advanced capabilities rather than functioning as another identity branch.

The intended hierarchy is: **Persona defines what the Copilot is. Specialization defines how that Persona develops. Model adjusts its operating profile. Skills, MCPs, Tools, Instructions, and related systems define advanced capabilities.**

Alpha 1.0.0 only needs Base Copilot, Persona, and simple upgrades. Do not build empty or dormant versions of future systems merely to reserve space. Keep the architecture extensible enough to add the layers later without requiring them to exist in the alpha.

## Model Selection

**Status: Future**

Model Profiles are a future, lightweight stat-modifier layer applied to each Copilot. Persona remains the primary identity and Specialization remains its future development path; a Model gives that Copilot an operating edge rather than replacing either layer. Model Profiles are not required for Alpha 1.0.0.

### Model profiles

- Model Profiles make modest adjustments to base characteristics such as work speed, problem-resolution speed, range, response delay, efficiency, or complexity handling. They should not redefine a tower's role or create a strict upgrade ladder.

- Lightweight — a candidate profile favoring simple/high-throughput work and efficiency, with weaker performance on complex work.

- Balanced — a candidate broadly reliable baseline with moderate performance and efficiency.

- Heavy — a candidate profile favoring complex work at a cost in speed, efficiency, response, or another meaningful tradeoff.

### Task-model fit

A Model Profile must not be universally better because it is larger or more expensive. Effectiveness depends on task complexity, Persona role, and later advanced capabilities. Using a heavier profile for trivial work should carry a real tradeoff; a lightweight profile may struggle with complex work. This creates a “right model for the job” decision without allowing Model choice to displace Persona identity.

When Skills, MCPs/Tools, Tokens, Context, and other advanced systems are introduced, Model Profiles also affect those mechanics where appropriate: Skill effectiveness, Token cost, MCP/tool performance, context usage, cooldowns, reliability, and advanced-task effectiveness are possible levers.

### Switching models

- When Model Profiles are introduced, switching is free and unrestricted during planning.

- When Model Profiles are introduced, switching during an active wave is allowed but incurs a clear temporary downtime/reset penalty, currently described as a model reload.

- The penalty discourages constant twitch switching while preserving tactical flexibility.

## Context: Future Per-Agent Operational Constraint

**Status: Future**

Context is a core long-term, post-Alpha-1.0.0 mechanic. It is not a currency. In this proposed system, each agent has its own context load and it may interact with Models, Skills, Tools/MCP connections, and Sub-agents.

- Complex work, advanced tools, skills, and richer agent configurations increase context pressure.

- At high context load, an agent may become less efficient or need a compaction/recovery action.

- Compaction may temporarily reduce output before clearing part of the context load.

- Upgrades may raise context capacity, reduce context growth, or improve compaction efficiency.

- Future sub-agents may offload or partition context.

This system is intentionally inactive in Alpha 1.0.0. The architecture should leave a clean path to add it later, without shipping a dormant context system in the alpha.

## Future AI-Native Growth Layers

**Status: Future**

Models, Skills, Tools/MCP connections, Instructions, Plugins, Hooks, Sub-agents, and Context are core long-term AI-native concepts. Design the game and its extension boundaries for them now, then implement them after Alpha 1.0.0 rather than forcing dormant versions into the alpha.

- Skills — active or passive abilities that modify work and defense behavior.

- Instructions — passive behavioral modifiers, potentially affecting priorities, efficiency, or specialization.

- Hooks — reactive triggers that fire when specific conditions occur.

- Tools / MCP connections — capabilities or external-system style attachments that expand what an agent can do.

- Plugins — bundles or higher-level capability packages.

- Sub-agents — advanced helpers that can perform delegated work, potentially interacting with context mechanics.

- Model profiles — lightweight operating modifiers that can affect base performance and, later, advanced capabilities.

- Context — per-agent operational pressure, intentionally post-MVP.

## Open future-agent questions

**Status: Future — unresolved design**

- Exact Model reload downtime and when Model selection is introduced after the first core-loop prototype.
- Model Profile tradeoffs and effects on advanced systems; no profile is a strict universal upgrade.
- Extension boundaries for Models, Skills, Tools/MCPs, Instructions, Plugins, Hooks, Sub-agents, and Context without dormant Alpha implementations.
- Specialization branch count and shape should follow useful roles; two-way branching is a starting preference.

Global AI Token behavior and boss-prep conversion are owned by [Core Gameplay Systems](Core_Gameplay_Systems.md#ai-tokens-global-tactical-resource).

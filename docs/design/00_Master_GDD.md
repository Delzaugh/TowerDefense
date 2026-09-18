# Copilot Tower Defense — Master GDD

Design set version 1.1 · Restructured from Living GDD working version 1.0 · 2026-09-12

This is the high-level source of truth for what the game is, why its systems exist, progression direction, and Alpha 1.0.0 scope. Detailed rules belong to the documents below. The restructuring preserves the existing design; it does not turn open tuning or future concepts into approved requirements.

## Document map and ownership

| Document | Owns |
| --- | --- |
| [Core Gameplay Systems](Core_Gameplay_Systems.md) | Product health, outcome rules, work/problem flow, Compute, debt and cleanup lifecycle, the generic Tower contract, targeting and range, wave states, pause, saves, speed controls, and future shared resources. |
| [Copilot / Agent Design](Copilot_Agent_Design.md) | The Copilot Tower family: Base Copilot, Personas, Quality Aura, upgrades, stats, configuration surface, and future agent layers. |
| [Content Design](Content_Design.md) | Work and problem roster, content-specific behavior, debt's causal role, bosses, future Human Tower concepts, and supporting-character roles. |
| [Technical Architecture](Technical_Architecture.md) | Browser stack, runtime boundaries, device support, performance principles, local persistence, asset pipeline, and map-authoring workflow. |
| [Visual Asset Guide](Visual_Asset_Guide.md) | Low-poly art direction, model and material budgets, world scale, runtime asset delivery, and asset-prototyping guidance. |
| [Level 01 — Just One Small Feature](levels/Level_01_Just_One_Small_Feature.md) | Learning goals, roster availability, wave scripting, tutorial beats, debt/boss staging, Analyst unlock, debrief, and level tuning. |
| [Terminology & Glossary](Glossary.md) | Shared preferred terms, concise definitions, statuses, and pointers to the detailed rule owner. |

Use the master for vision and scope; use the owning document for detailed behavior. References and summaries do not create a second rule owner. If a detail conflicts with this master, reconcile the owning document and master explicitly. Keep Level 1 parameters separate from shared rules. Split by responsibility; add files only when a document's size warrants it. Content stays one document for now; future splits may be Work Item Design, Problem/Enemy Design, and Boss Design.

## Commitment statuses

| Status | Meaning |
| --- | --- |
| **Locked** | Agreed vision, principle, or scope boundary. Change deliberately and update affected documents. It does not imply the feature is implemented. |
| **Prototype** | Current first-playable / Alpha 1.0.0 baseline, to implement and validate through playtesting. Values explicitly called placeholders remain tunable. |
| **Hypothesis** | Unvalidated proposal, candidate, estimate, or unresolved choice. Not an implementation requirement. |
| **Future** | Direction beyond Alpha 1.0.0. Preserved for later design; no dormant alpha implementation is required. |

Status applies to the section beneath it until a more specific label overrides it. Future takes precedence for explicitly deferred concepts; candidate wording within a Future section remains tentative. Missing numbers and scripts stay open. These labels organize the source's existing commitments rather than record new approvals.


## Game Vision

**Status: Locked**

A friendly, modern, AI-themed tower defense game in which player-placed Towers—including the Copilot agent family—defend and grow a software product while work and software-development problems move through a stylized SDLC pathway. The game borrows the readability, tower variety, and strategic clarity of popular tower defense games while differentiating itself through real-world AI and software-development concepts.

The player is not only defending against threats. They are also helping productive work get completed. This creates the central identity of the game: build the product while defending it.

### Core fantasy

- The player acts as an orchestrator of AI agents.

- Copilots begin as generalists, then specialize into recognizable SDLC personas.

- Tasks, bugs, regressions, security issues, and other SDLC concepts become moving gameplay entities. Technical Debt is an accumulated liability that becomes actionable cleanup during a dedicated sprint.

- AI-native concepts such as models, compute, tokens, context, skills, tools, plugins, MCP connections, instructions, hooks, and sub-agents become future progression layers.

### Tower taxonomy

- **Tower** is the umbrella gameplay category for units or structures the player places to complete Work, resolve Problems, support other Towers, or provide another explicitly defined gameplay function.
- **Copilot** is one Tower family, not a synonym for Tower. Copilots are AI-agent Towers whose identity and progression use the Base Copilot, Persona, and later agent-capability layers.
- A **Persona** belongs to the Copilot family. Future Tower families may use different identities, properties, progression, and interactions; they do not automatically become Copilots or inherit Persona rules.
- Alpha 1.0.0 deliberately uses the Copilot family for its playable Tower roster. This keeps the first-playable scope focused without making Copilot the permanent boundary of the broader Tower system.

Human Towers are an agreed future roster direction alongside AI-agent Copilots. **Senior Developer** is a Human Tower concept with its own identity, not an upgrade or Persona of a Copilot. More Human Towers will have distinct concepts, roles, and elements. Human / Special Tower details remain future design; “special” does not yet define a separate family or a rule shared by all Human Towers. [Content Design](Content_Design.md#human-towers-and-supporting-characters) records the current concepts; [Technical Architecture](Technical_Architecture.md#tower-family-extension-boundary) owns their extension requirements.

**People Manager (Bert)** is a supporting character for the player, not a placeable element or Tower. A character's appearance or existing asset folder does not establish its gameplay category. Its supporting role remains to be refined.

## Design principles

**Status: Locked**

- Build the Product while defending it: productive work and problems both matter.
- Favor manageable active-play segments, untimed planning, and reliable stopping points.
- Keep early orchestration focused and readable; pause serves real-life interruptions.
- Use soft counters so generalists and specialists remain useful.
- Preview waves and authored routes so strategy rewards informed choices.
- Introduce tools before requiring them; teach mechanics that create distinct decisions.
- Make major unlocks answer a problem the player has just survived.
- Let the SDLC shape mechanics, not only the visuals.

The detailed planning, pause, and pacing rules are owned by [Core Gameplay Systems](Core_Gameplay_Systems.md#play-rhythm-and-interaction-principles).

## Technical Direction

**Status: Locked**

The Alpha is a browser-first, single-player game built in TypeScript with Three.js rendering, React interface components, Vite build tooling, GLB/glTF low-poly assets, and IndexedDB local persistence. It supports desktop, tablet, and phone from the first playable release. The game uses a code-first simulation and data-driven content, with Blender-authored visual assets and a future internal visual map editor after the first vertical slice validates its needs. [Technical Architecture](Technical_Architecture.md) owns the complete technical direction and boundaries.

## High-level gameplay loop

**Status: Prototype**

Plan and configure Towers → manually start an authored wave → complete moving work while resolving problems → reinvest Compute → repeat → clean up accumulated Technical Debt → prepare for the Production Incident → defeat the boss and finish resolving problems → unlock Product and reveal visual Product growth. In Alpha 1.0.0, the playable Towers are Copilots.

Completed work supports the economy, Product recovery, and visible growth. Missed work creates a delayed liability, making allocation between building and defending meaningful. The cleanup sprint offers recovery before the boss without replacing the value of delivering work on time.

## Level and campaign direction

**Status: Locked**

The primary mode uses themed software-development situations rather than one strict SDLC phase per level. Authored waves teach mechanics and tell a small story; route and wave previews support planning.

**Status: Hypothesis — theme candidates**

Just One Small Feature; Planning Day / PI Planning; Scope Creep; Legacy System; Release Friday; Hotfix Hell; Security Review; Integration Week.

**Status: Future**

A separate campaign-style SDLC mode may explicitly progress through lifecycle stages with dedicated bosses and unlocks. It is not required for the primary prototype.

## Major systems and their purpose

**Status: Prototype**

| System | Purpose | Detail owner |
| --- | --- | --- |
| Product health and visual growth | Make defense and delivered work visibly matter. | [Core](Core_Gameplay_Systems.md#what-the-player-protects-the-product) |
| Work, problems, and Technical Debt | Create competing local priorities and delayed consequences. | [Core](Core_Gameplay_Systems.md#dual-flow-work-and-problems), [content roster](Content_Design.md) |
| Tower roster and Base Copilot → Persona | Let players build a team from distinct Tower families and roles; Alpha proves the Copilot family's first progression branch. | [Agents](Copilot_Agent_Design.md#copilot-tower-model) |
| Build / Defend / Auto and Line of Sight | Give players understandable local allocation and coverage choices around map blockers. | [Core](Core_Gameplay_Systems.md#tower-targeting-line-of-sight-and-work-modes) |
| Compute | Turn successful work and defense into team investment. | [Core](Core_Gameplay_Systems.md#economy-compute) |
| Technical Debt Sprint and boss prep | Make accumulated liability actionable before the climax. | [Core](Core_Gameplay_Systems.md#technical-debt-sprint-and-boss-preparation), [Level 1](levels/Level_01_Just_One_Small_Feature.md) |


## Unlock and Progression Strategy

**Status: Locked**

Progression is milestone-based rather than time-gated.

- Major bosses and themed milestones unlock new capabilities, personas, or major system layers.

- Regular level play improves or upgrades already-known capabilities.

- Locked branches can be shown faintly from early on so players understand the future tree.

- Once a persona is unlocked, it remains available to any new base Copilot in future levels where that progression applies.

- A guiding rule: major unlocks answer the problem the player just survived.

- Completed work also contributes to persistent visual Product growth after successful levels. This campaign-scale record of delivered work is separate from persona unlocks and combat upgrades; it grants no combat-stat bonus in the prototype.

## Alpha 1.0.0 scope boundaries

**Status: Locked — scope; detailed behavior remains Prototype**

The first playable proves the dual-flow loop and the Copilot-family Base-to-Persona model in one readable map and one level, **Just One Small Feature**. It includes Base Copilot, Developer and Tester, simple upgrades, local line-of-sight-aware targeting, a Server building that blocks sight and rejects placement on its footprint, moving coding tasks, the small problem roster, Compute, Product health and visual progress, Technical Debt cleanup, the Production Incident, and the controls needed for planning, active play, saving, and pacing. Other Tower families remain outside Alpha scope. See the [Level 1 scope checklist](levels/Level_01_Just_One_Small_Feature.md#alpha-100-scope-checklist) for the full baseline.

The accepted [seven-Tower playtest baseline](../Tower_Base_Stats.md#tower-overview-and-playtest-stats) defines Base, Developer, Tester, Analyst, Security, Architect and Linter Agent, with ability-specific stats in separate sections. This broader design does not expand Level 1's playable roster. Analyst is the post-Level-1 unlock and a fully passive source of Developer support and productive Work opportunities; Security remains a later milestone. Architect and Linter unlock milestones are still undefined. DevOps / Batch Processing is discarded from this roster and Debugger is deferred. Regression and Syntax Error are excluded from Level 1.

**Status: Future**

Model Profiles, sub-specializations, Skills, Tools/MCPs, Instructions, Plugins, Hooks, Sub-agents, Context, AI Tokens and conversion, and progressive work handoffs are beyond Alpha 1.0.0. Design clean extension boundaries; do not implement empty or dormant versions of these systems in the alpha. Agent-layer details live in [Copilot / Agent Design](Copilot_Agent_Design.md); future shared token rules live in [Core Gameplay Systems](Core_Gameplay_Systems.md#ai-tokens-global-tactical-resource).

## Current design maturity

**Status: Hypothesis / open design work**

The core loop and first-level narrative spine exist. Exact wave composition, tutorial copy, content stats, economy budgets, and timing remain to be designed and tested. The [Level 1 document](levels/Level_01_Just_One_Small_Feature.md#remaining-design-and-playtest-work) collects the next scripting and playtest work. Each detailed document owns its unresolved questions. No new system is required to resolve these gaps.

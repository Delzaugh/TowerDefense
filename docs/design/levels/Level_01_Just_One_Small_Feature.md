# Level 01 — Just One Small Feature

[Master GDD](../00_Master_GDD.md) · [Core rules](../Core_Gameplay_Systems.md) · [Agents](../Copilot_Agent_Design.md) · [Content](../Content_Design.md)

Owns the complete Level 1 specification as it develops: learning goals, availability, wave script, tutorial beats, debt/boss staging, rewards, debrief, pacing, and tuning. The source provides a narrative spine, not a finished wave script. Missing compositions and values remain explicitly open below.

Statuses follow the [Master GDD](../00_Master_GDD.md#commitment-statuses). Specific labels override enclosing sections. Summaries reference shared rules rather than override them.

## Learning goals

**Status: Prototype**

- Learn to build the Product while defending it, and read the different outcomes of completed and missed work.
- Choose Developer throughput or Tester placement value; observe the visible, non-stacking Quality Aura while Tester remains active.
- Use Build, Defend, and Auto to allocate local coverage between work and problems.
- Read an Area line-of-sight preview and place around a Server building that blocks sight and cannot host a tower.
- Connect ambiguous requirements to harder work, missed tasks, debt, cleanup, and later incident pressure.
- Use wave previews and untimed preparation to plan, with reliable save opportunities.
- Survive the Production Incident and understand why upstream Product capability is the next unlock.


## Narrative spine and available mechanics

**Status: Prototype**

### Level 1: “Just One Small Feature”

A normal day-to-day development scenario that teaches the game's core decisions through a small, deliberate roster. Level 1 establishes the dual-flow loop, specialization, tower modes, upstream ambiguity, Technical Debt, cleanup, and boss pressure; it does not attempt to teach every future problem behavior.

- Available personas: Developer and Tester. Analyst and Security are visible but locked.

- Approximately 8 authored rounds, counting the Technical Debt Sprint and Production Incident encounter within that target rather than adding more tutorial waves.

- Early waves introduce basic coding tasks and Bugs. Completed tasks award Compute, heal the Product up to its fixed maximum, and add Product Progress; unfinished tasks award nothing and add +1 Technical Debt.

- Introduce Ambiguous Requirement lightly as a targetable moving enemy: while it remains active, visibly increased work makes an affected task harder to finish. Resolving it prevents its severity-based Product damage; a missed task still adds debt, connecting unclear requirements to later pressure without immediately spawning Bugs.

- Teach Developer and Tester through their core choices: Developer supplies direct throughput, while Tester's always-on, visible Quality Aura slows nearby Problems and grants bonus Compute for work completed inside the aura. No Tester-specific enemy is needed to make Tester valuable. Build, Defend, and Auto then let the player choose whether each tower works, defends, or handles visible Problems before visible work.

- Regression is removed entirely from Level 1: it does not appear in waves, spawn from another unit, or shape the debrief. Its “problems can return” mechanic belongs in a later level where recurrence is the main lesson. Syntax Error is also deferred so the first level's enemy variety does not obscure its decisions.

- Before the boss, run the Technical Debt Sprint. The player can pay down accumulated debt through cleanup, without recovering missed task rewards.

- The final boss is a contained Production Incident with authored baseline Bug spawns plus exactly one additional Bug per unresolved debt. Boss prep displays that extra count explicitly.

- The map includes at least one Server building as a deliberate, visible line-of-sight blocker. It cannot be used as a placement site; it creates a readable blind spot that the player can cover from either side. The initial Base Copilot, Developer, and Tester use Area coverage, so the level teaches obstruction before a later tower introduces a Cone.

- The post-level debrief connects unclear requirements to harder work, missed completion, accumulated debt, cleanup, and any extra incident pressure. Use the actual run totals rather than implying the player missed tasks if none were missed.

- Reward: unlock the Analyst Persona, introducing passive Developer support and productive Work opportunities from resolved uncertainty. The unlock follows successful level completion even if the player avoided all debt.

- Show Product Progress for the level and a simple visual growth reveal based on completed work. This evolution does not increase Product maximum health or other combat stats.

This level should act as a tutorial through play, not through a wall of instructions. Every introduced mechanic should create a distinct player decision; recognizing more enemy types is not a goal by itself.

## Wave-by-wave structure

**Status: Hypothesis — scripting placeholders, not an approved eight-round composition**

The source targets approximately eight authored rounds **including** the Technical Debt Sprint and boss. The table makes the six-normal-round interpretation visible without inventing spawn counts, timing, or tutorial ordering. If the final round count changes, preserve the established normal waves → Technical Debt Sprint → boss prep → boss sequence.

| Round slot | Established content / constraint | Script still required |
| --- | --- | --- |
| 1 — normal wave | Early waves introduce coding tasks and Bugs. | Exact first exposure, counts, spacing, and tutorial copy. |
| 2 — normal wave | Continue the early dual-flow introduction. | Composition and when Persona choice is first prompted. |
| 3 — normal wave | Develop the core orchestration lessons. | Composition; assign Developer/Tester and mode teaching beats. |
| 4 — normal wave | Normal-wave slot; no unique mechanic assigned yet. | Composition; choose where light ambiguity first appears. |
| 5 — normal wave | Normal-wave slot; no unique mechanic assigned yet. | Mix, pressure, reinforcement beats, and economy budget. |
| 6 — normal wave | Final normal-wave slot under this eight-round interpretation. | Composition and transition to debt cleanup. |
| 7 — Technical Debt Sprint | Technical Debt cleanup items based on actual accumulated debt; zero debt skips active cleanup with an all-clear. | Duration, cleanup work, presentation, and placement. |
| Between 7 and 8 — boss prep | Untimed preview of the boss and exact debt-Bug count; manual start and save opportunity. | Preview wording, camera/animation, and preparation UI. |
| 8 — Production Incident | Authored baseline Bugs plus finite unresolved-debt extras. | Boss stats, baseline schedule, extra-Bug schedule, and readable final burst. |

Round slots 3–6 are organizational placeholders. The source has not assigned the exact wave for Personas, modes, or Ambiguous Requirement. No Regression, Syntax Error, or AI Token content belongs in any slot.

## Tutorial beats and presentation

**Status: Prototype — teaching requirements; exact copy and wave assignment are Hypothesis**

| Beat | What play must communicate |
| --- | --- |
| First productive work | Progress while moving; only completion pays Compute, healing, and Product Progress. |
| First Bug / leak risk | Problems threaten Product health; local coverage matters. |
| Persona choice | Developer gets more done directly; Tester still contributes while its visible aura improves nearby outcomes. |
| Mode and priority changes | Build only works, Defend only handles problems, Auto handles visible problems before visible work. |
| Light ambiguity | A targetable moving Ambiguous Requirement visibly increases work while active; Analyst is not yet available or required. |
| Missed work, if it occurs | Show debt increasing without immediate Bug generation or direct Product damage. |
| Technical Debt Sprint | Build and Auto can clean up; Defend ignores cleanup. Removal pays no missed-task rewards. |
| Boss prep | State the exact additional Bug count, including zero. |
| Post-level debrief | Use actual run totals to explain the causal chain and Analyst unlock. |

Teach through play, using a small deliberate roster. Never imply that the player missed work or left debt when the run did not do so.

## Technical Debt buildup and Sprint

**Status: Prototype**

Normal waves accumulate debt from unfinished work. Use the [shared debt and Sprint rules](../Core_Gameplay_Systems.md#technical-debt-sprint-and-boss-preparation) and [cleanup targeting](../Core_Gameplay_Systems.md#tower-targeting-and-work-modes). Show accumulated debt before manual start; make cleanup progress and removed debt visible. At sprint end, preserve the unresolved total for boss prep. Saving is available between active segments, including after the Sprint.

Required scenario coverage: zero debt, some debt fully cleared, and some debt unresolved. Cleanup restores neither missed task rewards nor delivered-work totals.

## Production Incident and boss preparation

**Status: Prototype**

Use the [Production Incident specification](../Content_Design.md#production-incident). Boss prep is untimed and previews baseline danger plus exactly one Technical Debt Bug per unresolved debt cleanup item. Display the finite additional count explicitly. Early boss defeat must still release its remaining scheduled Technical Debt Bugs as the readable final incident burst; baseline spawning stops on defeat.

Example inherited from the source: enter the Technical Debt Sprint with 5 debt and clear 3; preview “Remaining Technical Debt: 2. Production Incident will generate 2 Technical Debt Bugs.”

Use the [shared victory and failure rules](../Core_Gameplay_Systems.md#what-the-player-protects-the-product). No AI Token conversion is present in this level.

## Analyst unlock, debrief, and growth

**Status: Prototype**

Successful level completion unlocks the Analyst Persona even if the player avoided all debt. Explain its fully passive role: Clear Briefing speeds nearby Developers, while Opportunity Discovery generates Work when an Unclear Requirements / Ambiguous Requirement Enemy is killed in its large Area. Analyst does not attack, complete Work directly, reduce ambiguity penalties or erase debt. Security remains locked; the wider accepted Tower roster does not change Level 1 availability. [Tower stats and abilities](../../Tower_Base_Stats.md#additional-towers) own the values.

The debrief uses actual completed-work, missed-work, debt, cleanup, and extra-Bug totals. It explains the causal chain without fabricating mistakes. Show the level's Product Progress and a simple visual growth reveal based on completed work, with no maximum-health or other combat-stat increase. Commit growth only on success; retain prior completed-level growth and permanent unlocks after failure.

## Pacing assumptions

**Status: Hypothesis**

Typical active waves may last about 3–6 minutes; the full level may take up to roughly 30 minutes including planning, cleanup, and boss. These are flexible guidelines rather than simultaneous stopwatch requirements. Six normal waves at the upper estimate would already exceed the full-level guideline, so test the combined pacing before choosing actual durations. Untimed planning also prevents a strict total-time cap.

**Status: Prototype**

Provide untimed planning and manual starts, core tactical changes during active real-time play, hard-freeze pause without tactical edits, basic speed controls, and full-state between-wave saves. [Core Gameplay Systems](../Core_Gameplay_Systems.md) owns exact control and restore behavior. Mid-wave saving is not required.

## Level-specific tuning

**Status: Hypothesis — no new numerical values approved**

| Area | Source baseline / assumption | Still to script or tune |
| --- | --- | --- |
| Layout | One readable authored path and map with a Server building that blocks sight and prohibits placement on its footprint. | Geometry, placement sites, Area coverage around the blocker, travel time, and blocker feedback. |
| Wave roster | Coding tasks, Bugs, light Ambiguous Requirement; no Regression or Syntax Error. | Counts, mixes, spacing, affected-task selection, preview text. |
| Economy | Start ~100 Compute; base ~30; specialization ~20; Bug ~5; task ~10–12; upgrade ~15–20; refund candidate ~70%. | Per-wave budget and affordability curve; canonical candidates live in Core. |
| Product | Fixed max health and capped completion healing. | Health, healing, severity damage, and growth presentation. |
| Work and Personas | Developer direct output; Tester active output plus aura. | Task work/speed and output/range/aura values with their owning documents. |
| Technical Debt Sprint | One Technical Debt cleanup item per debt; one removal per completed item; no task payouts. | Duration, cleanup work and placement, recovery feasibility. |
| Incident | Baseline spawns plus one Technical Debt Bug per unresolved debt cleanup item. | Boss behavior/stats, spawn timing, reward budget, final-burst readability. |
| Save/retry | Full-state saves between active segments; retry conditional. | Exact save boundaries and restore state, reward-duplication prevention. |
| Tutorial and debrief | Teach through play; reflect actual run totals. | Exact prompts, triggers, wave assignments, and debrief layout. |


## Alpha 1.0.0 scope checklist

**Status: Locked — Alpha scope; numerical implementation and tuning remain Prototype / Hypothesis**

The prototype should resist feature creep. The purpose is to prove the dual-flow loop and the Base-Copilot-to-Persona model within the Copilot Tower family. Level 1 does not need another Tower family to prove that model.

- One readable map and one level: Just One Small Feature.

- Fixed-maximum Product health, completion-based healing, and clear failure/victory conditions.

- Base Copilot tower.

- Developer and Tester persona branches.

- Clear first-prototype persona contrast: Developer has higher direct work and problem-solving throughput; Tester remains an active tower with lower direct throughput and a non-stacking, visible Quality Aura that slows nearby Problems and grants bonus Compute for nearby completed productive work.

- Build / Defend / Auto targeting modes with local, line-of-sight-aware target selection: Build selects only visible work, Defend selects only visible Problems, and Auto prefers visible Problems before visible work.

- Area line of sight for the initial Base Copilot, Developer, and Tester, including a readable Server-building blind spot and placement rejection on that building's footprint. Cone line of sight is supported by the shared tower data but is not required to teach Level 1.

- Configurable basic target priority within each tower's range, plus a short Auto target commitment window to prevent target-switching jitter.

- Moving coding tasks with completion progress and all-or-nothing rewards: Compute, Product healing, and Product Progress.

- A visible Product Progress total and simple post-level visual growth based on completed work, without combat-stat benefits.

- A level-local Technical Debt counter: +1 per unfinished productive work item, with no immediate Bug spawn.

- A time-limited pre-boss Technical Debt Sprint with actionable cleanup, debt removal, and no retroactive task rewards.

- A small Level 1 problem roster: Bug, a lightly introduced targetable moving Ambiguous Requirement that increases task work while active, and the Production Incident boss. Regression is deliberately excluded from Level 1 and deferred to a recurrence-focused later level; Syntax Error and other roster concepts can also wait. Technical Debt is a separate consequence/cleanup mechanic.

- Compute economy.

- Untimed between-wave preparation and reconfiguration, manual wave start, focused active-wave orchestration controls, hard-freeze non-tactical pause, and reliable full-state saves between waves.

- Wave preview.

- Boss prep state with explicit unresolved-debt preview and exactly one extra boss Bug per remaining debt.

- Basic speed controls.

AI Tokens and their boss-prep conversion, Model Profiles, Skills, MCP connections, Tools, Instructions, Plugins, Hooks, Sub-agents, Context, and progressive handoff quality are core long-term concepts but are not required for Alpha 1.0.0. Design for them now; implement them later. Do not build empty or dormant versions of those systems for the alpha. Token collection does not appear in Level 1. Analyst is the post-Level-1 Persona unlock, with its passive Developer support and Work-opportunity role established by the level and debrief.

## Remaining design and playtest work

**Status: Hypothesis — remaining scripting and validation work, not new system approval**

Fully script the first playable level. Define the exact behavior of its deliberately reduced enemy/work roster, the two available personas, local line-of-sight-aware targeting and Auto commitment, the Server building's placement and blocking shapes, round-by-round composition, tutorial messaging, economy pacing, fixed Product health and healing, Technical Debt Sprint, and Production Incident boss. Include the Ambiguous Requirement → harder work → missed task → debt chain, the explicit Technical Debt Bug preview, the Tester Quality Aura's visible coverage and non-stacking effects, the full-state save points between waves, and the post-level Product growth reveal and Analyst Persona unlock. Do not add Regression to Level 1; reserve it for a later recurrence-focused level. Keep Alpha 1.0.0's architecture extensible for future AI-native layers without implementing dormant systems.

Use the first playtest to check recovery after early missed work, whether debt cleanup is clear and achievable, whether normal completion remains preferable to deliberate deferral, and whether both personas contribute throughout Level 1. Check that Developers feel like the direct-output choice, that Testers remain active while their aura makes placement meaningfully valuable, and that overlapping auras are visibly non-stacking. Check that the Server building's blocked footprint and blind spot are readable, and that Auto clearly prioritizes visible Problems, then work, without jitter or an unexpected map-wide override. Check the 3–6 minute active-wave guideline, the full-level pace, and saving/loading between waves without state drift or duplicated rewards. Also check zero-debt, fully-cleared-debt, and unresolved-debt runs, including their displayed boss consequences. This turns the design skeleton into something that can be prototyped and tested without adding further systems.

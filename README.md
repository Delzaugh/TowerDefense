# Copilot Tower Defense

A browser-first, single-player game about completing productive Work while defending the Product from Problems.

## Project map

- [Design](docs/design/00_Master_GDD.md): vision, gameplay rules, Alpha scope, and open tuning.
- [Technical architecture](docs/design/Technical_Architecture.md): TypeScript, Three.js, React, Vite, and runtime ownership.
- [Codebase structure](docs/Codebase_Structure.md): folder responsibilities, dependencies, asset delivery, and verification plan.
- [Game application](game/README.md): unified test map and development commands.
- [Tower and Copilot properties/stats](docs/Tower_Base_Stats.md): shared Tower contract, Copilot extension, implemented fields, and future code boundaries.
- [Unified test map](docs/Unified_Test_Map.md): the single testing system for gameplay, geometry, timing and local saves.
- [Implemented foundation](docs/Foundation_Implementation.md): current coverage, engineering decisions, and remaining work.
- [TypeScript gameplay plan](docs/TypeScript_Gameplay_Implementation_Plan.md): phased headless gameplay implementation, dependencies, and acceptance tests.
- [Encounter batch 01](docs/Encounter_Batch_01.md): implemented traffic/consequence rules and hands-on test-app instructions.
- [Encounter batch 02](docs/Encounter_Batch_02.md): tower placement, targeting, actions and test recipes; [detailed plan](docs/Encounter_Batch_02_Plan.md).
- [Assets](assets/README.md): registered runtime models and their versioned Blender sources.
- [Asset pipeline](tools/asset-pipeline/README.md) and [Asset Inspector](tools/asset-inspector/README.md): existing production and review tools.

The application provides one unified map for Work/Problem traffic, tower placement/targeting/actions, geometry/sight diagnostics, rewards, health/debt, timing and local saves. The [mechanics guide](docs/Test_Map_Mechanics.md) covers selected-tower settings, drag aiming, editable wave queues and repeatable custom runs. It is an engineering fixture, not a playable Level 1. The Asset Inspector remains separate for registered-model review.

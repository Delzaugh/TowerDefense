# Copilot Tower Defense

A browser-first, single-player game about completing productive Work while defending the Product from Problems.

## Project map

- [Production foundation and build plan](docs/Production_Foundation.md): review of the campus, simulation prototype and tested game core; staged path to the actual game.
- [App startup implementation plan](docs/App_Startup_Implementation_Plan.md): implemented boot architecture, campus home, recovery, file ownership and acceptance evidence.
- [Design](docs/design/00_Master_GDD.md): vision, gameplay rules, Alpha scope, and open tuning.
- [Technical architecture](docs/design/Technical_Architecture.md): TypeScript, Three.js, React, Vite, and runtime ownership.
- [Codebase structure](docs/Codebase_Structure.md): folder responsibilities, dependencies, asset delivery, and verification plan.
- [Game application](game/README.md): campus home, diagnostic test map and development commands.
- [Tower and Copilot properties/stats](docs/Tower_Base_Stats.md): shared Tower contract, Copilot extension, implemented fields, and future code boundaries.
- [Unified test map](docs/Unified_Test_Map.md): the single testing system for gameplay, geometry, timing and local saves.
- [Implemented foundation](docs/Foundation_Implementation.md): current coverage, engineering decisions, and remaining work.
- [TypeScript gameplay plan](docs/TypeScript_Gameplay_Implementation_Plan.md): phased headless gameplay implementation, dependencies, and acceptance tests.
- [Encounter batch 01](docs/Encounter_Batch_01.md): implemented traffic/consequence rules and hands-on test-app instructions.
- [Encounter batch 02](docs/Encounter_Batch_02.md): tower placement, targeting, actions and test recipes; [detailed plan](docs/Encounter_Batch_02_Plan.md).
- [Assets](assets/README.md): registered runtime models and their versioned Blender sources.
- [Asset pipeline](tools/asset-pipeline/README.md) and [Asset Inspector](tools/asset-inspector/README.md): existing production and review tools.

The application opens to a responsive 3D campus home with loading/recovery, camera controls and saved motion settings. Run `npm run dev` in `game/` and open `http://127.0.0.1:5173/`. The diagnostic map remains at `#/lab`, covering Work/Problem traffic, placement/targeting/actions, geometry/sight, timing and local saves. The [mechanics guide](docs/Test_Map_Mechanics.md) covers its editable waves and repeatable runs. A playable Level 1 remains future work. The Asset Inspector remains separate for registered-model review.

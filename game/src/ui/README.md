# Player interface

The reusable Field kit lives in `toolkit/`. Import its public components from `toolkit/index.tsx`; keep screen layout, commands, navigation, input routing and game state in screen modules. React reads session view data and issues commands; it never advances the simulation.

Read the [UI Field kit contract](../../../docs/design/UI_Field_Kit.md) for components, tokens, theme ownership, inspection composition and the extension workflow. Future agents should use [tower-game-ui](../../../.agents/skills/tower-game-ui/SKILL.md) when changing game UI.

From `game/`, run `npm run storybook` for live component states, appearance, motion, viewport and accessibility tools on port 6006. `npm run verify:ui` checks the built workshop; real camera, world input and menu focus behavior still require the affected game screen checks.

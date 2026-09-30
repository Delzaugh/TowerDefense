---
name: tower-game-ui
description: Build, extend, refactor or review Tower's React game menus, HUD and Primer-inspired Field kit components. Use for reusable controls, themes, game chrome, inspection layouts, responsive UI, Storybook states and UI regression checks. Excludes 3D model production and unrelated websites.
---

# Tower game UI

Read `docs/design/UI_Field_Kit.md` from the repository root before editing UI. It is the component and composition contract. Inspect the affected exports in `game/src/ui/toolkit/index.tsx`, their CSS and corresponding `game/stories/` examples. For world/input integration, inspect the consuming screen and its relevant browser tests.

## Implement

- Import the toolkit barrel and reuse its controls, semantic tokens and Octicons. Keep authored world colors separate from menu theme tokens. Support Light (default), Dark and System through the existing provider; do not introduce another theme store.
- Keep screen layout, real commands, selection, game data, navigation, dialog focus and input routing in the screen. Shared components accept presentation props and caller-owned state. The toolkit must not import app, rendering, session, simulation, content, progression or persistence modules.
- Compose existing controls for screen-specific arrangements. Promote stable repeated roles, not whole screens or speculative abstractions. When changing public props or tokens, migrate all consumers and update the design contract together.
- Preserve game-first composition: immediate actions, current location, visible world/model and useful utility controls. Do not add website navigation or unsupported account/campaign features.
- Keep labels, native keyboard behavior, focus visibility, disabled/pressed states and 44px targets. Checkbox/radio wrappers provide the labeled hit area. Use meaningful text or icon cues alongside color.
- Ambient layers remain decorative and input-transparent. Pass the game's reduced-motion preference; preserve OS handling. Check model framing and pointer overlays in the real screen rather than treating the workshop as a renderer test.

## Document and verify

Add or update stories when changing a shared component's supported states or behavior. Stories import the actual public component, use local illustrative state and stay outside production `src/`. Cover relevant disabled, selected, pending, invalid and long-content states; use workshop Appearance, Motion and Viewport tools rather than copying component CSS into stories.

From `game/`, run `npm run verify:ui` for shared component changes. For runtime UI changes also typecheck, lint, build and run the relevant game browser cases. Test affected screen focus, scrolling, touch/keyboard input, world-event interception and model framing. Use deployment checks when routing, assets or hosting change. Documentation-only edits need link/contract review, not the entire gameplay suite.

Update `docs/design/UI_Field_Kit.md` when changing the public contract, ownership or extension workflow. Report concrete changes, checks and any unverified screen/device behavior. Storybook and CI support reuse; neither alone proves that a screen works as a game.

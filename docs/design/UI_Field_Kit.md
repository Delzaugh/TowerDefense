# Tower UI Field kit

The Field kit is the reusable interface system for Tower's React menus and HUD. Its visual vocabulary comes from GitHub / Primer: Mona Sans, Octicons, restrained surfaces, clear focus, semantic color and precise spacing. The world, characters, mission context and camera remain central. This guide records the implementation contract; Storybook provides live examples of it.

## Sources and ownership

| Source | Owns |
| --- | --- |
| `game/src/ui/toolkit/index.tsx` | Public component exports and native control composition |
| `game/src/ui/toolkit/*.css` | Shared semantic tokens, control states, chrome and decorative layers |
| `game/src/ui/` screen modules and screen CSS | Screen layout, content, commands, selection, dialogs and input routing |
| `game/stories/` | Examples using the actual toolkit, with illustrative local state |
| `game/.storybook/` | Development workshop configuration and theme/motion/viewport tools |
| `game/tests/ui/` | Component interaction, accessibility and responsive regression checks |
| `.agents/skills/tower-game-ui/SKILL.md` | Implementation workflow for future agents |

Import shared components from the toolkit barrel. A toolkit component may depend on React, Octicons and its own presentation helpers. It must not import app routing, renderers, session state, simulation, content, progression or persistence. Resolved import checks enforce that boundary and prevent production code from importing stories or Storybook. Theme storage is the existing appearance adapter owned by the toolkit, not gameplay persistence.

React reads view data and issues commands. It never advances the simulation. Screens own real action availability, focus restoration, Escape behavior, pointer capture and whether a UI event should reach the game world. Examples do not create a game session or load WebGL models; check those integrations in the running game.

## Visual contract

- Light is the default. Dark and System are supported through the same semantic tokens. Use `--ui-bg`, `--ui-surface`, `--ui-raised`, `--ui-fg`, `--ui-muted`, `--ui-border`, `--ui-accent`, `--ui-accent-soft`, `--ui-primary`, `--ui-primary-hover`, `--ui-on-primary`, `--ui-positive`, `--ui-attention`, `--ui-danger`, `--ui-on-danger`, `--ui-shadow`, `--ui-radius`, `--ui-focus` and `--ui-backdrop`. Add a semantic token only when the existing role cannot express the need; define it in both themes. `--ui-on-danger` supplies readable text on filled danger states rather than reusing the primary foreground.
- Mona Sans is the interface font. Shared controls use 6px corners; surfaces use the 8px radius token. Buttons and text/select controls have a 44px minimum height. Checkbox/radio wrappers supply the 44px labeled hit area. Coarse-pointer text inputs use 16px text.
- Green identifies the next meaningful action; blue identifies selection, focus and inspection information. Danger actions require clear words. State must remain understandable through text, shape or icon, not color alone.
- Use Octicons for familiar actions and utilities. Give icon-only controls an action label. Keep tower portraits, authored maps and game-specific imagery in the presentation layer.
- World text uses `--ui-world-fg` / `--ui-world-muted`, which remain light in both themes. Theme switching does not recolor authored world lighting or imply a gameplay change. Decorative world fixtures can use authored colors; reusable menu surfaces use tokens.
- Keep the game location and immediate actions prominent. Avoid website navigation tabs, breadcrumbs, fabricated accounts, activity feeds or dashboard furniture. Add only actions supported by the current game.
- Respect the game's reduced-motion preference and `prefers-reduced-motion`. Ambient layers stay behind content, carry `aria-hidden`, and never intercept input or imply actual attack range.

## Public components

| Component | Use and caller responsibilities |
| --- | --- |
| `Button` | Primary, secondary, quiet or danger actions. Native attributes, events and refs pass through; default type is `button`. Caller owns pending text, `aria-busy`, disabled availability and pressed state. |
| `IconButton` | Compact utility action with a required `aria-label`; same native behavior as Button. |
| `Surface` | Nonsemantic panel appearance. Caller owns layout. Use `className="ui-surface"` on `section` / `aside` when those semantics fit. |
| `Input`, `Select` | Native controls with shared appearance. Caller supplies labels, values, validation, helper text and described-by relationships. Checkbox/radio Input gets `.ui-checkbox`. |
| `SegmentedControl` | A labeled group of pressed buttons controlled by `value` and `onChange`. Supports disabled groups/options. It is not a tablist; Tab, Space and Enter retain native button behavior. |
| `StatGauge` | Accessible noninteractive meter, optionally segmented. Use `showValue={false}` and meaningful `valueText` for qualitative capability displays. Caller supplies balance values and captions. |
| `StatusBadge` | Neutral, positive, attention or danger state label. Does not automatically announce updates. Caller owns live status semantics. |
| `ThemeProvider`, `useTheme`, `ThemePicker` | One application provider; exposes preference, resolved appearance, setter and storage notice. The labeled picker displays storage failures while remaining usable. |
| `GameTopBar` | Leading escape/wordmark, centered location and optional activity context, trailing utility actions. Owns alignment and safe-area padding, not navigation or modal state. |
| `PageAtmosphere` | Ambient light and lattice behind a whole menu page; separate from model backgrounds. |
| `ModelPreviewBackdrop` | Decorative SVG planes, grid and light traces inside a model card, with instance-safe IDs. |

The appearance adapter stores `tower.ui.appearance.v1`, synchronizes tabs, follows OS changes in System mode, and falls back to Light when storage is unavailable. The initial game HTML applies the same preference before React loads. Keep that bootstrap and provider contract aligned if appearance storage changes.

```tsx
import { ArrowLeftIcon } from '@primer/octicons-react';
import { Button, GameTopBar, Surface, ThemePicker } from './toolkit';

// The screen supplies a real action and owns the resulting navigation/focus.
<GameTopBar
  leading={<Button variant="quiet" onClick={returnToHub}><ArrowLeftIcon /> Back to Hub</Button>}
  location="Copilot Lab"
  context="Tower inspection"
  trailing={<ThemePicker className="ui-game-topbar__appearance" />}
/>
<Surface className="my-screen__panel">{/* Screen-specific content */}</Surface>
```

## Screen composition contracts

`GameTopBar` has a shared `--ui-topbar-height` of 72px plus the top safe area. Reserve it when laying out content under the header. `presentation="surface"` uses themed surfaces; `presentation="world"` preserves the scene behind fixed light world text. Secondary context and visual Escape hints collapse on small screens while actions and accessible labels remain available. Hub and Tower inspection share this chrome; each keeps its actual actions and input behavior.

Tower inspection's capabilities panel fills the desktop preview row instead of resizing with the selected Tower's text. Its heading stays fixed and long content scrolls inside its body. Stacked phone and landscape views have bounded, consistent panel sizes. The selection roster spans the full screen composition and keeps predictable card heights across collections. These are inspection layout responsibilities, not universal Surface dimensions.

The inspection canvas fills its preview card. Title and camera controls overlay it; title decoration passes pointer input through, controls retain their own hit targets. Close zoom clips at the card's outer edge instead of an invisible inner viewport. Camera limits, model bounds and renderer disposal belong to the inspection presentation code. Storybook cannot establish those properties.

Use `PageAtmosphere` behind the whole page and `ModelPreviewBackdrop` inside the model card. Pass `animated={!reducedMotion}` to both; OS media queries also stop their animations. Avoid adding extra WebGL scenes or art downloads for menu decoration.

## Workshop

From `game/`, on the project's Node 24 runtime:

```powershell
npm ci
npm run storybook
```

Open `http://127.0.0.1:6006/`. The workshop includes the overview, button states, labeled/invalid/disabled forms, interactive selection, gauges and badges, inspection/world headers, phone/landscape examples, and ambient layers. Use Appearance (Light/Dark/System), Motion (OS or Reduced), Viewport, Controls and Accessibility. The appearance toolbar initializes the real provider; the ThemePicker remains interactive until the toolbar preference changes. Workshop preferences are scoped to its localhost origin.

`npm run build:storybook` creates `game/storybook-static/`; `npm run preview:storybook` serves it on port 6007. This is a separate development artifact. The game build and Pages packager use `dist/` and do not include the workshop. Stories and configuration stay outside production `src/`, and use their own Vite configuration without game asset packaging plugins. No account or external visual-testing service is required.

## Changing the system

1. Check the existing component and its story before introducing a new pattern. Compose an existing control and screen CSS when only layout differs.
2. Promote a component when it represents a stable, repeated interaction or visual role. Keep props about presentation/native behavior; pass caller-owned state and commands. Avoid copying whole screens into the toolkit or building a generalized menu framework in advance.
3. Add stories for meaningful supported states: disabled/unavailable, selected, pending or invalid where applicable, longer content, both themes and relevant narrow layouts. Use the real component; keep fixtures clearly illustrative and outside gameplay definitions. State changes should be reviewable by interaction, not only hard-coded screenshots.
4. When changing a public prop, token or behavior, update consumers, this contract and the relevant stories together. Prefer additive changes; remove obsolete exports only after all callers move. Don't retain duplicate legacy styles to hide a migration.
5. Run focused checks and inspect affected real game screens. Record intentional behavior changes in the commit. Review the Accessibility panel alongside keyboard focus and pointer behavior; automation cannot decide whether a game action or composition makes sense.

## Stability checks

`npm run verify:ui` typechecks and lints workshop sources, checks resolved module boundaries, builds Storybook, and runs Playwright against the built workshop. It checks keyboard activation and pressed/disabled states, labeled forms, real theme storage/System changes, game/OS reduced motion, input-transparent decoration, 44px targets, horizontal fit at 320/844/1600px, runtime errors and axe WCAG A/AA findings in both themes. It also checks that docs and workshop controls render.

`.github/workflows/ui-toolkit.yml` runs these checks on relevant pushes and pull requests, then builds the production game. Traces and the built workshop are retained as workflow artifacts. Generated workshops, browser traces and screenshots are ignored by Git. Automated checks catch semantic, interaction and layout regressions; they are not approved visual baselines or proof of physical-device performance.

For runtime UI changes also run `npm run typecheck`, `npm run lint`, `npm run build`, and the relevant cases in `tests/e2e/`. Test camera/input layering, modal focus, long capability content, model framing and scrolling in the game. Run deployment checks when touching asset loading, routing or static hosting. A documentation-only edit does not require a full gameplay suite.

## References

- [Primer accessibility foundations](https://primer.style/accessibility/foundations/) and [design guidance](https://primer.style/accessibility/design-guidance/)
- [Storybook React + Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite), [globals](https://storybook.js.org/docs/essentials/toolbars-and-globals) and [viewports](https://storybook.js.org/docs/essentials/viewport)
- [Technical architecture](Technical_Architecture.md) for simulation/presentation ownership; [visual asset guide](Visual_Asset_Guide.md) for authored 3D assets

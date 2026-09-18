# Map-first test workspace

Updated 2026-09-13. Open the [test app](http://127.0.0.1:5173/).

- Desktop uses the full window width and a viewport-height map, with a separately scrollable 320px sidebar. Selecting a tower reveals its inspector without moving the map. Narrow screens stack the controls below the map.
- The large introduction and **New tower defaults** section are removed. New towers start as Area Base Copilots; select a placed tower to change coverage, facing, Mode or Priority.
- Click/tap the map to place. Keyboard users can focus the map, move the cursor in half-unit steps with arrow keys and press Enter to place; tower buttons provide selection access. Map click/drag and Cone aiming remain supported.
- **Edit wave queue** opens a native modal dialog. The background is inert, focus stays in the dialog, Done/close or Escape dismisses it, and focus returns to the opener. Closing does not discard draft rows. Applying remains explicit and follows the existing preparation/reset rules; opening the dialog does not pause the simulation.
- Sight/target diagnostics and event/JSON diagnostics are collapsed by default. Run, pause, stepping, saves and captures remain available in the sidebar.
- Selected towers now have a collapsed **Base stats & tuning** section for range, millisecond action interval, damage/work output and target commitment, plus type-defined cost/footprint readings. See [Tower and Copilot core properties and stats](Tower_Base_Stats.md).

## Millisecond intervals

Wave rows use **Interval (ms)**, while Start remains in seconds. Enter values such as 100, 250 or 1000. Each row displays the effective milliseconds/ticks: the 60 Hz simulation rounds to the nearest tick (approximately 16.667 ms). For example, 125 ms becomes 8 ticks / 133.333 ms; intervals below half a tick become simultaneous bursts. Fractional millisecond input is accepted, and invalid/out-of-range input blocks Apply. Presets retain their original timing (one second is now shown as 1000 ms).

Recipes and saves continue to store integer ticks; no schema or storage migration is needed. Displayed millisecond values round-trip to the same tick counts. Tests cover every supported tick interval, rounding boundaries, invalid input, preview, export and saved reload on desktop/touch.

## Ten-tower fixture

The unified map now starts with **300 Compute** at **30 per tower**, and has an authored **ten-tower cap**. This removes the old three-tower starting-budget restriction without changing historical headless fixtures or the global 100-tower safety bound. The core enforces the content-specific cap on placement and snapshot restoration, including when rewards would otherwise fund more towers.

Health, rewards and traffic are unchanged. With the default queue, no towers leave 300 Compute; one Area Base at (-5, 0) finishes with 304 Compute. Both health presets support ten towers. Blueprint reconstruction and full-state saves preserve all ten.

The map content revision is now `v05` for path-safe Tower placement. Saves use separate `tower-test-map-standard-v5` / `tower-test-map-fragile-v5` databases, save envelope version 4 and encounter content/snapshot/rules version 5. Earlier v1–v4 and foundation databases are untouched, not migrated or overwritten automatically.

## Verification

`npm run verify`: 229 core/integration tests, 36 desktop/touch-emulated browser cases, types, lint, module boundaries and production build. Coverage includes base properties and tuning, authored path clearance, ten placements, eleventh rejection, restore/cap validation, desktop map dimensions, inspector visibility, absence of defaults, keyboard placement, modal focus containment/return, Escape and retained drafts. Screenshots cover the workspace, stats panel and phone-sized dialog. Physical-device performance is not claimed.

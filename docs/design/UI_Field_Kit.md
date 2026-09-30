# Field kit game chrome

`game/src/ui/toolkit/GameTopBar.tsx` is the shared game header. It takes caller-owned `leading`, `location`, optional `context`, and optional `trailing` content. It owns visual alignment, safe-area padding, responsive context labels, and 44px control targets. It does not own routes, global game state, menu behavior, or settings state.

Use the leading slot for the current screen's escape action or game wordmark. Keep the game location centered, with a short secondary activity label when useful. Put a few real utility actions in the trailing slot. Do not add web navigation tabs or breadcrumbs. `presentation="surface"` uses appearance-aware Field kit surfaces; `presentation="world"` keeps the authored scene visible and uses the fixed light world text colors.

Hub uses its Copilot Tower Defense wordmark, centered Copilot Hub context, and the existing ambience and Settings actions. Lab inspection uses the real Back to Hub action with its Escape hint, centered Copilot Lab / Tower inspection context, and the existing Appearance picker. Returning from inspection and the settings dialog retain their existing focus behavior. Camera controls remain separate from the header and the campus remains the primary subject.

The shared `--ui-topbar-height` is 72px plus the top safe area. Screens can reserve this space when placing world content. Secondary context and the Escape visual hint collapse on small screens while their actual controls and behavior remain available. All appearance comes from shared semantic tokens; the header preserves the user's saved Dark, Light, or System preference.

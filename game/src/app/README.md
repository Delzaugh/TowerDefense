# Application composition

React shell, screen navigation, settings, and wiring of the session and browser adapters. Own session creation/disposal without putting simulation ticks in React rendering. See [module boundaries](../../../docs/Codebase_Structure.md#runtime-ownership-and-dependencies).

- `App.tsx` selects lazy home or lab screens using `routes.ts` and catches screen import/render failures. Hash navigation works on static hosts; legacy diagnostic query URLs remain supported.
- `boot/createHomeBoot.ts` owns a single cancellable attempt, timeout, progress and state (`loading`, `ready`, `error`, `fallback`). Generation checks discard stale results and dispose abandoned scenes.
- `home/HomeScreen.tsx` connects boot to the canvas, ResizeObserver, browser visibility, OS motion preference and optional local settings. Retry creates a fresh canvas for context-loss recovery.
- `home/HomeView.tsx` renders the responsive home, controls, loading/recovery and accessible settings dialog. Its CSS stays inside `.home-screen`.
- `LabScreen.tsx` owns the existing diagnostic session composition and query controls. `EncounterLab.tsx` retains its gameplay UI; `styles.css` stays inside `.lab-screen`.

The home depends on the small `CampusScene` interface and dynamically imports its renderer. Home creates no encounter session. The HTML entry provides recovery even when the first JavaScript bundle cannot download. See [the detailed startup plan](../../../docs/App_Startup_Implementation_Plan.md).

# App startup and campus home implementation plan

24 September 2026. Scope requested: the real application starts, boots, loads and presents its home screen. This milestone moves home before the first playable encounter, superseding the order of batches 1–2 in [Production Foundation](Production_Foundation.md). Gameplay expansion remains a later milestone.

## Definition of done

Opening the production URL shows an immediate branded startup surface, loads the application and selected campus assets, and reaches a usable responsive home screen. The home displays the established seven-tile 3D campus, lab and Copilot. Camera presets, zoom/reset, ambience and motion preferences work. Loading reports real progress. Failed loading or unavailable WebGL produces clear recovery choices. A user can reach the home interface without 3D if their device cannot render it.

The existing gameplay harness remains available through an explicit diagnostic route. Loading home does not construct an encounter, open its save database, or fetch its screen bundle. Production and diagnostic styling cannot affect one another after navigation. Nothing in this milestone claims a playable mission, campaign Continue, real account or saved campaign that does not yet exist.

## Architecture decisions

1. Keep one application/package under `game/`, using the existing React, Vite, TypeScript and asset adapter. Add a pinned Three.js dependency matching the prototype's revision 180; use package imports rather than inspector vendors.
2. Separate startup, screen routing, presentation and preferences. The application root chooses a lazy screen; the home owns a boot controller; a renderer factory owns WebGL resources. No simulation session runs on home.
3. Use hash routes for a static-host-compatible first shell: default or `#/` is home, `#/lab` is the diagnostic harness. Preserve legacy `?lab=...` aliases when no explicit hash exists and preserve the existing `preset`/`fixture` semantics. Explicit home wins over leftover lab query parameters. Unknown routes display a recovery link.
4. Keep the existing lab UI and save namespaces. Move its former root composition into a lazy `LabScreen`, scope lab CSS, and provide a return-home link. Navigation disposes the existing lab session through its current lifecycle.
5. Port the existing layout as typed data into `content/maps/campusHome.ts`, and reference it from `rendering/campus/`. Do not import prototype code in the production module graph. Pin the actual 25 campus models at v01 and Copilot at v02 through `tower-asset:` imports; unused prototype kit pieces stay out of the app.
6. Preserve the seven-tile layout, 132 static placements, authored scale, dusk palette, isometric framing and camera/input language. Include one Copilot with its authored idle animation. Additional guest routines, steam, prototype performance UI and gameplay simulation are outside this startup milestone.
7. Home controls are real camera/settings actions. Future missions may be identified as unavailable; never wire a Play/Continue action to an engineering fixture without labeling it. Keep diagnostics separate from the player-facing home controls.

## Code responsibilities

| Location | Responsibility |
| --- | --- |
| `index.html`, `src/main.tsx` | Immediate startup fallback, module/render error recovery, document metadata and React mounting. |
| `src/app/App.tsx`, route helper | Hash navigation and lazy screen selection; no gameplay or scene implementation. |
| `src/app/boot/` | Abortable boot state, progress, timeout, retry, stale-attempt protection and exactly-once scene disposal. |
| `src/app/home/HomeScreen.tsx` | Compose boot, canvas, browser visibility/motion signals and preferences. |
| `src/app/home/HomeView.tsx`, home styles | Responsive branded home, loading/recovery, camera toolbar and accessible settings. |
| `src/app/LabScreen.tsx`, scoped lab styles | Preserve the diagnostic UI/query behavior and isolate its styles. |
| `src/persistence/homePreferences.ts` | Small versioned local preference record; malformed/unavailable storage uses defaults without blocking boot. No campaign state. |
| `src/content/maps/campusHome.ts` | Pure versioned campus composition in metres; no Three.js/DOM imports. |
| `src/rendering/campus/` | Explicit asset bindings, abortable loading, owned scene/camera/input/animation and GPU cleanup. |
| `src/rendering/campus/types.ts` | Small renderer lifecycle/control interface consumed by app code. |
| `build/` | Existing catalog delivery plus selected dependency license notices. |
| `tests/integration/`, `tests/e2e/` | Boot lifecycle/failure tests, preference/routing checks, real browser home and retained lab behavior. |

## Startup sequence

1. HTML paints a lightweight branded loading message without waiting for WebGL, assets or IndexedDB. A no-script message explains JavaScript is required; an initial module-load failure offers reload rather than an endless spinner.
2. React mounts, reads the URL and lazily imports the selected screen. Screen-import/render failures stay within an application recovery boundary.
3. Home reads preferences with defaults and subscribes to reduced-motion and document-visibility changes. Preference I/O is optional; it cannot block the home.
4. A new boot attempt receives an AbortController and unique generation. It imports the renderer, creates a context, then fetches only pinned campus GLBs. Loading concurrency is bounded. Progress counts completed assets; it is not an artificial timed percentage.
5. Parsed models form the campus scene, sharing repeated static geometry/materials. The first draw must complete before the boot publishes `ready` and enables camera controls.
6. Home starts ambience only when allowed by its settings, OS reduced motion and page visibility. A hidden page submits no ongoing animation; resuming resets elapsed-time accumulation.
7. Leaving home, retrying or disposing aborts in-flight fetches and releases scene resources. Late parse/import completion from an abandoned attempt cannot replace a newer state; any late-created scene is disposed.

Boot states are `loading`, `ready`, `error`, and user-selected `fallback` home. A bounded startup timeout produces a recoverable error and aborts work. Retry always starts a fresh attempt. WebGL context loss becomes a recoverable error; no automatic endless retry loop.

## Renderer contract

The factory is asynchronous: `createCampusScene(canvas, options): Promise<CampusScene>`. Options carry an AbortSignal, progress/error callbacks and initial pause/reduced-motion settings. The returned handle supports selecting `home | top | front | left`, zooming, resetting the current view, updating pause/reduced motion, resizing and idempotent disposal. A view callback reports selected preset and zoom for the UI.

The scene owns canvas pointer/wheel events, a bounded 30 FPS presentation loop, Three.js objects and explicit resource disposal. React owns screen mounting, UI, ResizeObserver and browser visibility/motion subscriptions. Fetch uses the attempt signal; parse completion checks cancellation. Shared geometries/materials/textures are disposed once per scene ownership set; actor skeletons and mixers are released too. The renderer must tolerate React StrictMode's development mount/unmount cycle.

Camera coordinates follow the prototype: target `(0,1.6,0)`, home azimuth `.78`, elevation `.64`, span `87`, minimum narrow-view width `129`; top span `108`; front elevation `.58`; left azimuth `-.85`, elevation `.68`. Pan is bounded, zoom spans `.7–10`, reset restores pan/zoom, and Ctrl/Cmd-wheel remains browser zoom. The canvas has a useful accessible name; visible camera controls provide keyboard alternatives to pointer gestures.

## Interface and failure behavior

- Reuse the established Copilot branding, cool dusk background, mint accents, campus title and lab card. Mobile layout must reserve space for the scene, header and controls without horizontal overflow; short landscape layouts may scroll.
- Expose loading text and an accessible progress indicator. Keep controls disabled until a scene exists. Error copy describes what the player can do and offers Retry and Continue without 3D.
- In fallback, retain the home title, meaningful settings/about content and recovery button. Do not pretend the campus renderer loaded. A disabled upcoming-mission affordance may explain availability; there is no fake campaign save.
- Settings use a labeled native dialog with keyboard focus, Escape close and restored focus. Honour OS reduced motion even when the stored preference allows motion. Keep persistent ambience preference separate from temporary hidden-page suspension.
- Store only validated settings in a new `tower.home.preferences.v1` key. Storage denial produces an unobtrusive session-only notice and preserves working controls. Existing prototype keys and lab databases are untouched.

## Implementation work packages and delegation

The plan is written before implementation. Work then proceeds with explicit file ownership:

| Package | Owner | Work / dependencies |
| --- | --- | --- |
| A — composition and lifecycle | Root | Freeze interfaces; implement boot controller/tests, routing, screen composition, preferences and entry fallback; install pinned dependencies and coordinate integration. |
| B — campus renderer | GPT6-sol, ExtraHigh | Own `rendering/campus/` and `content/maps/campusHome.ts`; port layout, bindings, loading, renderer/control lifecycle. Uses agreed interface; no app or package edits. |
| C — home view | GPT6-sol, ExtraHigh | Own presentational `HomeView.tsx` and home CSS; consume agreed props, implement responsive UI/settings and loading/recovery surfaces. No scene/state/storage logic. |
| D — browser regression | GPT6-Luna, Max | Own browser-test migration and home cases; retain diagnostic assertions, add startup/error/retry/fallback/mobile/settings/navigation coverage. Review observed behavior independently. |
| E — integration and review | Root | Resolve interfaces, build/runtime failures and visual findings; update architecture/run documentation and verification evidence; show the working home. |

All agents share the working tree, preserve others' edits and report interface changes. Asset production/source files and the public deployment remain outside implementation ownership.

## Acceptance and verification

1. **Boot unit/integration tests:** real progress propagation; success; error/timeout; abort during load; stale successful completion is disposed; retry supersedes previous attempt; disposal is idempotent; malformed/blocked preference storage does not fail home; route resolution preserves fixture semantics.
2. **Existing regression:** all 244 pre-existing core/integration tests and all 40 lab browser cases keep their assertions. Existing 17 asset-build tests remain green. Update lab entry URLs rather than teaching home to auto-open the fixture for tests.
3. **Real browser home:** default URL reaches ready with rendered canvas and no runtime errors; GLBs use generated URLs; camera/zoom/reset work; reduced motion and settings persist; retry after a blocked GLB succeeds; WebGL failure offers fallback; home/lab/home navigation works; viewport resize and mobile layout remain usable.
4. **Lifecycle:** dispose on navigation, no lingering canvas or duplicate presentation loops, no late state updates after abandonment; returning home reconstructs a working scene. Inspect context-loss recovery if browser support permits.
5. **Build:** lint, TypeScript, pure-core/import boundaries, unit/integration tests and production build. Test the generated site under `/TowerDefense/` as well as root. Home should lazy-load the diagnostic bundle; no source art, inspector or prototype modules ship. Include Three.js license notice.
6. **Visual review:** inspect desktop, phone and landscape screenshots from the actual app, including loading/error states. Correct collisions, empty scene framing, unreadable controls or lab-style leakage before delivery.
7. **Performance limits:** check scene payload and basic lifecycle/frame behavior. Physical-device performance and full combat budgets remain later measured work; desktop touch emulation is functional evidence only.

## Completion record

Implemented and verified on 24 September 2026. Work packages A–E are complete. GPT6-sol with ExtraHigh reasoning implemented the campus renderer and home view; GPT6-Luna with Max reasoning implemented the browser regression coverage. Root integrated boot, routes, preferences, deployment, documentation and fixes.

### Delivered architecture

- Default URL and `#/` open home; `#/lab` retains the diagnostic map. Legacy query aliases remain supported. Both screens load lazily with scoped styles; home does not load the lab bundle or create its session/save repository.
- The HTML entry paints immediately and handles failed initial JavaScript. React provides lazy-screen error recovery. Home boot owns real progress, a 30-second timeout, abort/stale-attempt handling, fallback and cleanup.
- The Three.js 0.180.0 scene loads 26 pinned assets with at most four concurrent loads, draws the 132-placement campus and decorative Copilot, and exposes camera/motion controls through the agreed interface. Browser metadata comes exclusively from the catalog adapter.
- Home settings have accessible dialog/focus behavior, optional versioned storage, OS reduced-motion support and hidden-page suspension. Desktop, phone and short-landscape layouts are implemented.
- GLB/runtime errors retry with a fresh canvas; this also recovers from WebGL context loss. A failed renderer module instead offers a full document reload because browsers cache failed module imports. Continue without 3D preserves a usable home.
- Production builds emit the Three.js license and only selected runtime assets. Root and `/TowerDefense/` builds are both covered.

### Verification evidence

`npm run verify` completed successfully:

| Check | Result |
| --- | --- |
| ESLint | Pass |
| Import boundaries | No violations, 103 source modules |
| Unit/content/integration/build | 286 passed across 18 files |
| TypeScript | All three projects passed |
| Production build | Pass |
| Desktop/touch browser suite | 56 passed, none skipped; includes all 40 existing lab cases |
| Landscape/subpath/startup failure suite | 3 passed |

Reviewed production screenshots for desktop, phone, short landscape and the mobile loading-error surface. All had readable controls and no horizontal overflow. The live Vite development entry also booted successfully under React StrictMode, rendered the campus and settings, and reported no console errors or warnings in the in-app browser. `git diff --check` passed for the changed application/documentation scope.

Generated browser evidence lives in ignored `game/test-results/`, including `campus-home-desktop.png`, `campus-home-mobile.png`, `campus-home-error.png`, `campus-home-retried.png` and `home-landscape-subpath.png`. Running verification regenerates those artifacts. The application can be reviewed with `npm run dev` in `game/`; see the [run guide](../game/README.md).

### Limits and next milestone

The selected GLBs total 2,725,488 emitted bytes at verification time. The lazy renderer chunk is about 600 kB minified / 153 kB gzip and triggers Vite's standard chunk-size warning. These are build sizes, not measured compressed transfer or physical-device performance. Long-session memory and low-end phone budgets still require device profiling; no public deployment was performed.

The next implementation milestone connects a small 3D encounter to the existing authoritative session, with player HUD, placement and faithful pause/outcome behavior. Multi-wave play, campaign saves/Continue, progression and Level 1 authoring remain separate work. This milestone establishes startup and home only; it does not turn the diagnostic fixture into a player mission.

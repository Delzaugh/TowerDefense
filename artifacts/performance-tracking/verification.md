# Performance tracking implementation evidence — 2026-09-30

The optional performance setting, local recorder, synthetic stress map and removable build integration are implemented. Open home Settings to enable tracking or open the stress map. Usage: [Performance tracking](../../docs/Performance_Tracking.md).

## Scope and behavior

- Tracking defaults off; its versioned preference is independent of the existing motion/appearance preferences. Enabling creates the compact panel and optional browser observers. Disabling cancels a capture and removes observers and the read-only browser snapshot registry.
- Campus and Tower inspection measure CPU update/render work, continuous cadence, draw/triangle/resource counts and model-load metadata. The actual encounter session measures fixed steps, simulation/publication CPU and overloads. The existing `?diagnostics` registry remains opt-in and compatible.
- Captures retain bounded raw samples, distribution summaries, immutable phase/final state, configuration, asset hashes, browser/viewport information, supported long-task observations and interruptions. Live resets preserve captures. JSON downloads remain local.
- The seeded 3D fixture has 25/50/100/200 movers, 4/6/8/12 working towers, Home/Top views and pause/reset controls. It uses six existing delivered models and owns no production encounter state. It exercises animation/rendering rather than combat or pathfinding.
- Its benchmark runs warmup, baseline, 50/100/200 loads and recovery over 34 seconds. Population changes and first renders are excluded/tagged separately. Cancellation, hidden tabs, resize, navigation, tracking changes and context loss retain partial captures; context restoration plus Reload map rebuilds the fixture.
- `build:release` and `VITE_ENABLE_STRESS_MAP=false` omit the fixture route/link, lazy JS/CSS and four exclusive GLBs. The recorder remains available. `VITE_ENABLE_STRESS_MAP=true` is an explicit override.

## Verification

All commands ran from `game/` against installed dependencies. Browser runs used local Microsoft Edge, with one worker for performance-related checks.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed, including final tests/panel updates |
| `npm run check:boundaries` | Passed: 179 modules, 488 dependencies |
| `npm test` | 352 passed in 33 files; includes real enabled/disabled Vite builds |
| `npm run build` | Passed: all three TypeScript projects and production output |
| `playwright test performanceTracking.spec.ts stress.spec.ts home.spec.ts showcaseRenderer.spec.ts --workers=1` using full test paths | 30 passed, 2 intentional touch skips for duplicate context-loss/full benchmark workloads |
| `playwright test performanceTracking.spec.ts encounter.spec.ts --workers=1` using full test paths, after final panel update | 12 passed; captures real showcase and 120 actual encounter steps across in-app navigation |
| `npm run test:performance` | Both serial desktop and phone-emulated benchmark reports passed; six phases and resource recovery verified |
| `npm run test:performance:release` | Passed; real excluded output has no route/link/chunk/exclusive assets |
| `npm run test:deployment` | 6 passed; includes tracking inventory, stress models and navigation under `/TowerDefense/` |
| Final `npm run typecheck` | Passed after adding baseline/deployment coverage |

Screenshots were visually inspected on desktop and touch layouts. Expanded panels fit the viewport and scroll internally; settings keyboard/focus behavior and report controls were exercised. Active map canvases are nonblank with visible model/color variety. The two captured motion frames differ and show movers progressing along the path. The focused visual harness uses Playwright screenshots and assertions; a combat bot is outside this fixture's scope.

Windows sandbox process startup temporarily failed with account-lock error 1909. Approved host-process execution completed the builds and tests without changing account settings. No implementation checks remain blocked.

## Initial captured baseline

Measured production inventory: `7760f71362a63f61`. These are single headless local runs, with viewport/device emulation and a target of 30 rendered frames per second. Observed rates were about 26 FPS in this environment. They establish initial evidence and functioning comparisons, not physical mobile performance or a performance budget.

| Profile and phase | Frame interval p95 (ms) | CPU p95 (ms) | Draw calls p95 | Triangles p95 | Geometries / textures |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop baseline 25 | 38.3 | 4.9 | 87 | 90,760 | 18 / 36 |
| Desktop load 200 | 38.2 | 9.8 | 469 | 585,088 | 18 / 183 |
| Desktop recovery 25 | 38.2 | 1.4 | 87 | 90,760 | 18 / 36 |
| Phone-emulated baseline 25 | 38.6 | 2.8 | 87 | 90,760 | 18 / 36 |
| Phone-emulated load 200 | 39.5 | 19.4 | 469 | 585,088 | 18 / 183 |
| Phone-emulated recovery 25 | 39.9 | 3.4 | 87 | 90,760 | 18 / 36 |

Both reports completed all phases without recorded runtime errors. Recovery geometry/texture counts matched baseline. Raw samples and all phases are in [desktop report](desktop-report.json), [desktop summary](desktop-summary.json), [phone-emulated report](phone-emulated-report.json) and [phone-emulated summary](phone-emulated-summary.json).

The included build inventory has 85 files and 8,680,040 bytes; excluded release `47a7c4d3b390bd87` has 77 files and 7,844,478 bytes. Excluding the fixture saves 835,562 bytes of uncompressed emitted content in this revision. The existing large shared Three.js chunk warning remains.

## Captures and limits

Reviewed captures: `panel-desktop.png`, `panel-touch.png`, `stress-200-desktop.png`, `stress-200-phone-emulated.png`, `stress-controls-desktop.png`, `stress-controls-touch.png`, and the `motion-a`/`motion-b` images for both profiles.

CPU timings include JavaScript work and WebGL submission; they exclude GPU execution. Resource counts are Three.js object counts, not VRAM bytes. Cadence measures this app's scheduling and frame gaps. Headless runs, hardware variation, observer overhead, viewport emulation and single-run variance constrain these baseline values. Repeat visible runs on the intended devices before setting budgets or judging mobile performance.

Unrelated workspace source, asset and art edits were preserved. No deployment, commit or model authoring was part of this request.

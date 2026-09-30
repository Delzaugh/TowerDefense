# Performance Monitoring Port Research

Research date: 30 September 2026. Scope: the current `game/` application and the campus and simulation prototypes. This is a source review and implementation proposal; no new performance benchmark was run and no runtime behavior was changed.

**Recommendation: rebuild the prototype recorder as a small TypeScript diagnostics service inside `game/`, preserve its report and scenario approach, and extend it to measure the real encounter session.** The existing opt-in renderer registry is a useful starting point. Initial testing can cover the campus, tower showcase, and SVG encounter lab immediately. Combined 3D gameplay testing becomes available when the encounter renderer is implemented.

## Existing prototype capabilities

| Reference | What it already provides | Port decision |
| --- | --- | --- |
| [performance.js](../prototypes/campus-3d/performance.js) | Up to 900 frame samples; frame interval and CPU submission percentiles; render-count distributions; resource counts; long tasks; loading, viewport and optional hardware information; reset and JSON download | Reuse the measurement concepts and percentile logic. Separate collection, aggregation, browser APIs and UI. |
| [benchmark.cjs](../prototypes/campus-3d/benchmark.cjs) | Four camera scenarios, warm sampling, desktop and phone viewport profiles, pause and resource-stability checks, screenshots and source hashes | Adapt into a dedicated production-preview runner using the game's controls. |
| [stress-test.js](../prototypes/campus-3d/stress-test.js) and [stress-config.js](../prototypes/campus-3d/stress-config.js) | Synthetic animation loads: baseline, 20 towers and 100 movers, 35 towers and 100 movers, and 50 towers and 200 movers; Home and Top views; recovery and cancellation | Retain as optional rendering fixtures. These workloads do not run gameplay targeting, damage, economy or outcomes. |
| [simulation/capture.js](../prototypes/campus-3d/simulation/capture.js) | Automatic warmup, baseline, consecutive wave samples, recovery, paused-frame checks, errors, raw samples, screenshots and partial reports | Reuse the phase structure. Replace the cosmetic actor scheduler with actual encounter recipes and starting defenses. |
| [stress-storage.mjs](../prototypes/campus-3d/stress-storage.mjs) | Source and asset hashes; local HTTP report saving; separate PNG files; validation of reports | Move file writing into the Node test runner. Retain browser download for testing on the static site. |

The prototype was a repeatable capture system, not just an FPS display. Its rendering stress tests and wave map also explicitly excluded real combat simulation.

Historical evidence confirms why this work is useful. The saved [18 September campus report](../prototypes/campus-3d/previews/performance.json) (Brussels time) recorded roughly 30 FPS and 363 draw calls in the desktop Home view. The [24 September desktop wave report](../prototypes/campus-3d/previews/stress/2026-09-24T07-44-57-507Z-4e5487d2/report.json), configured for 50 towers and a 200-enemy cap, recorded 727 baseline calls and 18 ms CPU submission p95, with maxima of 1,127 calls and 1,507,268 submitted triangles. Its cleanup/correctness checks passed while performance flags failed. These are different historical scenarios and asset revisions; they cannot establish the current game's performance or performance on a physical phone.

## Current game integration points

| Current source | Observed behavior | Proposed extension |
| --- | --- | --- |
| [rendering/diagnostics.ts](../game/src/rendering/diagnostics.ts) | `?diagnostics` exposes read-only `window.__TOWER_DIAGNOSTICS__` entries for renderer counts, DPR and scene state; unregisters on disposal | Preserve `sample()` for current tests and add bounded timing summaries and active capture support. |
| [campus/createCampusScene.ts](../game/src/rendering/campus/createCampusScene.ts) | Campus animation targets 30 rendered frames per second; DPR is capped at 2; updates lifecycle, residents, ambience and atmosphere; camera/input can draw on demand | Measure the whole update and render submission, plus demand draws. Record cadence only during continuous animation. |
| [showcase/createTowerShowcaseScene.ts](../game/src/rendering/showcase/createTowerShowcaseScene.ts) | Separate renderer; room and model preview passes; 30 FPS animation target; resource cache limited to three models | Capture both passes as one presentation frame. Measure animations, effects, model changes and settled idle separately. |
| [session/createEncounterLab.ts](../game/src/session/createEncounterLab.ts) and [fixedStepClock.ts](../game/src/session/fixedStepClock.ts) | Real encounter runs at 60 logical ticks per second, supports 1x/2x, publishes immutable views, and pauses on timing overload | Add optional session instrumentation for step time, batch time, publishing cost, entity counts and overload events. |
| [app/TowerLab.tsx](../game/src/app/TowerLab.tsx) | Gameplay map currently renders as SVG | Report session and browser/UI timing. WebGL gameplay metrics are unavailable here. |
| [campus/loadModels.ts](../game/src/rendering/campus/loadModels.ts) and [showcase/loadModel.ts](../game/src/rendering/showcase/loadModel.ts) | Explicit fetch and parse steps with lifecycle handling | Measure fetch, GLTF parsing and preparation separately; end scene readiness at the first successful draw. |
| [tests/e2e/mobileQuality.spec.ts](../game/tests/e2e/mobileQuality.spec.ts) | Samples campus/showcase counts, stores JSON and screenshots, and checks diagnostics cleanup | Reuse its selectors and artifact pattern. Add a separate performance configuration. |
| [build/runtimeAssets.ts](../game/build/runtimeAssets.ts) and [tools/package-pages.mjs](../game/tools/package-pages.mjs) | Delivered assets carry IDs, versions, revisions, byte sizes and hashes; Pages packaging creates a build inventory and release hash | Identify the exact tested build and asset set in every report. |

Home does not construct the encounter simulation. The tower showcase pauses campus ambience while retaining the campus scene. Reports therefore need separate streams for `campus`, `showcase` and `encounter`, with shared timestamps; the existence of two renderers does not mean both are continuously drawing.

Direct imports from `prototypes/` are prohibited by the game's [dependency rules](../game/.dependency-cruiser.cjs). Port the useful code into application-owned modules and keep performance/browser dependencies outside the pure simulation and content modules.

## Measurement changes required for a reliable port

### Count all render passes consistently

The prototype disables `renderer.info.autoReset` and resets once before each draw, so its counters include shadows. The showcase already follows this pattern across its room and preview passes. The campus currently leaves automatic reset enabled. In the installed Three.js 0.180.0 source, automatic reset happens after shadow rendering and before the main scene rendering; its sampled campus counts consequently omit shadow submissions.

Use explicit reset before a complete presentation frame, then copy counters after all passes. Keep that reset in the renderer owner, not in the sampling registry. Three.js documents manual reset for frames containing multiple render passes. [Three.js renderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html)

### Separate frame cadence from work duration

Keep render interval p50/p95/p99, render rate, and counts of intervals over 50 and 100 ms. Measure animation/presentation CPU work and WebGL submission independently where practical. A JavaScript timer around `renderer.render()` does not establish GPU execution time.

Use the animation callback timestamp for scheduling cadence and `performance.now()` for scoped CPU work. Browser animation callbacks generally follow display refresh, and background tabs suspend them. Record the intended 30 FPS cap and actual callback cadence so display pacing is not automatically interpreted as scene overload. [MDN animation scheduling](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame/)

For the encounter, report logical ticks per second, simulation CPU per tick, simulation CPU per browser callback, ticks processed per callback, synchronous view publication, speed and overload pauses. Sixty simulation ticks do not imply sixty rendered frames. At 2x, logical throughput can be 120 ticks per wall-clock second without changing the presentation target.

Start campus timing before lifecycle/resident/effect updates and end after submission. Start showcase timing before mixer/effect updates and end after both render passes. Include camera-triggered draws, tagged with their reason, without double-counting a frame. Publication timers only measure synchronous session work; later React rendering, layout and paint need browser traces or a separate UI profiling pass.

### Preserve complete runs without unbounded storage

The prototype retains 900 frames, approximately 30 seconds at 30 FPS, but `sampleDurationMs` and long-task totals refer to the time since reset. Long captures can therefore mix statistics from different periods. It also caps long-task entries at 500, so reported totals can stop representing the full period.

Keep a bounded live ring buffer and explicit window start/end timestamps. Use per-phase online totals or histograms for longer runs, and bounded raw chunks when requested. Report retained/dropped sample counts. Compute percentiles on snapshots rather than sorting on every frame; read hardware once and traverse scenes only at phase boundaries. Publish the panel at about 1 Hz and keep it closed during automated samples. Measure recorder overhead against the disabled recorder on the same scenario.

### Make optional browser measurements explicit

Long Tasks reports main-thread tasks of at least 50 ms and has limited browser availability. Long Animation Frames can expose rendering delays caused by several smaller tasks and provide script/layout attribution. Feature-detect both and use one page-level observer; unsupported data should be `null` with a support flag. Neither API replaces frame interval sampling for shorter missed deadlines. [MDN Long Tasks](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming), [Chrome Long Animation Frames](https://developer.chrome.com/docs/web-platform/long-animation-frames)

Treat `performance.memory` as optional legacy information. MDN marks it deprecated, non-standard and unreliable; it is not VRAM. Geometry, texture and program counts help identify trends but are not byte measurements or proof that all memory was released. Compare warmed cache plateaus during repeated navigation/model changes. [MDN heap measurement limitations](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory)

GPU timing can be a later optional addition through `EXT_disjoint_timer_query_webgl2`. Poll results on later callbacks, discard disjoint samples and dispose query objects; do not block waiting for the GPU. Store availability and valid sample coverage, and never substitute CPU submission time when unavailable. [Khronos GPU timer specification](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/)

### Distinguish loading and transfer measurements

Record navigation-to-home-ready and scene-construction-to-first-draw separately. Attach asset IDs and hashes from `RuntimeAsset`, actual loaded byte counts, and Resource Timing fetch durations and sizes. `decodedBodySize` describes the HTTP body after content decoding, not the GLTF's parsed memory. Cache and cross-origin restrictions can produce zero transfer sizes. Separate fresh-context loading from warmed navigation, and local preview from hosted network testing. [MDN Resource Timing](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API/Resource_timing), [MDN transfer sizes](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/transferSize)

## Proposed implementation

Introduce `game/src/diagnostics/` for a collector, summaries, browser observers, report types and JSON export. Keep the existing renderer diagnostics module as the adapter, preserving its read-only public interface. Inject an optional recorder into scene/session owners so disabled recording creates no observers, recurring sampling timers or sample arrays. Keep collection outside React state and avoid exposing renderer objects or gameplay mutation methods globally.

Add an opt-in React performance drawer available when `?diagnostics` is present, with renderer/session selection, frame and CPU summaries, counts, Record, Stop, Reset live window and Download report. Resetting the live window must not destroy an active run. Navigation, hidden tabs, viewport/DPR changes and context loss should annotate or interrupt fixed benchmark phases and preserve partial reports. Settled pause/reduced-motion scenes should display their state instead of a misleading FPS failure.

Preserve compatibility with existing automated `sample()` calls. For capture orchestration, provide narrow start/stop/snapshot methods that operate on diagnostics only. Create `game/tests/performance/` and a separate Playwright configuration with one worker. The current functional configuration uses four workers; simultaneous browser workloads would contaminate timing. The planned performance directory and 100-visible-moving-entity scenario already appear in [Codebase Structure](Codebase_Structure.md).

Use a versioned game report with build/release identity, scenario recipe and starting-defense hashes, content/rule versions, asset hashes, viewport and drawing buffer, DPR, browser, headed/headless mode, support flags, phase summaries, bounded frame samples, errors, interruptions and cleanup results. Keep correctness results separate from provisional performance warnings. Export unavailable metrics explicitly and store artifact filenames for desktop runs; screenshots should be optional in portable reports.

The Node runner writes JSON, screenshots and comparisons under ignored `game/test-results/performance/`. Browser downloads cover manual and physical-device runs on the static site. The prototype's `/stress-report` and `/stress-revision` endpoints belong to its custom server; they are not available in ordinary Vite preview or on GitHub Pages. Reuse the production build inventory for identity and let the runner write artifacts without adding a backend. Local builds also need an explicit build fingerprint; `sourceRevision` in Pages metadata can be null outside CI.

## First performance scenarios

The following durations and warnings are proposed starting choices, not established release requirements.

| Scenario | Initial run | What it answers |
| --- | --- | --- |
| Fresh startup | Fresh browser context; record navigation through first successful campus draw | Asset transfer, parsing, assembly and first-render costs |
| Campus ambience | Home and Top; fixed viewport/DPR; 2–5 s warmup then 20 s per view | Current continuous animation and rendering baseline |
| Campus motion and idle | Scripted pan/zoom/view transitions, then settled pause and reduced motion | Interaction spikes and absence of recurring scene draws when settled |
| Tower showcase | Fixed model and clip sequence covering idle/work and place/resolve; warmed and first-load cases | Mixer/effect cost, both render passes, model loading and cache behavior |
| Real encounter lab | Fixed validated recipe and starting defense; 1x and 2x; record ticks, entity counts, outcomes and overloads | Actual targeting/rules/session/UI cost in today's SVG presentation |
| Repeated use | At least five hub/showcase/navigation cycles after cache warmup | Resource-count and retained-memory trends, diagnostics disposal and errors |
| Short soak | At least three minutes of ambience, then a longer repeat if needed | The full resident routine and resource trends beyond a 900-frame window |
| Integrated 3D encounter | When available: real rules plus rendering at 25, 50 and 100 visible moving Work/Problem entities | Capacity and combined CPU/GPU pressure for the intended game |

The 100-visible-moving-entity design target comes from [Technical Architecture](design/Technical_Architecture.md#performance-principles). It is not a universal 100-enemy cap. Higher synthetic loads can locate a rendering capacity limit, but must be identified separately from valid game scenarios and authored placement limits.

Run the production build preview, with a known viewport/DPR and the same scenario, at least three times on an otherwise idle machine. Compare the median run and each run's p95/p99 rather than pooling unrelated profiles. Record panel/capture settings and keep screenshot encoding and JSON serialization outside measurement phases. Match or record ambient phase and scene/model selection so repeats have comparable workload. Use browser screenshots after measurement; avoid enabling `preserveDrawingBuffer` solely for captures.

Headed desktop Edge/Chrome is the initial local baseline; headless CI can track counts, lifecycle correctness and large regressions, with timing interpreted against its own baseline. Phone viewport emulation is useful for layout/DPR coverage. It does not reproduce physical phone hardware; first device testing should include an integrated-GPU laptop and a real mid-range phone using the same report workflow. [Chrome device emulation limitations](https://developer.chrome.com/docs/devtools/device-mode)

## Budgets and delivery order

The prototype's 28 FPS minimum, 50 ms frame p95, 16.7 ms CPU submission p95, 600 calls, one million submitted triangles and 64 textures were provisional fixture warnings. Preserve them only as labelled historical references. The current campus's 30 FPS target gives a nominal 33.3 ms presentation interval; simulation remains 60 Hz. Establish scene/device budgets from the new baseline, and report cadence, CPU work and resource counts separately. Include monitor overhead and display cadence before setting hard timing failures.

For the first batch, hard checks should cover valid sample counts, successful loading/outcomes, no unexpected errors, interruption status, settled pause behavior, diagnostics cleanup and stable warmed resource trends. Performance numbers should initially warn and compare against matching build/scenario/device baselines. Use relative regression thresholds only after repeated runs establish normal variance.

1. **Recorder and manual panel:** extend the registry, standardize render counters, capture CPU/cadence/load data and export reports. Instrument campus and showcase. This establishes initial 3D measurements.
2. **Repeatable testing and history:** add the serial production-preview runner, scenario definitions, report schema, build identity, screenshots and comparisons. Instrument the actual encounter session and run fixed recipes.
3. **Combined gameplay and deeper diagnosis:** attach the same collector to the 3D encounter presentation when implemented, exercise the 100-visible-entity scenario, and add optional GPU timing if needed. Use DevTools traces for CPU, React/layout and compositor investigation when the summaries reveal a problem.

A new telemetry service, a graphics engine change and an external dashboard are unnecessary for this first setup. The first useful deliverable is a small recorder with reproducible reports and comparison history, built on the game's existing test and asset infrastructure.

## Research limits

The source and saved prototype reports were inspected, including the installed renderer's reset behavior. No new current-game timing, physical-device measurement or monitor-overhead measurement was performed. The project contains existing unrelated changes; this research adds only this document and leaves runtime code and existing documentation edits intact.

# Performance tracking and stress map

The game has an opt-in performance recorder for early performance testing. Open **Settings** on the home screen and enable **Performance tracking**. The preference is saved on this browser/device. Tracking starts disabled for a new browser profile.

The compact overlay expands into live frame statistics and recording controls. Select an active source, record a session, stop it, and download its JSON report. Disabling tracking cancels an active recording and retains its partial report. Resetting live statistics does not erase a recording or the last completed report.

## What is measured

Campus, tower showcase and stress-map renderers report draw calls, triangles, allocated geometry/texture counts, shader programs, drawing-buffer size and pixel ratio. Timing covers their JavaScript update/render work and frame cadence. The encounter simulation reports its CPU work, fixed-step count, overloads and publication time. Model-loading metadata includes asset identity, size, content hash, fetch time and parse time.

Reports include percentile distributions, bounded raw samples, capture configuration, browser/viewport information, supported long-task observations, interruptions and phase summaries. Production builds also emit `performance-build.json`, an inventory with hashes that identifies the tested bundle.

Frame cadence describes the renderer's scheduling: campus and showcase currently target 30 FPS. Render-call CPU time is not GPU time; the recorder does not implement GPU timer queries. Three.js resource counts are object counts, not GPU-memory bytes. Browser observers vary by browser. These reports are local downloads and are not uploaded to a monitoring service.

Tracking disabled avoids timing samples, renderer-stat reads and observer installation. Enabled tracking has some overhead; keep hardware, viewport, pixel ratio, browser and recording configuration consistent when comparing runs.

## Stress map

Choose **Open stress test map** in home Settings, or navigate to `#/stress`. The small seeded fixture exercises real game GLBs, animation mixers, shadows and rendering with 25, 50, 100 or 200 movers plus animated working towers. It is a synthetic rendering/animation workload; it does not simulate encounter combat, pathfinding or targeting.

The benchmark runs for 34 seconds: 3 seconds of warmup, 5 seconds at 25 movers, 7 seconds each at 50/100/200 movers, and 5 seconds of recovery at 25 movers. Population setup and its first render are measured/tagged separately and excluded from the steady phase samples. Use recovery to check that resource counts return to baseline.

Running a benchmark enables tracking automatically. Benchmark recording controls belong to the stress page while it runs. Choose **Cancel benchmark** there to keep a partial report. Hiding the tab, resizing the viewport, leaving the page, disabling tracking or losing the WebGL context also ends the capture with a recorded reason. Restore the context and choose **Reload map** after context loss.

For an initial baseline, use a production build, keep the tab visible, close developer tools, use a fixed viewport and browser zoom, and run the benchmark several times after assets load. Compare phase p95/p99 frame intervals and CPU times alongside draw/triangle counts. A browser's mobile emulation is a layout/input check; use real phones for mobile performance decisions.

## Excluding the fixture

From `game/`, `npm run build` includes the lazy-loaded stress map for current testing. `npm run build:release` builds with the stress map excluded. In an environment or `.env` file, `VITE_ENABLE_STRESS_MAP=false` also excludes it from any build; `true` explicitly enables it, including release mode.

Exclusion removes the route entry, lazy fixture chunk, fixture CSS and its exclusive models from the output. Assets shared with ordinary game views remain. The tracking setting and recorder remain available. To remove the fixture permanently, delete `src/dev/stress/`, its App/routes integration, build flag and stress-specific tests; the shared recorder has no dependency on the fixture.

## Verification

Focused unit tests cover bounded capture windows, disabled behavior, persistence, recording preservation and lifecycle cleanup. Build tests compile with the stress flag both enabled and disabled and inspect emitted chunks/assets. Browser tests cover the setting, panel, stress controls, interrupted capture and benchmark report export on desktop and touch layouts.

Run the normal production build before preview-based browser tests:

```powershell
cd game
npm run build
npx playwright test tests/e2e/performanceTracking.spec.ts tests/e2e/stress.spec.ts --workers=1
npm run test:performance
npm run test:performance:release
```

The dedicated baseline suite runs serially, saves full reports and phase summaries under `game/test-results/performance/`, and checks that recovery resource counts match baseline. Its desktop and phone-emulated profiles are headless by default; set `TOWER_PERF_HEADED=1` for a visible browser. The release check builds an excluded copy into `game/test-results/performance-release-build/` and verifies that its UI, route and inventory omit the fixture.

Automated or headless capture results are exploratory. A measured device baseline requires the same hardware/browser/configuration across runs and a visible, foreground tab.

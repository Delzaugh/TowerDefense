# Campus performance baseline

The prototype now contains 132 static placements, five animated characters, 18 animated plant instances, 24 soft steam wisps and restrained presentation effects. The live layout loads 28 distinct GLBs (about 3.03 MiB of decoded response bodies). Repeated environment placements share geometry and materials; they are not yet GPU-instanced.

## Measuring it

Open **Performance** in the upper right of the campus. The panel measures rendered frame cadence, CPU animation/presentation/WebGL submission time, draw calls including shadows, rendered triangles including shadows, geometry/texture counts, long tasks and local readiness time. **Reset sample** starts a clean sample; **Save report** downloads the measurements and scene state locally. No telemetry is sent anywhere.

CPU submission time is not GPU execution time. The GPU can still be the bottleneck when CPU work is small. Resource counts are useful leak indicators, but are not VRAM byte estimates. The 30 FPS cap is intentional; paused/reduced-motion scenes render on demand, so a paused FPS value is not a speed score.

Run these independently, without other browser tests competing for resources:

```powershell
node prototypes/campus-3d/verify.cjs
node prototypes/campus-3d/benchmark.cjs
# For a visible, hardware-context comparison:
node prototypes/campus-3d/benchmark.cjs --headed
```

The benchmark uses a fresh browser context per profile, warms all camera presets, then takes eight-second samples for Home, Top, 500% Front and Left. It checks zero rendered frames while paused and stable geometry/texture counts after twenty preset switches. It writes `prototypes/campus-3d/previews/performance.json`. Timing budgets are reported individually; browser errors, paused rendering or resource growth fail the command. Hardware-dependent budget flags are diagnostic, not CI failures by default.

## Measured revision after expanded ambience — 18 September 2026

| Metric | Desktop 1440 × 960, DPR 1 | Phone viewport 390 × 844, DPR 2 |
|---|---:|---:|
| Rendered cadence across four cases | 29.97–30.00 FPS | 29.97–30.00 FPS |
| CPU submission p95 | 2.8–4.5 ms | 3.6–4.1 ms |
| Draw calls, including shadows | 235–364 | 268–364 |
| Triangles submitted, including shadows | 105,000–157,000 | 117,000–157,000 |
| Textures / warmed geometry buffers | 43 / 61 | 43 / 61 |
| Local readiness | 1.98 s | 1.52 s |
| Frames while paused / resource-growth check | 0 / stable | 0 / stable |

This is one headless Edge run on the same desktop hardware, not mobile hardware certification. Cold contexts do not imply a cold OS disk cache; local no-store responses do not represent a production network. The actual report records browser, viewport, buffer dimensions and timestamp. All measured cases meet the provisional budgets: at least 28 FPS, p95 frame interval at most 50 ms, p95 CPU submission at most 16.7 ms, at most 600 draw calls, one million submitted triangles and 64 textures. These are prototype regression thresholds, not universal safe limits.

## Validation as the campus grows

1. Keep this baseline. For each larger campus, run three otherwise-idle benchmark passes on the same machine/browser and compare median results, especially p95 cadence and CPU cost. Save each JSON before the next run overwrites it. Watch for a 20% regression even when a budget still passes.
2. Test a representative low-end laptop and a physical mid-range phone using a deployed/private preview and browser remote debugging. This development server binds to localhost; do not treat desktop phone emulation as the device test. Record hardware, power mode, browser, DPR and thermal state.
3. Run a ten-minute foreground session, switching cameras and zoom, then pause and background the page. Resource counts should plateau, motion should stop when hidden, and resuming should not jump routines forward. A short resource-count test alone does not establish absence of leaks.
4. Profile a slow frame in browser Performance tools. If CPU-bound, inspect mixers, scene traversal and draw submissions. If GPU-bound, compare lower DPR and shadow resolution in a controlled development branch, and inspect overdraw. Network tests should use production cache/compression and realistic latency, separately from warm rendering tests.
5. Before approving a larger capacity, build an explicit representative fixture with the intended additional tiles, props and simultaneous moving characters. Test the real mix rather than extrapolating FPS linearly from this scene. A maximum-capacity stress scene is not yet implemented.

The first likely optimization is instancing repeated static walkways, trees and props by compatible geometry/material. Next, reuse character resources via skeleton-safe clones, reduce repeated shadow work, and add distance-based animation/detail policies. Measure each separately; triangle count alone is currently a weaker signal than submissions, skinning and shadows. Keep the existing pause/reduced-motion behavior and authored art intact.


The close Front case now uses the full 500% zoom. Overview submissions increased from approximately 350 to 364 after the larger steam and speech cues; the soft effects share two small generated textures. The current JSON includes hashes of the measured presentation files. Timing comes from short headless samples; use the live panel and longer physical-device runs to investigate intermittent stalls or embedded-browser throttling.

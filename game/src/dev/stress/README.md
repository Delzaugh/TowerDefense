# Performance stress map

Open `#/stress` through campus Settings → Performance. This isolated development fixture exercises shared delivered GLBs, skeleton-safe clones, animation mixers, shadow passes and renderer cleanup; it does not run combat rules or award progression.

The seeded closed switchback contains 25, 50, 100 or 200 moving enemy/work models and 4, 6, 8 or 12 working Copilot/Developer towers. Home and Top views, pause/resume and reset preserve a reproducible setup. The renderer retains the normal 30 FPS target, antialiasing, shadows and DPR cap of 2. CPU samples cover motion, mixers and render submission; CPU time is not GPU time. Population transitions and their first render are excluded from steady phase samples and tagged with `fixture-setup` events; their allocation duration is retained in source metadata.

Run benchmark enables tracking and records a 34-second sequence: 3 seconds of 200-mover warmup, 5 seconds at 25 movers, 7 seconds each at 50/100/200, and 5 seconds of recovery at 25. It returns to the canonical Home view and resets the seed at each phase. Resource counts in recovery can be compared with baseline; removed clones dispose their skeletons while cached model geometry/materials remain shared until navigation. Tab hiding, resizing, changing tracking or map controls, cancelling, renderer failure, context loss and navigation end the recording with the completed phases and partial current phase retained. Reports are downloadable JSON and remain available in the global Performance panel after navigation.

## Build exclusion

All fixture-specific modules and asset imports live here. `App.tsx` gates its lazy import directly with `__STRESS_MAP_ENABLED__`. Normal development and production test builds include it. `npm run build:release` defaults to exclusion. `VITE_ENABLE_STRESS_MAP=false` excludes it in any mode; explicit `true` enables it even in release. Excluded builds reject `#/stress`, omit the fixture chunk/CSS, and omit enemy/work GLBs used only by this fixture. Shared Copilot/Developer assets continue to be included where the campus imports them.

To remove the fixture permanently, delete this directory, remove the gated import/route/settings link and the Vite define/build flag. No production simulation or content modules depend on it.

# Three.js presentation

Scene lifecycle, camera, catalog-based model loading, read-only snapshots, visual interpolation, effects, picking helpers, and animation playback. Bind asset versions and clips explicitly. Selection, range, aura, progress, and blocker feedback are runtime visuals.

Use the same logical map geometry as the simulation for previews. Visual anchors and clip completion never decide targeting, movement, rewards, or other gameplay outcomes.

Use versioned `tower-asset:` imports through the [catalog build adapter](../../build/README.md). `RuntimeAsset` is its browser interface; no source manifests or filesystem paths belong in rendering code.

`campus/` implements the home scene against the small lifecycle/control contract in `types.ts`. `assets.ts` pins the campus catalog models; `loadModels.ts` limits concurrent fetch/parse work to four and releases aborted/late results. `createCampusScene.ts` constructs the versioned placements, lighting, camera, companion, residents and ambient presentation. `ambient.ts` plays existing plant clips and owns transient steam, ripples, leaves and speech cues. Pure schedules in `campusRoutines.ts` coordinate the plaza residents. The scene draws before reporting readiness, caps animation at 30 FPS, and stops scheduled frames when paused or reduced motion applies.

The scene owns canvas input and WebGL resources; the React home owns resize/visibility/motion subscriptions. Disposal releases listeners, mixers, skeletons and deduplicated geometry/material/texture resources. A lost context reports failure to boot; the application replaces the canvas on retry. Repeated static placements share their source resources. The companion's stroll and idle clip are decorative presentation, with no gameplay state or outcomes.

`campus/lifecycle.ts` schedules occasional Place/Resolve on `copilot_base@v02` and `copilot_developer@v01`. One stationary character resolves, stays absent for three seconds, then places back before resuming its frozen route clock. The first opportunity is after 28 seconds; subsequent events wait 49–68 seconds plus the next character's stop. Coordinated social routines remain uninterrupted. Pause freezes the complete timeline; reduced motion restores any departing character and disables scheduling through the scene loop. A shared 64-cube budget and per-instance effect materials use the same `tools/asset-presentation/digital-resolve.js` as the Inspector, exposed by the runtime-only `tower-presentation` alias. Loaded model templates remain pristine.

3D encounter presentation remains the next integration milestone. See the [startup plan](../../../docs/App_Startup_Implementation_Plan.md) and [production build plan](../../../docs/Production_Foundation.md).

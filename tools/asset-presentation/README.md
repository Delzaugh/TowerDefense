# Asset presentation effects

`lifecycle.js` dispatches category effects: digital tower **Place/Resolve**, enemy
**Glitch breach**, and Work/task **Blueprint**. `digital-resolve.js` retains the
Developer's cube implementation. They are shared by the Inspector and validator;
it does not advance gameplay or remove simulation entities.

For towers, the Blender recipe stores `presentation.resolve` data in the GLB
root's `resolve_effect` extras. The GLB contains the matching eye animation, while
this module supplies the grid dissolve, cyan edge pulse and drifting cubes.
An ordinary GLB player shows only the skeletal pose animation. A game presenter
must integrate this module to display the complete effect.

```js
const budget = createResolveBudget(256); // One shared budget for the whole scene.
const effect = createLifecycleEffect(THREE, gltf.scene, {budget});
if (effect) {
  actor.add(effect.object); // Same actor parent as gltf.scene.
  effect.prepare();        // Sample the surface during loading, before gameplay.
}

// After evaluating the selected animation and updating actor transforms:
effect?.setState(clip.name, action.time, clip.duration);
// Use null for Rest Pose or when no clip is active. Other clips reset the effect.
// Call effect.dispose() before disposing the actor's original meshes/materials.
```

Prepare while the asset is in its authored rest pose. Construction clones surface
materials and adds matching depth/distance discard shaders; disposal restores the
original materials. Compatible surfaces use Three MeshStandard/PhysicalMaterial.
The module uses the bundled Three renderer's shader chunks; renderer upgrades
must run the effect test. Palette sampling expects the current opaque color/UV
workflow, not arbitrary layered material graphs.

Progress comes only from the clip timeline, so seeking, replay and loop wraps are
deterministic. `resolve` runs breakup progress from zero to one; `assembleClip:
"place"` reverses it. Both Developer clips last 1.25 seconds and use reversed eye
poses at full body scale. Place starts invisible and ends at Idle's ready pose;
Resolve ends invisible. The game presenter must retain a visual instance through
its exit effect and choose any crossfades explicitly; clip completion is never a
gameplay trigger.

Each tower uses at most 64 instanced cubes (768 additional triangles, one draw
call when visible). The Developer mesh has 4,228 triangles, so its conservative
combined maximum is 4,996. Surface rendering still submits the complete mesh
during dissolution. These costs exclude optional floor and shadow passes.
The shared 256-cube budget bounds concurrent debris; when exhausted, the grid
dissolve still runs without cubes. This is a budget ceiling, not a device FPS
guarantee. `setEnabled(false)` exposes the unchanged full-size skeletal pose.

Run `node tools/asset-inspector/verify-digital-resolve.mjs` for actual-renderer
coverage of both directions, endpoints, reset, replay, scrubbing, shadows, reload,
budget fallback and disposal. Personally review close and phone-scale playback.
Effect evidence records both GLB/source hashes and the renderer hash; the guarded
visual-review check invalidates an effect review when the shared renderer changes.

## Glitch breach and Blueprint

The user-approved category defaults are demonstrated by `problem_bug` and
`work_coding_task`. Reuse them in authorized animation passes. Both use
`presentation.lifecycle` in the manifest and `lifecycle_effect` in root extras:

```json
{
  "type": "glitch_breach",
  "version": 1,
  "entryClip": "spawn",
  "exitClip": "resolve",
  "anchor": "root",
  "color": "#FF497C",
  "maxFragments": 12,
  "spawnPortal": false
}
```

Blueprint uses `type: "blueprint"`, its transform parent as anchor, a mint accent,
and zero debris fragments. Configure the anchor to follow the body's presentation
pose without simulation motion. Construct the effect in the authored rest pose.
Keep the same parent for the GLB and effect object; it follows the anchor itself.

- Glitch breach: jagged body reveal for entry, horizontal debugging sweep and
  at most 12 thin instanced streaks for exit. Its 1.25-second Bug poses keep full
  body scale. Peak possible additional geometry is 156 triangles; combined with
  Bug's 2,320 triangles, the ceiling is 2,476. If the shared pool is exhausted,
  the erase sweep continues without streaks.
  The default has no Spawn portal; record `spawnPortal: false`. Only an explicit
  asset override may set it true for the extra membrane/rails. Fit `maxFragments`
  to the model's remaining combined budget: 12 triangles per streak plus 12 for
  the sweep. Zero streaks still retains the body reveal/erase shader and sweep.
- Blueprint: an outline derived from the actual projected mesh silhouette and
  a bottom-to-top solid reveal. Resolve uses a confirmation check and upward
  erase sweep, without rising lines or ribbons. Coding Task uses
  1.5-second clips and keeps its ready hover.
  Helper geometry is bounded per asset, with no particle pool allocation.
- Optional `stateMorphs` names deployment morphs whose alternate geometry is
  hidden inside an opaque shell. Coding Task deploys checked overlays toward +Z
  and retracts empty frames along -Z. The effect clones geometry only to add a
  visibility attribute and reads the existing weights (threshold 0.5). It never
  changes those weights. Omit this option for other morph constructions; do not
  infer this visibility convention from arbitrary morph names or shapes.

Entry starts completely invisible and finishes at the ready pose; exit starts
full size and finishes with no body, helper or shadow. Rest reset, effect disable
and disposal restore the original art. The shader applies identical coverage to
surface/depth/distance passes; the temporary open cut hides inward-facing surfaces.
All effects are timeline-driven and deterministic, including seek/replay.

Run `node tools/asset-inspector/verify-lifecycle.mjs` for these two references,
or append one or more asset IDs for an authorized rollout. Each new asset needs
a coherent `before_glitch_breach` (enemy) or `before_blueprint` (Work) milestone.
It checks preserved rest geometry, materials, palette, morphs and unaffected
clips; real Inspector playback, reset/reload, phone/shadows, full-size pose,
independent states, fragment fallback, and resource restoration. Shader effects
still require this presenter in the game; GLB animation alone is insufficient.

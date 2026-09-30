# Copilot Hub Tower browser — build plan

Status: Implemented, 2026-09-27. The user approved the [final v09 mock-up](../../design/mockups/copilot_hub_towers/v09/codex.png) and requested access by clicking the main building in the Hub map. The original plan below is retained as the implementation rationale.

Latest interaction revision supersedes the earlier animation-rail and compact-stat proposals below: Stats occupies the full right-hand panel, with passive visual gauges, inline qualitative descriptions and no info icons. The manual animation panel and mobile animation tabs are removed. Changing Tower plays the outgoing Resolve and incoming Place automatically, with the newest selection winning during rapid browsing; reduced motion settles immediately. The expanded central viewport uses one shared display volume for the collection, preserving authored metre scale, pedestal position and user zoom/orbit through selection and transition effects. Availability copy reserves its layout space so the preview does not jump when that copy is absent. Back to Hub now reverses the building approach beneath a fading mint veil, retaining the exact saved camera and restoring input/focus only on completion.

## Delivery record

- The main Lab building has isolated mint silhouette/footprint feedback and gesture-safe click/tap entry. Inspect Towers provides a keyboard and fallback entry. The retained Hub scene is suspended while the native dialog is open; return restores focus, camera and preferences.
- The browser provides the seven approved Copilot references plus Senior Developer and Commit Halo in the development collection. Canonical model bindings, lightweight rendered portraits, rotation/tilt/zoom/reset, available authored clips, Rest and shared Place/Resolve effects are connected.
- The new registered environment is [showcase_workbench v01](../../blender/environment/showcase_workbench/v01/asset.json), with editable Blender source, guarded GLB delivery and recorded visual review. Its room, continuous desktop and compact octagonal plinth use the restrained Hub palette.
- The interface uses bundled Mona Sans, actual Octicons, tactile controls, fixed-scale visual stats and qualitative ability descriptions. Phone layouts use a portrait rail and Stats/Animations controls; short landscape screens retain reachable controls.
- Accepted baseline data now lives in [the pure reference registry](../../game/src/content/towers/catalog.ts), with presentation conversion in [visualStats.ts](../../game/src/app/showcase/visualStats.ts). This does not implement the pending combat behaviors or change diagnostic fixtures.
- Tester, Analyst and Architect still have no canonical models, so their previews show intentional silhouettes. Development Towers have no approved stats. Animation choices reflect actual delivered clips; unavailable actions are explicitly labeled.
- Implementation entry points: [HomeScreen](../../game/src/app/home/HomeScreen.tsx), [dialog](../../game/src/app/showcase/TowerShowcaseDialog.tsx), [workbench UI](../../game/src/app/showcase/TowerShowcase.tsx), [3D renderer](../../game/src/rendering/showcase/createTowerShowcaseScene.ts).

Verification covers content values, Hub gestures/occlusion/boot, preview lifecycle, desktop and phone end-to-end interactions, reduced-motion actions, and deployment beneath `/TowerDefense/`. Visual review includes the live desktop and phone layouts. Production type checking, lint and dependency boundaries are included.

### Interaction and performance refinement

- Entering the Lab now eases the actual Hub camera toward the building with a short digital veil. The pre-entry camera pose and visible zoom value are preserved. Repeated input is guarded, Escape cancels entry, and reduced motion bypasses the travel. The lazy screen warms during the approach.
- The inspection controls use a compact zoom/reset toolbar with a separate rotate/tilt pad. Portrait selection has a single keyboard tab stop, arrow/Home/End navigation and automatic scrolling to the selected Tower. Missing art is labeled **Preview soon** before selection.
- Visual stat gauges reveal qualitative explanations on activation. Tower descriptions and the active animation’s state and purpose are visible. Short desktop and phone layouts keep controls reachable with scrollable detail consoles.
- Layout measurements and camera projection work are invalidated only when needed. Animated draws are capped at thirty frames per second while clip timing follows elapsed time; Rest and hidden views stop continuous rendering. Production portraits are bundled, avoiding runtime GPU readback and PNG generation. The optional portrait fallback runs after the first visible frame during idle time.
- Added `showcaseRefinement.spec.ts` to verify keyboard browsing, stat explanations, a stable preview during camera-control disclosure, animation feedback, and narrow/short layouts. Renderer lifecycle tests continue to cover rapid selection, repeated entry and reduced-motion one-shot completion.

The [interaction and visual specification](Copilot_Hub_Tower_Showcase.md) remains the design reference. Ship a playable collection screen inside the same low-poly world: portrait rack, live Tower on a tabletop plinth, visual capability gauges and tactile animation choices. Keep the warm worktable, restrained architecture, dark equipment, indigo selection and teal accents. Omit corporate wall logos and decorative foreground clutter.

## Player journey

1. Hover the central **Copilot Lab**: a restrained mint outline and footprint glow identify it, with **Inspect Towers** nearby. Focusing the matching accessible button gives the same highlight.
2. Click or tap the building, or activate **Inspect Towers**. Open the full-screen workbench with a short spatial reveal. Reduced motion opens immediately.
3. Start with **Developer**, matching the approved mock-up. Subsequent openings during the visit remember the selected Tower. Select a portrait to update the model, role, abilities and stats in place.
4. Rotate, tilt and zoom the model; select an available animation. Read capabilities through labeled visual gauges and qualitative descriptions.
5. **Back to Hub** or Escape closes the browser and restores focus. The Hub retains its camera, pan, zoom and ambience preference.

Browsing is read-only. This feature does not implement placement, Persona purchases, upgrades or new combat behavior.

## Existing foundations and gaps

| Area | Verified current state | Build decision |
| --- | --- | --- |
| Main building | `campusHome.ts` marks the `campus_lab` placement as building `copilot-lab`; the renderer copies this identity onto its instance. | Raycast the actual instance, following the floating island's world transform. |
| Campus gestures | `camera.ts` owns pointer capture and a four-pixel pan threshold. | Qualify building activation inside the existing gesture controller. Do not add an independent click listener that also fires after dragging. |
| Home lifetime | `HomeScreen` owns `createHomeBoot`; pausing currently stops campus animation but does not disable camera input or camera-transition frames. | Retain Home and its scene; add explicit interaction suspension as well as pausing. |
| Existing Lab route | `#/lab` opens the engineering encounter Lab. `TowerInspector` and `TowerStatsPanel` expose diagnostic numbers and editing. | Add a dedicated, lazy-loaded browser owned by Home. Keep the diagnostic route and components separate. |
| Asset loading | `tower-asset:<id>@<version>` imports resolve through the catalog, validate delivery hashes and support deployment subpaths. | Use explicit current asset bindings through this mechanism; fetch only the selected model. |
| Tower definitions | Accepted baselines exist in `Tower_Base_Stats.md`; several differ from diagnostic fixtures or have no implemented behavior. | Author approved, content-owned reference definitions before binding visual stats. Never show diagnostic fixture values as Tower balance. |
| Animation effects | Shared digital Place/Resolve presentation already exists. GLB clips alone do not display the complete effect. | Reuse the shared presenter and its resource/disposal contract. |
| Room art | The approved room exists as a generated mock-up, not a delivered interior model. | Produce a small real 3D room/workbench asset through the existing Blender pipeline. |

### Current initial-roster assets

| Tower | Canonical runtime binding | Preview readiness |
| --- | --- | --- |
| Base Copilot | `copilot_base@v02` | Idle, Work, Move, Place, Hit, Resolve |
| Developer | `copilot_developer@v01` | Full standard set |
| Security | `copilot_security@v01` | Full standard set |
| Linter Agent | `copilot_linter@v01` | Full standard set |
| Tester, Analyst, Architect | No matching registered model at planning time | Approved role/stats with silhouette and **Model preview coming soon** |

Rest is a presentation state, not a required clip. Recheck delivery and clips when implementation starts, since assets continue to change.

The registry must accommodate all genuine Towers, including non-Persona families. Audit the remaining catalog against content design: put genuine Towers without approved stats in **In development**, with **Stats not yet defined**. Do not infer a playable identity from an asset filename or folder. Exclude the People Manager supporting character, source/reference variants and experiments; expose one canonical version per identity. Missing art and gameplay availability are independent states. Never invent unlock conditions.

## Architecture

### Home owns entry and return

Use a full-screen native modal dialog under `HomeScreen`, with its content loaded on entry. The small dialog/loading shell opens immediately, so a slow download still leaves a working Back control. Handle load failures locally. No new URL route is required for this first version.

Extend the campus scene and boot contracts with typed building hover/activation callbacks, focus highlight and an interaction-enabled setting. Resolve the nearest visible scene hit to avoid selecting the Lab through an occluding object. Hover styling uses an isolated overlay or cloned materials; it must not recolor other instances sharing materials.

The gesture owner records the down target, pointer identity and accumulated travel. Only a primary pointer released on the same building without exceeding the pan threshold activates it. Pointer cancellation, lost capture, a second contact and a disabled controller cancel activation. Hover clears on exit, drag and dialog entry. Refresh transforms before hit testing.

Keep the campus scene mounted while the dialog is open. Suspend pointer controls, camera transitions and ambient updates without changing the stored camera or user preferences. Centralize the effective pause condition as **ambience disabled OR document hidden OR browser open**, so visibility changes cannot restart the hidden Hub. Closing resumes only when the current preferences allow it. The preview also stops updating when the document is hidden.

Add **Inspect Towers** to the existing Lab information card for keyboard discovery, touch accessibility and the no-WebGL fallback. Trap dialog focus, keep Back visible, close on Escape and return focus to this control. Settings and Tower browser must not become overlapping modal dialogs.

### Separate content, asset bindings and presentation

Create a pure content registry for stable Tower identity, family, role, approved baseline, behavior kind, qualitative ability text and known availability. Keep Three.js, asset URLs and UI gauge thresholds outside content.

Author the accepted baseline from `Tower_Base_Stats.md` once in that content layer, with its provenance and design status. Use `resolveTowerStats` with no overrides, upgrades or external effects for compatible gameplay definitions. Represent unsupported passive/area/radial designs honestly in the reference schema; do not force them into the targeted simulation schema merely to render a gauge. This is reference-data authoring, not an implementation of the pending combat systems. Future gameplay alignment should consume these approved values rather than introduce a second balance table.

Join identities to delivered models in a rendering-side binding registry using `tower-asset:` imports. Preserve catalog validation and import-driven asset inclusion. Avoid loading the entire catalog in the browser or making unrelated undelivered drafts break the build.

A pure presentation adapter turns approved stats into labeled segments, qualitative descriptions and coverage diagrams. Define fixed documented scales across the roster; do not rescale when selection changes. Specify the metric behind each gauge: Damage per hit, Work throughput, action cadence, range, and total initial Compute investment. Describe Architect area damage and Linter per-projectile damage separately so their gauges do not suggest comparable aggregate damage. Analyst has support range and abilities, with no invented attack gauges. Work and damage remain alternative actions.

The UI exposes no raw stat numbers, costs, percentages or units, including tooltips and accessible labels. Render segment artwork as decorative and provide qualitative accessible text; avoid numeric meter semantics. Unknown data stays unavailable rather than becoming zero. Availability badges do not prevent inspection.

### Real 3D scene, accessible controls

Use a real, simple office/workbench environment and the canonical GLB model. Render text, buttons, portraits and gauges as React/CSS controls over the scene. Match v09's contact shadows, slim bevels and inset rails without baking interactive text into textures.

Keep the office composition fixed while inspecting the model. Use one showcase renderer with a fixed room view and a bounded preview view for the model/plinth; compose them against the same lighting and tabletop treatment without a visible rectangular viewer background. The preview camera can orbit and zoom independently of the desk and interface. The showcase is the only actively rendering view while open.

Model controls provide full horizontal rotation, bounded tilt and zoom, Reset, keyboard arrows and visible camera buttons. Scoping wheel/pinch/drag to the preview area prevents interference with the portrait rail and detail scrolling. Fit the model and its animation envelope with camera framing; preserve proportions and authored scale. On narrow screens, reframe the room and preview instead of shrinking the desktop UI.

Prepare lifecycle effects before animation starts. Use a skeleton-safe clone where needed and restore captured reference transforms and morph weights for Rest. One active mixer controls the selected model. Selection starts Idle, or Rest under reduced motion. If Idle is absent, use Rest.

The animation rail contains **Rest, Idle, Work, Move, Place, Hit, Resolve**. Map labels to delivered clip contracts; clearly mark unavailable choices. Keep authored playback speed and loop/once semantics. One-shots return to Idle, or Rest under reduced motion, with the selected button updated. Selecting a one-shot again restarts it. Reset effect visibility/material state on every clip or Tower change and on close. Animation completion has no gameplay effect. Provide no speed, timeline, transport, replay or loop controls.

### Loading and resource ownership

Lazy-load the browser code and environment. Use lightweight portraits rendered from canonical assets, with honest silhouettes for missing art. Do not instantiate a mixer for every portrait.

Give model requests an abort signal and selection generation token so a late response cannot replace a newer selection. Start with a cache of at most three parsed models and one live animated instance; lower the bound if profiling warrants it. Cache ownership must cover shared geometry/material disposal. On close, dispose preview controls, effects, mixers, renderer and GPU resources; keep only the remembered identity in Home state.

Loading and retry stay within the preview area; roster, stats and Back continue to work. A room load failure uses a quiet fallback surface. A model failure offers Retry. Context loss or unavailable WebGL leaves the accessible catalog usable. Repeated open/close and rapid selection must not leak event listeners, animation frames or GPU resources.

## Build sequence

Each phase ends with a reviewable running result. This ordering is a delivery sequence, not an extra permission gate.

### 1. Establish the roster and connect the main building

- Author and validate the initial seven approved definitions, canonical model bindings and the wider catalog classification.
- Add hover/focus feedback, gesture-safe activation and the visible Inspect Towers control.
- Open a working modal shell; pause and disable the Hub, then close and restore it correctly.
- Establish the browser's selection state and local failure boundary.

Likely files: existing `content/maps/campusHome.ts`, `rendering/campus/{types,camera,createCampusScene}.ts`, `app/boot/createHomeBoot.ts`, `app/home/{HomeScreen,HomeView,homeTypes}.tsx/ts`; new `content/towers/`, `app/showcase/` and a rendering-side asset binding module. File names are proposed; follow existing module conventions.

Exit check: mouse, touch and keyboard entry work; dragging never opens the browser; Home/Top camera and pan/zoom survive closing; paused ambience stays paused.

### 2. Complete one Tower inspection path

- Use Developer as the first fully functioning portrait, model and approved visual stats.
- Implement preview orbit/tilt/zoom/reset and animation selection, including complete Place/Resolve effects and Rest reset.
- Handle loading, retry, missing clips and rapid selection safely before scaling to the roster.

Likely new modules: `rendering/showcase/createTowerShowcaseScene.ts`, model loading/controls/playback helpers, `app/showcase/TowerShowcase.tsx`, `TowerVisualStats.tsx` and the pure stat adapter. Reuse `runtimeAsset.ts`, the catalog plugin and the existing digital presenter rather than importing diagnostic inspector code.

Exit check: a player can click the Lab, inspect Developer, play every delivered standard animation and return safely, including with reduced motion and after a preview failure.

### 3. Deliver the approved workbench art and UI

- Produce a small room, clear warm desktop and plinth, with a restrained campus window view. Reuse compatible campus geometry and materials where possible; do not render a duplicate Lab outside its own window.
- Reserve a new environment asset identity through the catalog and follow the asset workflow, source decisions, manifests and guarded delivery. The mock-up is the visual reference; it is not shipped as the scene background.
- Build tactile portrait plaques, stats console and animation rail with semantic design tokens, Mona Sans where appropriately bundled, and actual Octicon assets with licenses retained. Existing site-wide font changes are unnecessary for this screen.
- Keep model colors canonical, strong focus states and adequate contrast. Avoid adding decorative office objects absent from v09.

Production art follows [the asset workflow](../../.agents/skills/game-asset-workflow/SKILL.md), [asset storage rules](../../assets/README.md) and [Visual Asset Guide](Visual_Asset_Guide.md). Exact new asset IDs are assigned during authoring, not assumed to exist here.

Exit check: desktop screenshots and live interaction read as the approved Hub workbench, with the model as the focal point and no corporate logo wall or busy foreground.

### 4. Complete the collection and responsive behavior

- Add the remaining approved roles, delivered models, accurate placeholders and any verified additional Towers in the development collection.
- Generate canonical portraits, support previous/next and keyboard selection, and remember the last inspected identity for the visit.
- Add behavior-specific abilities and coverage illustrations; validate consistent visual scales and qualitative descriptions.
- On phones use a large preview, horizontal portrait rail and Stats/Animations tabs. Keep Back, selection and camera controls reachable; allow detail scrolling without rotating the model.

Exit check: the complete curated collection is inspectable; missing models never masquerade as locks, and desktop, tablet and phone layouts remain usable.

### 5. Verify behavior, presentation and deployment

| Verification | Required evidence |
| --- | --- |
| Campus integration | Extend `campusCamera.test.ts` / `homeBoot.test.ts` for click-versus-pan, cancellation, disabled controls, stale callbacks and suspension. Test hit/hover behavior against the floating building and occlusion. |
| Registry and stat adapter | Validate unique identities/current bindings, exclusion of reference/NPC entries, approved baseline mapping, fixed scales, unknown values, passive-only stats and per-hit versus area/projectile explanations. |
| Animation controller | Test missing clips, one-shot completion/reselection, Rest pose/morph restoration, lifecycle visibility reset, reduced motion and Tower changes during Resolve. |
| End-to-end | Extend `home.spec.ts` and add a showcase spec: actual building entry, accessible entry, close/Escape/focus, retained camera/preferences, selection, local errors, touch and narrow viewports. Verify no numeric stat readouts or playback controls in rendered UI and accessible names. |
| Runtime | Check selected-asset loading, out-of-order responses, hidden-tab suspension, context loss, repeated open/close and resource cleanup. Profile real desktop/phone layouts rather than assuming a frame-rate guarantee. |
| Visual review | Capture Developer at desktop and phone sizes plus another delivered Tower, missing-model and passive-stat states. Review Place/Resolve in motion, model framing, panel depth and room restraint against v09. |
| Build/deployment | Run typecheck, lint, dependency boundaries, affected tests and production build; include the existing `/TowerDefense/` deployment checks for lazy chunks and model URLs. Run the relevant shared effect renderer verification if its integration changes. |

Done means a user can enter through the main Hub building, browse every included Tower, inspect its real model where delivered, select animations and understand its capabilities visually, then return to the unchanged Hub view. Art or gameplay data that is not available must have an intentional, truthful state. See the delivery record above for current coverage.

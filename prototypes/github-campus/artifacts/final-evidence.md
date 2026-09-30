# GitHub campus prototype evidence

The disposable study runs at **http://127.0.0.1:5199/** and uses **all 29 canonical models in 209 placements**. It presents a coherent campus, three warehouse office floors, a café, sit-in library, meeting room with luminous curved wall, indoor park, exposed ceiling services, orange container studios, green contribution artwork in a glass atrium, a usable upper bridge/landing/stair connection, rooftop chess seating and contribution-pattern courtyard gardens.

The campus is an authored interpretation of the documented GitHub spaces. Only the historic building height follows the published 50 ft datum. The arranged campus, room dimensions and furniture positions are design proposals. The production GLBs and Blender sources remain outside this disposable prototype folder.

## Controls and states

Drag to orbit; scroll to zoom; right-drag or Shift-drag to pan. Touch supports one-finger orbit and two-finger pinch. Tour buttons open Campus, Warehouse, Library, Atrium, Terrace and Asset library. Cutaway reveals the selected warehouse floor; the floor menu selects Café, Work & read, or Meet & relax. Roofs and dusk/daylight can be toggled. Reset respects the selected floor. Changing a floor from Library enters the corresponding Warehouse view. Asset library loads every individual model for close inspection. The information dialog states the interpretation and research limits.

## Actual verification

`node prototypes/github-campus/verify.mjs` drives headless Microsoft Edge on desktop 1440×960 and phone 390×844. The latest machine-readable result is [verification.json](verification.json), with model SHA-256 values, prototype code hashes, input checks and renderer metrics. The pass loads and places all 29 actual GLBs, drives every tour state and all 29 asset choices, operates floor/roof/dusk/dialog controls, tests real pointer orbit/zoom, and performs actual CDP touch orbit and pinch on the mobile layout. Every visible phone control fits above the tour with a gap. [pixel-metrics.json](pixel-metrics.json) measures color variation and central-crop channel variance in every capture. Source asset hashes are checked again after the pass to ensure no model changed during capture.

All latest checks passed with no browser or network errors. The latest run contains 14 captures. There is no game progression or collision simulation, so gameplay bots and physics checks do not apply. Phone viewport and real browser touch checks passed; these are not performance measurements from a physical phone.

## Captures

| View | Desktop | Phone |
| --- | --- | --- |
| Campus | [Overview](desktop-campus.png) | [Overview](phone-campus.png) |
| Warehouse café | [Cutaway](desktop-warehouse.png) | [Cutaway](phone-warehouse.png) |
| Upper warehouse / finishing kit | [Meet & relax](desktop-warehouse-upper.png) | [Meet & relax](phone-warehouse-upper.png) |
| Library | [Reading niche](desktop-library.png) | [Reading niche](phone-library.png) |
| Atrium | [Artwork, bridge and stairs](desktop-atrium.png) | Covered by control and touch checks |
| Terrace | [Roof opening and furniture](desktop-terrace.png) | Covered by control and touch checks |
| Asset library | [Individual model](desktop-assets.png) | [Individual model](phone-assets.png) |
| Dusk | [Campus](desktop-dusk.png) | [Campus](phone-dusk.png) |

## Rendering and implementation

Overview: **103 calls, 195,040 triangles, 73 geometries and 30 textures** in the latest headless pass. Focused views use fewer calls. Frame interval measured about 8.3 ms on this machine; it is a desktop result. Pixel ratio is capped at 1.6. Sun shadows use one 2048² map. Compatible geometry is merged per named model branch; repeated floor, paving, foliage and furniture clones use InstancedMesh, preserving per-floor cutaway controls. Canonical embedded palette textures are shared, and no reference photographs are used as scene textures.

Only the landscape base and neutral asset-display pedestal are prototype geometry. All buildings, floors, roofs, furniture, services, vegetation and decorative pieces use the permanent models. A scoped server binds to loopback and serves only explicitly allowlisted prototype files, local Three.js vendor files and the 29 catalog-registered GLBs. Arbitrary workspace files cannot be served.

## Reproduction and disposal

Start with `node prototypes/github-campus/serve.mjs`, then open port 5199. Browser verification uses the bundled workspace Playwright and Python/Pillow paths recorded in `verify.mjs` and `pixel-metrics.py`. No dependency install or external service is required. Stop the server with Ctrl+C and delete `prototypes/github-campus/` to discard the study; the models and research remain.

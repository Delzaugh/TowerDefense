# GitHub campus prototype progress

Intent: a disposable spatial study using all 29 permanent GitHub office GLBs, with coherent exterior/interior rooms and a reusable asset review view. Preserve the Tower game's code and existing prototypes.

Completed: scoped loopback server on port 5199; local Three.js imports; actual canonical GLB loading; 209 placements; three furnished warehouse floors, café, library, workstations, meeting rooms, orange container studios, glazed contribution-art atrium, connecting bridge, roof deck with chess tables, courtyard seating, signage, thinking cat sculpture, planters and trees. Six tour states, floor cutaway, roofs, dusk, touch orbit/pinch, mouse orbit/pan/zoom and 29-choice asset library.

Read and applied: Three.js game director; UI designer and ui-patterns; QA release and release-checks. The prototype is a static architectural/art study, so game progression, combat, audio and bot-playtesting contracts do not apply.

Verification: desktop 1440×960 and phone 390×844; 101 checks and 14 captures; every GLB loaded and placed; all tour buttons and 26 asset-library choices; floors/roofs/dusk and dialog behavior; real mouse orbit/zoom; actual CDP touch orbit and pinch; phone controls fit and do not overlap tour; no browser/network errors; central scene pixel variance measured. Compatible model pieces merge per named branch and repeated floor/landscape/furniture objects use InstancedMesh. Initial full-campus rendering measured 100 calls, 195,040 triangles, 72 geometries and 30 textures; DPR is capped at 1.6. Frame interval in headless Edge on this machine measured around 8.3 ms; this is not a physical-phone benchmark.

Defects fixed: GLTFLoader's relative utility import; optimization boundary preserving the authoring root's named floor/roof branches; visible full-height corner poles during floor cutaways; obstructed library camera; mobile control row clipped beneath tour; floor plates covering stair passage; container meeting ensemble too deep for the container, replaced by two compact workstations; lounge shifted to clear the atrium connection stairs.

Complete: final bridge opening and receiving mezzanine captured; roof access opening and guarded landing captured; three finishing modules placed and reviewed in the upper-floor scene. Final source hashes remained stable through the browser pass. Evidence summary is in final-evidence.md.

Known limits: interpreted campus, not a measured reconstruction; no collision/occupancy simulation; no physical mobile-device performance test. No third-party photographs used as shipping scene textures. All production models remain outside this disposable folder.


# Glacier modular 3D campus

Run `node prototypes/campus-3d/serve.mjs`, then open http://127.0.0.1:5187/. The original SVG reference remains at port 5186.

The seven-tile campus spans 90 × 93.531 m: three slate foundations, two parks, one warm stone plaza and one hill tile. Four promenades connect the lab loop to a park commons, coffee plaza, meeting grove and hill corridor. Fifty-two decorative props include the existing kiosks, benches, sculptures, nooks and signs, plus 32 planting, bollard, table and noticeboard placements. There are 132 static instances; assets retain their authored metre scale and share geometry/materials between repeats. Two slate tiles leave room for future buildings.

The tile frame and texture live in registered Blender sources and embedded GLBs. The hill has actual raised terrain and a level central route; furniture stays on verified flat ground. There is no runtime tint or generated tile texture. Edge light streaks have been removed. light-lines.js now provides only the quiet grid in the void below the opaque campus. Cyan path rails, violet furniture accents and UI details retain the tech palette.

Home, Top down, Front and Left are accessible fixed camera presets. Drag pans across the campus without rotating. Wheel zoom follows the pointer; plus/minus controls zoom from 70–1000%. The percentage button resets both pan and zoom. Resizing adjusts framing; Home retains an 87 m minimum orthographic height and 129 m narrow-view width. Top down uses north-up framing. Front elevation is 0.58 radians; Left replaces Reverse.

The canonical copilot_base v02 remains at scale 1, with its authored idle hover/blink clip and an application-controlled 8 m stroll in front of the lab. It slows, pauses and turns; its limb-free design has no footstep clip. The amber ground ring remains faint (0.22 opacity, halo 0.045), with a small COPILOT badge. Pause/resume, reduced motion, document visibility and a 30 fps animation cap remain supported.

Building metadata supplies hover, focus and touch identification: mint outline, footprint glow and emphasized label, dismissible with Escape. Shared GLB materials remain untouched.

Validation: `node prototypes/campus-3d/verify.cjs`. It checks catalog exports, 12 joined tile edges, 45 walkway joins, an eight-tile growth fixture, real terrain clearance under furniture/routes, object overlaps, four camera presets, building feedback, companion clearance/motion and desktop/phone/touch layouts. Evidence lives in previews/verification.json, placement-audit.json, tile-growth-audit.json, scale-audit.json and screenshots. Explicit ?review=1 sessions expose deterministic evidence poses.

[Tile design, sources and exports](../../docs/design/Campus_Tile_System.md) · [Campus kit](../../docs/design/Campus_Kit.md).

Limits: presentation study; no simulation, saved progression, terrain-placement editor, hill climbing, operating doors or interior. Phone checks use browser emulation, not physical-device performance profiling. Small decorative details read mainly through silhouette and color at the overview scale.



Latest placement review: isolated bench relocated to the park pond; park meeting nook grouped with its coffee kiosk; central pond removed. Four registered campus_walk_landing models finish the outer routes. Join checks now include opposing directions and whole-network connectivity. See [Campus layout review]( ../../docs/design/Campus_Layout_Review.md ) for five proposed models and three home-screen improvements.

## Ambient life and performance

Five characters now inhabit the campus: the original Copilot, two plaza visitors with coffee, conversation, terrace and sculpture stops, Classic Low-Poly Octocat walking between the coffee stand and garden, and Lag Spike strolling the park path. Eighteen plant instances play Blender-authored breeze clips; café tables and kiosks emit larger soft steam plumes. Pause, reduced motion and hidden-page suspension apply to the complete scene.

Use the Performance button for frame cadence, CPU submission cost, draw calls including shadows, resources and loading measurements. Run node prototypes/campus-3d/benchmark.cjs separately from other tests for repeatable desktop/phone-viewport samples. The baseline held 30 FPS at approximately 364 overview draw calls; emulation does not certify physical phone performance.

[Assets, sources, exports and ambient routines](../../docs/design/Campus_Ambient_Life.md) · [Performance baseline and validation plan](../../docs/design/Campus_Performance.md).



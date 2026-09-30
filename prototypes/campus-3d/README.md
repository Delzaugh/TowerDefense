# Glacier modular 3D campus

## GitHub Pages

The public site now uses [Copilot Hub from the game application](../../game/README.md#github-pages). The old `/simulation/` address redirects to the Hub. The instructions below document the former prototype deployment; do not use its builder to update the current public site.

Public campus: https://delzaugh.github.io/TowerDefense/ — simulation: https://delzaugh.github.io/TowerDefense/simulation/.

The deployed site is a static snapshot in `pages-site/` on the remote `main` branch. `.github/workflows/campus-pages.yml` uploads only that directory and deploys through the existing `github-pages` environment. Changes to the snapshot or workflow on `main` trigger deployment; the workflow can also be run manually. The template is maintained in `prototypes/campus-3d/pages-workflow.yml`.

Build a fresh snapshot with `node prototypes/campus-3d/build-pages.mjs`. The output is `output/campus-pages/`, using `/TowerDefense/` as its URL base; `--out` and `--base` override those values. Replace the published `pages-site/` contents with the output and commit those files to `main` to update the public lab. Builds include registered runtime models, browser dependencies and their license notices, without Blender sources or captured test reports. The inventory stays outside the published directory at `output/campus-pages.manifest.json`.

Run `node prototypes/campus-3d/verify-pages.cjs` before publishing. This builds and tests the static site under its repository subpath with a phone viewport, including navigation, a full simulation, revision metadata, embedded screenshots and report download without a Node backend. Emulation verifies functionality and layout, not physical phone performance.

On GitHub Pages, simulation capture still runs automatically. After the run, tap **Download full report** to save the JSON with embedded screenshots to the device. GitHub Pages cannot write reports into the repository; the local server retains its automatic project-save behavior. Browser settings and placed towers are stored separately for each device and website origin.

Run `node prototypes/campus-3d/serve.mjs`, then open http://127.0.0.1:5187/. The original SVG reference remains at port 5186.

The seven-tile campus spans 90 × 93.531 m: three slate foundations, two parks, one warm stone plaza and one hill tile. Four promenades connect the lab loop to a park commons, coffee plaza, meeting grove and hill corridor. Fifty-two decorative props include the existing kiosks, benches, sculptures, nooks and signs, plus 32 planting, bollard, table and noticeboard placements. There are 132 static instances; assets retain their authored metre scale and share geometry/materials between repeats. Two slate tiles leave room for future buildings.

The tile frame and texture live in registered Blender sources and embedded GLBs. The hill has actual raised terrain and a level central route; furniture stays on verified flat ground. There is no runtime tint or generated tile texture. Edge light streaks have been removed. light-lines.js now provides only the quiet grid in the void below the opaque campus. Cyan path rails, violet furniture accents and UI details retain the tech palette.

Home, Top down, Front and Left are accessible fixed camera presets. Drag pans across the campus without rotating. Wheel zoom follows the pointer; plus/minus controls zoom from 70–1000%. The percentage button resets both pan and zoom. Resizing adjusts framing; Home retains an 87 m minimum orthographic height and 129 m narrow-view width. Top down uses north-up framing. Front elevation is 0.58 radians; Left replaces Reverse.

The canonical copilot_base v02 remains at scale 1, with its authored idle hover/blink clip and an application-controlled 8 m stroll in front of the lab. It slows, pauses and turns; its limb-free design has no footstep clip. The amber ground ring remains faint (0.22 opacity, halo 0.045), with a small COPILOT badge. Pause/resume, reduced motion, document visibility and a 30 fps animation cap remain supported.

Building metadata supplies hover, focus and touch identification: mint outline, footprint glow and emphasized label, dismissible with Escape. Shared GLB materials remain untouched.

Validation: `node prototypes/campus-3d/verify.cjs`. It checks catalog exports, 12 joined tile edges, 45 walkway joins, an eight-tile growth fixture, real terrain clearance under furniture/routes, object overlaps, four camera presets, building feedback, companion clearance/motion and desktop/phone/touch layouts. Evidence lives in previews/verification.json, placement-audit.json, tile-growth-audit.json, scale-audit.json and screenshots. Explicit ?review=1 sessions expose deterministic evidence poses.

[Tile design, sources and exports](../../docs/design/Campus_Tile_System.md) · [Campus kit](../../docs/design/Campus_Kit.md).

Limits: presentation study with a separate wave-simulation map; no gameplay simulation, saved progression, terrain-placement editor, hill climbing, operating doors or interior. Phone checks use browser emulation, not physical-device performance profiling. Small decorative details read mainly through silhouette and color at the overview scale.



Latest placement review: isolated bench relocated to the park pond; park meeting nook grouped with its coffee kiosk; central pond removed. Four registered campus_walk_landing models finish the outer routes. Join checks now include opposing directions and whole-network connectivity. See [Campus layout review]( ../../docs/design/Campus_Layout_Review.md ) for five proposed models and three home-screen improvements.

## Ambient life and performance

Five characters now inhabit the campus: the original Copilot, two plaza visitors with coffee, conversation, terrace and sculpture stops, Classic Low-Poly Octocat walking between the coffee stand and garden, and Lag Spike strolling the park path. Eighteen plant instances play Blender-authored breeze clips; café tables and kiosks emit larger soft steam plumes. Pause, reduced motion and hidden-page suspension apply to the complete scene.

Use the Performance button for frame cadence, CPU submission cost, draw calls including shadows, resources and loading measurements. Run node prototypes/campus-3d/benchmark.cjs separately from other tests for repeatable desktop/phone-viewport samples. The baseline held 30 FPS at approximately 364 overview draw calls; emulation does not certify physical phone performance.

[Assets, sources, exports and ambient routines](../../docs/design/Campus_Ambient_Life.md) · [Performance baseline and validation plan](../../docs/design/Campus_Performance.md).

## Dedicated wave simulation

Open **Simulation map** from the campus header, or visit [the map](/simulation/) on the same server. The independent scene is implemented in simulation/. The campus retains its own ambience and baseline performance panel.

Garden Switchback v3 keeps double the original ground area (approximately 133 × 93 metres), retaining authored model scale and the 4.4 m path width. It is a seeded map concept with a rounded winding path, separated tower pads, and 200 environment placements including trees, benches, flower beds, bushes, rocks, signs and coffee kiosks. All character and decor models come from registered runtime GLBs. The active footprint sits inside a continuous 520 × 460 m height field, with hills, river banks, connecting roads and 420 instanced woodland trees. Twenty registered KayKit pieces form a research outpost, cargo commons and power station. Structure scale/placements and height bounds are included in captures. Terrain, route and attack lines are presentation geometry. Seed 230924 and the recorded decor transforms make comparisons reproducible.

Choose **20, 35 or 50 towers**. The **Settings** menu independently toggles Bert and Octocat, defaults both on, and remembers the choices in this browser. Settings and camera movement are locked during recording. Scroll to zoom toward the cursor, drag to pan, and use Reset to restore the current view. Zoom spans 60–600%; both camera presets restore the overview. When enabled, two Berts occupy tower slots; disabling Bert fills those slots from the regular mix without changing the selected total. Remaining slots alternate Developer and base Copilot. When enabled, two Octocats stand by the destination and are outside the tower/enemy totals.

The right **Place towers** palette contains Copilot, Developer, Rubber Duck, Shield, Golden Compiler, Commit Halo and Linter. On narrow screens open **Build**. Select a card, then click a clearing; the ghost and cursor label indicate whether placement is valid. Click again to keep building, drag to pan, or press Escape / Done to leave placement mode. A short drop-and-ring effect marks each placement and respects reduced motion. Roads, water, structures, steep slopes, occupied positions and reserved preset slots remain clear.

Added towers have **no numeric placement cap** and do not consume the preset 20/35/50 slots. Undo and Clear Added affect only manual towers. Their layout survives preset/settings changes, completed runs and reloads in this browser. The total tower counter and report distinguish preset, manual and combined counts. Added towers aim and show attack lines during waves; those with authored work clips play them. Beam capacity grows with the tower count. Editing is locked during automatic recording so its baseline and cleanup stay comparable.

Copilot, Bert and Developer play their authored work clips during waves. Developer revision 12 includes idle, work, move, place, hit and resolve. The map uses its idle ready pose while stopped; manually placed Developers use the shared digital cube assembly and reverse disintegration when removed. A shared 256-fragment budget bounds simultaneous effects. Reduced motion skips placement/removal effects. Movement and hit clips remain available in the GLB; this stationary, non-damaging simulation does not trigger them.

**Start simulation** automatically records three waves scaled to the selected cap: **80, 120 and 200 enemies** at the default (400 total over the run). The mix cycles evenly through problem_bug, problem_vague_spec and problem_missing_details. Enemies follow the displayed route with three lane offsets. The scheduler enforces a hard cap of **25–500 active enemies**, default **200**, queuing overflow at entry until space opens. The saved Maximum enemies setting controls both the active cap and the wave sizes. Enemies reach the destination and leave; there is no damage, killing, economy or combat-balance simulation. Enemy speed factors are Bug **1.25×** (12.5 m/s), Vague Spec **0.75×** (7.5 m/s), and Missing Details **1×** (10 m/s); movement clip playback follows the same relative factor. A typical run takes about 100 seconds at the 30 FPS target. The map remains still until explicitly started, including with reduced motion enabled.

Warmup, baseline, consecutive wave samples, peak load, recovery and paused-frame checks run automatically. Timestamped reports and map PNGs save under previews/stress/. Reports identify scene garden-switchback-v3 and include source/GLB hashes, map seed and layout, chosen tower count, saved settings, enemy speed factors, model composition, wave events and arrivals, active/queued enemy counts per frame, frame intervals, CPU submission, render counters, browser/device details, errors and cleanup checks. These measurements do not include GPU execution time or VRAM. They cannot certify phone hardware performance from desktop emulation.

**Download full report** exports portable JSON with embedded screenshots. This is also the automatic fallback if project saving fails. The separately labelled **Save live snapshot** in the Performance drawer captures only the current rolling sample. Stop, hidden-page and resize interruptions preserve a partial report and remove all enemies.

Run **node prototypes/campus-3d/simulation/verify.cjs** separately from other benchmarks. It checks the scheduler under different step sizes, cap and queued overflow, all three enemy types, all toggle combinations and cap persistence/validation, pointer navigation/reset/recording lock, grounded actors, configured Octocat/Bert counts, Developer mixing, distinct travel speeds, doubled area, selectable tower counts, animation advancement, path/tower clearance, full desktop and phone-emulated runs, saved PNG/JSON captures, cleanup and cancellation. verify-stress.cjs forwards to this check. verify.cjs still verifies the campus, and benchmark.cjs measures the campus baseline.

Placement verification: `node prototypes/campus-3d/simulation/verify-placement.cjs` checks all seven palette models, cursor hit testing, invalid positions, click versus drag, persistence, preset independence, Undo/Clear and a complete capture with 65 manual plus 50 preset towers, as well as the phone palette. Evidence is saved in previews/placement-verification.json.

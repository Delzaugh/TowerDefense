# Primer-inspired game UI concepts

Concept study, 2026-09-30. Three interactive directions cover the battlefield HUD, campus hub, buttons, tower controls, feedback, settings, pause, victory and defeat. Sample values illustrate hierarchy; this study does not change gameplay or balance. The scene backdrops are captures of the current campus and the existing Garden Switchback presentation study.

## Direction

Use Primer's restraint, familiar action hierarchy and semantic roles within the game's friendly technical world. Keep the world dominant. Controls should read as a playable toolkit with modest depth, portraits, hotkeys and responsive feedback.

| Concept | Composition | Strength | Tradeoff |
| --- | --- | --- | --- |
| **Field kit** | Separate survival/resource clusters, bottom build dock, corner inspector, one green wave action. Campus has a compact continue panel and destination controls. | Clearest starting point; stable control positions and familiar GitHub dark surfaces. | The selected-tower panel needs careful placement on small screens. |
| **Command deck** | Shared top status ribbon, vertical tower rail, tactical inspector and incoming-wave strip. Hub destinations share a bottom command bar. | Strong planning structure and the closest fit to the established campus slate palette. | Uses more of the screen edge; the vertical rail becomes horizontal on phones. |
| **World anchors** | Small global counters, Product meter near the objective, tower inspector near the selection, compact build dock. Hub buildings have destination pins. | Strongest connection between the interface and the world. | Anchors need collision handling and must fall back to fixed screen zones when crowded. |

**Recommended:** start from Field kit, use the campus slate/teal tones where they improve cohesion, and adopt World anchors for brief labels and local feedback. Keep survival and the main action in stable positions.

## Primer translated into game controls

| Primer reference | Game application |
| --- | --- |
| [Button](https://primer.style/product/components/button/) | One strongest action per group: Start wave, Resume, Retry, Continue. General actions use neutral surfaces. Restart is a separate danger action. |
| [IconButton accessibility](https://primer.style/product/components/icon-button/accessibility/) | Small pause, audio, camera and settings controls have accessible action names and distinct silhouettes. Game touch targets aim for 44 px. |
| [SegmentedControl](https://primer.style/product/components/segmented-control/) | Build / Defend / Auto switches apply immediately to the selected target-capable Copilot. Passive Personas receive their own appropriate controls. |
| [ProgressBar](https://primer.style/product/components/progress-bar/) | Pair a health meter with a stable numeric value. Wave segments indicate progression; neither uses ornamental framing. |
| [AnchoredOverlay](https://primer.style/product/components/anchored-overlay/) | Selected-tower information can appear near the tower, with a fixed corner fallback. |
| [Color usage](https://primer.style/product/getting-started/foundations/color-usage/) | Neutral surfaces, blue/teal selection and focus, green ready/positive actions, amber attention, red immediate danger. Reinforce each with labels and shapes. |
| [Typography](https://primer.style/product/getting-started/foundations/typography/) | Mona Sans already exists in the game. Use compact text, clear weight differences, and tabular numbers for changing values. |
| [Octicons](https://primer.style/octicons/) | The game already includes Octicons. Use them for system actions; keep recognizable character portraits for Copilot identity. The interactive study uses the preview host's supplied line icons. |

## Interaction and hierarchy

- Prioritize Product health, the current wave, available Compute, and the immediate build/start decision. Keep Technical Debt compact until its consequence becomes relevant. Product growth is a post-level visual reward.
- Use a thin neutral border, opaque surface, 6–8 px corners and a small shadow. Hover brightens and rises subtly; press settles; keyboard focus uses a clear accent ring. Avoid broad glows and persistent translucent panels over busy terrain.
- Locked options remain discoverable and explain the unlock requirement on activation. Do not rely on faded color alone.
- Pause blocks tactical edits. Its overlay offers Resume first, then Settings and return to the hub.
- Place positive work feedback near its event and keep warning messages short. Avoid stacking banners over the route.
- Keep menus brief: resume/retry/continue first. Hub destinations belong to the campus or its edge controls. Engineering diagnostics remain outside the player interface.
- Respect reduced motion. Prefer 100–150 ms state transitions over perpetual HUD movement. Use sound only as optional reinforcement.

## Review and limits

Desktop and phone captures of the existing UI informed the study. The concept preview is checked for layout and local interactions at 1,024, 736, 390 and 320 px. Presentation values and scenes are illustrative; production wiring, world-to-screen collision avoidance and physical-device performance remain implementation work.

Interactive source: [dark toolkit](tower-primer-concepts.html) and [light toolkit](tower-primer-light.html). These are self-contained visualization fragments with embedded reference imagery; render them through the Codex visualization host for its supplied icons and Tweak controls.

## Hub home and Tower inspection extension

The Field kit direction now has a connected pair of full-screen designs: [dark Hub and inspection](hub-and-tower-inspection.html) and [light Hub and inspection](hub-and-tower-inspection-light.html).

**Hub home:** keep the campus as the main subject, with a restrained wordmark, corner settings and ambience controls, one saved-run panel, and a small destination dock. The Copilot Lab has an entrance label near the building as well as an accessible button in the dock. Home and Top views use captures of the current campus. Continue is the strongest action; Product, Levels and inspection use neutral controls. The saved run is sample presentation content.

**Tower inspection:** show the selected model on a large workbench, keep capability information in one quiet side panel, and move the seven core Persona portraits to a bottom strip. On phones, the model comes first, portraits second and capabilities third, so selection stays close to the preview. The preview includes captured Front, Left and Right views of Base, Developer, Security and Linter. These are view-switching mockups; production keeps its live 3D orbit and zoom.

Preserve the catalog's qualitative, fixed-scale capability gauges. The study uses the current values and scale definitions from `game/src/content/towers/catalog.ts` and `game/src/app/showcase/visualStats.ts`. Analyst remains passive, with Range and Compute plus expandable ability descriptions. Missing models have a clear preview placeholder while their role and stats remain readable. Model availability and campaign availability are separate states. Future development-collection Towers are outside this focused Persona-screen study.

Navigation, portrait selection, angle changes, ability disclosure, campus camera choices and settings work locally in the concepts. Checked at 1,024, 736, 390 and 320 px, with captures and `hub-lab-review.json` beside the source. Production UI and game rules are unchanged.
## Light appearance and production integration

The light toolkit uses the same hierarchy and geometry as the dark designs: white panels on soft grey surfaces, graphite text, blue selection and focus, and green primary actions. World lighting stays authored; theme changes never invert the canvas or recolour models.

The production Field kit is a reusable native React toolkit in `game/src/ui/toolkit/`. Hub, Tower inspection and the existing encounter test map share semantic tokens, buttons, segmented controls, surfaces, gauges and appearance settings. Appearance can be Dark, Light or System and persists independently of campus motion preferences.

Only currently supported actions are implemented. The campaign save, Product and Levels content shown in the concepts remains illustrative. Inspection keeps all existing collections, live orbit/zoom controls, missing-model recovery and approved qualitative capability scales.

Primer's guidance underpins the semantic light/dark palette: [Color usage](https://primer.style/product/getting-started/foundations/color-usage/). The game uses its own lightweight components with the existing Octicons and Mona Sans dependencies.

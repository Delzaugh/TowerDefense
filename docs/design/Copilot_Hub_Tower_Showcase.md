# Copilot Hub — central building and Tower showcase

Status: Final v09 direction implemented in the Hub. Click the main Copilot Lab building or use Inspect Towers to open the browser. See the [build and delivery record](Copilot_Hub_Tower_Showcase_Implementation.md) for code integration, remaining asset dependencies and verification.

Latest user revision: retain the room and portrait rack, expand Stats into a full panel on the right without info icons, and use the freed animation-rail area for a larger model preview. There are no manual animation controls: Tower changes automatically Resolve the outgoing model and Place the incoming model. Returning to the Hub reverses the entrance camera move. These decisions supersede the earlier control and compact-panel descriptions retained below as design history.

## Intent and visual direction

The central Copilot Lab is the campus entrance to a collection of inspectable Towers. This is a game collection screen: the character model, its role and its capabilities lead. Avoid an administrative asset list, dashboard tiles or a long details page. The user accepted the imagined office as the starting point for Tower browsing, then explicitly requested removal of the GitHub back-wall logo and less decoration in the foreground and backdrop. Keep the low-poly world, warm worktable, ivory/blue-gray architecture and a restrained view of the Hub. Primer Brand typography, dark compact equipment, indigo selection accents and teal signals form the interface vocabulary. The room should support legibility, with game identity in the HUD and no GitHub branding in the scenery.

The first three directions are illustrated in [the original mock-up set](../../design/mockups/copilot_hub_towers/v01/README.md). The user requested [refinements of 2 and 3](../../design/mockups/copilot_hub_towers/v02/README.md), requiring the interface and existing Hub assets to feel like one world, then selected **3 — Hub Tower Codex**. The [v03 refinement](../../design/mockups/copilot_hub_towers/v03/README.md) introduced animation selection only and visual stats without numbers. The user found its buttons too flat and disconnected from the Hub; [v04](../../design/mockups/copilot_hub_towers/v04/README.md) introduced tangible low-poly controls. [v05](../../design/mockups/copilot_hub_towers/v05/README.md) explored GitHub product-inspired graphite and green. [v06](../../design/mockups/copilot_hub_towers/v06/README.md) responds to the user's specific Primer Brand, theming, Octicons and display-color references. [v07](../../design/mockups/copilot_hub_towers/v07/README.md) carries this into a close view of the station and its surrounding architecture. The [v08 companion office study](../../design/mockups/copilot_hub_towers/v08/README.md) responds to the latest request to imagine GitHub as a physical workplace, showing an inhabitable room with the inspection station at ordinary furniture scale.

1. **Tower Showroom — earlier alternative.** A large model on a hexagonal plinth, a compact shaped stats plate and seven portrait sockets along the bottom. Retained for comparison.
2. **Hub Lab Workbench.** Reveal an inspection bay inside a cutaway of the existing central Lab. Reuse its off-white slabs, blue-gray window frames and the Hub's neutral daylight. A plain bench holds the preview, a stats console and physical portrait selection rail. The proposed interior requires new art in the same asset language, plus a responsive presentation.
3. **Hub Tower Codex — selected.** A physical catalog station at the office's shared oak worktable, with a portrait dossier rack, live model plinth and small stats panel. Controls adopt quiet dark neutrals, pale indigo selection signals and a small check marker. The collection treatment is grounded in the GitHub-inspired Lab office and visible surrounding Hub.

The [approved combined interface](../../design/mockups/copilot_hub_towers/v09/README.md) places the Tower collection and inspection controls at a clean worktable in a simplified version of the v08 office. Its portrait rack, open model plinth, stats panel and animation rail share one view, with low-contrast room geometry around them. The final v09 cleanup incorporates the user's direction to remove wall branding and decorative clutter. This is the visual target for implementation.

The images explore presentation, not new Tower designs. Actual runtime models remain authoritative; generated thumbnails or silhouettes do not create new asset requirements. The user's Codex selection supersedes the earlier Showroom recommendation. The implementation requirements below incorporate the latest animation and stat-display decisions.

World continuity is a design constraint: use the same matte materials, chunky simple geometry, restrained bevels, orthographic camera language and daylight as the Hub. Interior details inherit the Lab and campus prop kit: ivory slab faces and blue-gray frames. Inset equipment uses dark neutrals, light text, pale indigo selection accents and muted teal secondary signals. A restrained indigo/blue display wash can connect the station to the digital atmosphere. Keep the room bright and the canonical character colors unchanged. Matte color does not mean flat controls. Decorative slogans, ornate armored frames, realistic material textures and cinematic lighting are outside this direction.

Controls have tangible depth with simpler Brand proportions: animation choices are low-profile rounded rectangles seated in a recessed rail, with one slim lower lip, a subtle top highlight and short contact shadow. The active choice sits lower with a pale indigo face, dark label and check marker. Back to Hub and camera Reset share this construction at their appropriate sizes. Portrait plaques and stat-meter tracks use related edges and shadows. Reduce oversized keycaps, stepped armor frames and ornamental lamps. These visual treatments must still be implemented with accessible interactive controls and a clear keyboard focus state.

Use [Primer Brand](https://primer.style/brand/) for heading hierarchy, spacing and simple control shapes, with sentence-case labels and small leading icons. The [theming guide](https://primer.style/brand/introduction/theming/) supports light/dark zones; the proposal applies this to a light physical Lab and dark equipment. Use semantic tokens for surfaces, text, borders and interaction states. Display accents are selected from the user's [Primitives display scales](https://primer.style/primitives/storybook/?path=/story/color-base-display-scales--all-scales); the indigo/teal combination is this mock-up's art direction, not a mandatory GitHub theme. Preserve the game's identity and three-dimensional composition. Capability meters use quiet indigo segments, with teal for the separate Compute meter; labels, icons and fill length distinguish them without numbers.

Use actual [Octicons](https://primer.style/octicons/) SVGs in implementation, with consistent optical size. Proposed mappings: Damage `zap`, Work `code`, Action speed `meter`, Range `crosshairs`, Compute `cpu`; animation choices Rest `moon`, Idle `pulse`, Work `tools`, Move `arrow-both`, Place `package`, Hit `zap`, Resolve `sparkle`. Camera Reset uses `sync`, and Back to Hub uses `arrow-left`. Raster mock-up icons are approximations, not production icon assets. Source observations, palette values and generation prompts are recorded with v06.

## Office environment — Copilot Studio proposal

The Codex station belongs to a compact studio inside the Lab. The v07/v08 images explore the room's architectural vocabulary; the user selected the office as the basis for v09, then requested a simpler game-focused backdrop. Keep the workbench at a believable scale. The existing exterior Lab remains the architectural reference; this is a proposed new interior, not an exported asset. Frame the controls closely, with plain wall geometry and a modest campus window providing context.

- Seat the collection rack, open model plinth, slim stats panel and animation rail on the shared oak worktable. Keep its surface continuous and visible between the compact controls. The preview character occupies real scene space above its plinth, not a flat image on a simulated monitor.
- Use only a few large architectural planes: ivory slabs, a blue-gray/ink backdrop behind the model title and understated window framing. Keep natural daylight and matte, low-poly materials.
- Keep a simple window view of nearby paths and a few faceted trees. Reduce its contrast and detail so the model and UI lead.
- Leave the desktop and foreground clear of plants, mugs, books, chairs and decorative props. Keep the desk's warm color, with no realistic wood-grain detail.
- Omit the GitHub wordmark, Octocat marks, contribution-wall tiles, branching pendants, coffee setup, wall slogans and busy review-room dressing from the browsing view. The Copilot game identity remains in the HUD.
- Preserve physical depth and clear selectable states in the actual controls. Keep the animation-selection and non-numeric-stat requirements.

The v08 environment study remains a historical source for the palette and human-scale worktable. Its decorative office details and brand signs are not requirements for the player-facing interface. Current presentation follows the user's simpler-background correction. The imagined setting does not depict an existing GitHub office.

## Default browsing and inspection view

Opening the Lab frames the active worktable. The left portrait rack browses the collection; choosing a Tower updates the central model, role and right-hand gauges in place. The player can inspect another Tower without leaving the view or pressing an additional Inspect action. The selected model sits above the tabletop plinth with orbit/tilt/zoom and camera reset. Animation choices run along the near desk edge. Keep the seven initial choices visible at desktop size and maintain a single clear selection state. Back to Hub stays at the upper right. The office provides spatial context; it does not require an extra room-navigation step to access the collection.

## Entering from the campus

- Hovering the visible central building adds a narrow mint outline, a soft footprint glow and a small anchored label: **Copilot Lab / Inspect Towers**. The rest of the campus stays normal. Use a short ease-in, not continuous flashing or a bouncing building.
- A click opens the showcase through a brief 200–300 ms spatial reveal from the Lab into the workbench. Keep the underlying Hub camera unchanged so returning preserves its exact position. Reduced motion uses an immediate transition.
- Campus drag and wheel gestures keep their current behavior. A pointer travel threshold distinguishes a click from a pan; cancelled gestures, multi-touch gestures and releasing a drag over the Lab never open the menu. Preview pinch zoom is separate from the campus's existing controls.
- Touch taps open directly. Keyboard users can focus a corresponding **Inspect Towers** control; focus gives the same building highlight, Enter/Space opens it. The control is available without discovering hover.
- Close or Escape returns to the exact previous campus view, zoom and ambience preference. Restore keyboard focus to the entry control. A clearly visible **Back to Hub** control is always available.

## Tower selection

- Present a portrait roster rather than a text list. Each item has a name, role icon and a distinct selection state; category filters become useful only when the collection grows.
- The initial roster with approved playtest stats is **Base Copilot, Developer, Tester, Analyst, Security, Architect and Linter Agent**. Include other current Tower models in an **In development** collection when they do not yet have approved gameplay definitions; their models and animations remain inspectable, with **Stats not yet defined** instead of fabricated values. Do not hard-code the collection to seven entries. A Tower registry must support non-Copilot families, distinguish actual Towers from NPCs and experiments, and use one current canonical version rather than displaying old revisions as extra Towers.
- All approved Towers can be inspected, including those locked for play. Availability is a separate badge with the actual unlock condition when known. Do not invent unlock milestones for Architect or Linter.
- If approved model art is not yet delivered, show an intentional silhouette and **Model preview coming soon**. Keep its approved role and design stats inspectable; do not substitute an unrelated asset.
- Remember the last inspected Tower for the visit. Use previous/next controls and keyboard navigation. On touch, swipe the portrait rail; dragging inside the model area rotates the model instead.

## 3D model and animation controls

- One selected model is visible on a small plinth. Drag to orbit through 360°; vertical drag tilts within a useful range, approximately 15–75° above the floor. Wheel/pinch zoom is bounded. Reset view returns to the authored showcase framing.
- Provide visible reset and rotation/tilt controls for users who cannot drag. Keyboard arrows rotate/tilt while the preview is focused; they do not hijack navigation elsewhere.
- Keep model proportions, palette, geometry and authored scale relationships intact. Camera framing fits the model; it does not deform it. Give large animation poses enough room to avoid clipping.
- Animation choices: **Rest, Idle, Work, Move, Place, Hit, Resolve**. Map these to the delivered clip contract, with arrival names such as `spawn` where appropriate. Rest stops animation and restores the reference pose; it is not a fabricated clip.
- Animation selection is the complete player control: no play/pause button, scrub timeline, speed selector, replay button or loop toggle. Selecting a choice starts it automatically at its authored speed. Rest provides the still pose. Loop authored looping actions; play arrival, hit and resolve once, then restore Idle and its selected state so the preview never stays unexplainedly empty. Clicking a one-shot choice again repeats it.
- Use the shared lifecycle presentation for digital Place/Resolve effects. Reset effect state when changing Tower, changing clip or returning to Rest. Merely selecting a Tower should use a quiet idle, not replay a dramatic entrance every time.
- Show only available clips as playable. A missing animation gets an explicit unavailable state rather than an empty button that silently does nothing. Reduced motion starts in Rest; deliberately selecting an animation plays that choice. A one-shot returns to Rest when reduced motion is active.

## Stats that explain the Tower

Stats come from the Tower's approved gameplay definition and shared resolution logic, not from mesh geometry, visual size or a second hand-maintained UI table. Player-facing presentation is visual only: named icons, consistent segmented gauges and coverage diagrams. Do not expose stat numbers, percentages, per-second figures, units, Compute prices or totals in this inspection screen, including in hover details. Remove development labels such as **Playtest stats** from the player UI. Production data must be aligned with approved definitions before implementation; diagnostic fixtures are not a substitute.

The default display is the Tower's initial configuration. Do not mix hypothetical upgrades or run-specific modifiers into those values.

| Visual | What it communicates |
| --- | --- |
| Four concise segmented gauges | Icons and labels **Damage**, **Work**, **Action speed** and **Range**, with no numeric readouts. Keep a fixed, documented scale per stat across the roster; the underlying values remain accurate. Action speed is a Tower stat, not a playback control. |
| Range diagram | An unnumbered radius ring on a miniature test surface. This is an illustrative coverage diagram, not a promise about real map occlusion. Explain shape and obstacle rules with a short qualitative description. |
| Compute meter | A small chip icon and a separate expenditure gauge communicate relative investment visually. No placement price, upgrade price, plus sign, multiplier or total is printed here. This does not turn Personas into independently purchased placements. |
| Ability emblem and short description | Passive/special behavior and affected targets, explained qualitatively with icons or small diagrams. No numeric ability breakdown. |
| Accessible descriptions | Meaningful qualitative equivalents such as **high Work output** and **medium range**, rather than hidden numerical tooltips or raw screen-reader values. Color is reinforced by label, icon and fill length. |

Internally derive the Developer's gauges from its accepted baseline in the stats document. Its Work output and action cadence sit at the upper end of the initial roster, range is moderate, and per-action damage is below the Architect's. Compute indicates relative total investment. Do not turn these into an invented overall power score. Work and damage remain alternative actions, not simultaneous throughput. The numerical stat model stays internal to the game and is not changed by this presentation choice.

Adapt the display to behavior. Analyst shows support range and its two passive abilities, with no invented attack-speed or damage gauges. Architect explains its area impact; Linter explains projectiles and volleys. Do not compare aggregate burst values to single-target damage as if they were the same metric. Any later comparison uses paired visual meters and qualitative differences, not numerical deltas.

Source: [Tower and Copilot core properties and stats](../Tower_Base_Stats.md). The accepted playtest design and implemented diagnostic values currently differ; gameplay alignment is a separate feature.

## Screen sizes and runtime behavior

- Desktop: physical portrait collection at left, dominant model area in the middle, stats at right and a single animation-choice row along the desk edge. Keep the surrounding room quiet and free of corporate branding and foreground clutter. Fit the default inspection view without a page-length scroll.
- Phone: full-height game overlay, model in the upper area, horizontal portraits, and bottom tabs **Stats / Animations**. Keep the model visible when switching tabs and allow the detail pane to scroll. Use large touch targets rather than shrinking the entire desktop composition.
- Opening the Codex suspends the outer campus update loop. Its Lab interior and visible nearby park use the same asset palette, lighting and world layout; do not show a second copy of the Lab through its own window. Render only the selected preview Tower and dispose/reuse it on selection. Closing resumes the campus only if it was running before.
- Lazy-load the showcase and selected asset, cache a small recent selection set, and use lightweight authored thumbnails for the roster. Do not instantiate every Tower's scene/mixer at once.
- Model loading and errors stay inside the plinth area with Retry, so selection, stats and Back to Hub continue to work. No-WebGL mode still supplies portraits, roles and stats with a clear unavailable preview message.
- Dialog focus stays within the showcase. Labels, qualitative stat descriptions and buttons are real accessible UI; their presentation can use bevels and simple physical plates without becoming baked text textures.

## Implementation sequence and checks

1. Connect the existing central building identity to hover/focus highlighting and click/tap activation. Reuse its actual animated world transform so hit tests follow the floating campus. Avoid modifying shared asset materials globally.
2. Introduce a curated Tower registry joining gameplay identity, title, role, availability, canonical model and clip/presentation contract. Resolve Base v02 and avoid duplicate legacy entries.
3. Build the selected Codex shell with roster selection, close/focus restoration and loading/error states. Add the selected model's orbit/tilt/zoom controls and animation-choice strip with automatic playback.
4. Bind approved stats internally to consistent visual gauges and ability-specific displays without numeric readouts, then add responsive and reduced-motion behavior.
5. Verify hover exit, drag-versus-click, touch activation, keyboard access, camera restoration, resource disposal, rapid Tower switching, one-shot effect reset, locked/model-missing entries, behavior-specific stats and the absence of numeric stats and playback controls.

The player-facing browser is implemented without changing combat or unlock rules. The [implementation and delivery record](Copilot_Hub_Tower_Showcase_Implementation.md) documents entry through the main Hub building, delivered art and current asset coverage.

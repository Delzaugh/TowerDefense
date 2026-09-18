# Hub layout studies — v02

**Selected direction: [Glacier — iteration 05, option 2](v05/02-glacier.html).** The root entry opens Glacier. Open `v05/index.html` to compare all three variations, or run `node prototypes/hub/v05/build.mjs` to rebuild them. See [the recorded selection](v05/README.md). The [accepted v04 reference](v04/README.md) and [three iteration 03 campuses](v03/README.md) remain preserved. The files documented below are iteration 02; `v02-index.html` is their comparison menu.

The second pass replaces the website-style layouts with full-screen game menus: a world as the main background, controls anchored to the viewport, short labels, chunky button depth, and game overlays. Main screens do not scroll. The original versions are preserved in `v01/` and linked from the comparison menu.

Open `v02-index.html` to compare these three earlier concepts, or open any prototype directly. The root `index.html` opens the latest Circuit Garden refinement. Each HTML file includes its own CSS, JavaScript, icons, and original SVG illustrations. There are no network dependencies or build requirements for viewing.

| Prototype | Layout idea | Primary iteration question |
| --- | --- | --- |
| `01-campus.html` | Campus HQ: full-screen world, floating main-menu buttons, large Continue action | Does the hub feel like a place worth returning to? |
| `02-mission-control.html` | The overworld: connected level islands, selectable nodes, anchored launch tray | Is picking the next level tactile and immediately clear? |
| `03-release-desk.html` | Copilot bay: large character showcase, hangar platform, Persona carousel, Play action | Does the team make the hub feel alive? |

The existing filenames are retained so links continue to work. The third concept has been replaced entirely; it is now a hangar, despite its original filename.

## Interactions

- Continue a sample saved run → briefing → planning preview → return to hub.
- Browse levels; Level 01 is available, Scope Creep and Release Friday are clearly labeled future theme concepts.
- Open Developer, Tester, Analyst, and Security details. Analyst unlocks after Level 01; Security remains a future milestone.
- Inspect three illustrative Product growth stages. Growth is visual and grants no combat bonus.
- Change reduced-motion and higher-contrast preferences, saved under a different localStorage key for each prototype.
- Use Escape, the close button, or the backdrop to close dialogs. Focus returns to the opening control. Native dialogs constrain keyboard focus.
- Arrow keys cycle levels on the overworld and Personas in the hangar. Enter launches the selected flow when the page itself has focus; focused buttons retain native keyboard behavior.
- The fullscreen button requests fullscreen only when clicked. Portrait, tablet, desktop, and short landscape layouts keep the main controls in the viewport.

The pages use the same sample progress (before round 4 of approximately 8), so layout comparisons are consistent. They do not read or write game saves, run a simulation, or add gameplay systems. The artwork is a UI illustration, not an export or revision of a registered game model. Additional growth-stage visuals and future-level placement are explorations, not new game-design commitments.

## Preview server (optional)

From the repository root:

```powershell
node prototypes/hub/serve.mjs
```

Open [the comparison page](http://127.0.0.1:5186). Set `HUB_PROTOTYPE_PORT` to use a different port.

## Iteration

Authoring is split into `screens.mjs` (the three screen compositions), `game-ui.css` (controls and responsive layouts), `game-ui.js` (interactions), and `art.mjs` (original vector illustrations). `build.mjs` embeds these into each delivered HTML file:

```powershell
node prototypes/hub/build.mjs
```

Edit these authoring files for durable changes; rebuilding overwrites the four generated HTML files. The finished pages can be copied and opened independently. Only the optional “All 3 concepts” link expects sibling files.

## Verification

Browser checks cover the saved-run and planning flow, level and Persona selection, Product growth previews, keyboard navigation and focus restoration, isolated persisted settings, and direct `file://` loading. Main screens were checked at 1440×900, 1280×720, 1024×768, 768×1024, 390×844, 360×640, and 844×390 for scrolling and obscured controls. Screenshots are in `previews/` with `v02` filenames.

Design references: `docs/design/00_Master_GDD.md`, `docs/design/Copilot_Agent_Design.md`, `docs/design/levels/Level_01_Just_One_Small_Feature.md`, and `docs/design/Visual_Asset_Guide.md`.

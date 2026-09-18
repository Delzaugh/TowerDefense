# Selectable AI campuses — iteration 03

## User decisions carried forward

- The main hub should be a mini-map with selectable buildings, based on iteration 02's first concept.
- The game should keep a modern, technical / AI visual direction.
- Keep the interface a full-screen game menu rather than a scrolling website.

This iteration keeps all three concepts on that foundation. White and blue-gray infrastructure, cyan activity, clean technical controls, and restrained landscaping replace the earlier chunky cream-and-yellow UI.

| File | Direction | Spatial difference |
| --- | --- | --- |
| `01-nexus-campus.html` | Nexus Campus | One connected technology park with paths, water, solar panels, and a central server core. |
| `02-cloud-cluster.html` | Cloud Cluster | Independent campus platforms joined by data bridges, with slate UI and cyan accents. |
| `03-circuit-garden.html` | Circuit Garden | A compact research campus organized around a circular walk and faceted central Product core. |

Open [the comparison menu](http://127.0.0.1:5186/v03/index.html) while the prototype server is running, or open `index.html` directly. Each delivered HTML page is self-contained and works offline, without a build or dependencies.

## Building functions

- **Product Core:** visual Product growth preview.
- **Copilot Lab:** Personas and their details.
- **Deployment:** level selection and briefings.
- **Operations:** accessibility settings.

Click either the building itself or its label. Hover/focus highlights its footprint and updates the short destination description. Arrow keys move between label controls; Enter opens the focused control. SVG buildings also accept Enter/Space. Escape closes overlays and restores focus. Continue opens the sample saved-run flow and a planning UI preview.

## Scope

These are interface studies, not playable levels. Existing game saves, gameplay code, registered models, manifests, and design rules are untouched. Sample progression remains before round 4 of approximately 8. The Analyst unlock remains after Level 01; later levels and Security remain explicitly future concepts. Product growth is visual and grants no combat bonus.

The original v02 pages are preserved one directory above; `../v02-index.html` links them. The v01 archive also remains available.

## Iterate

- `worlds.mjs`: original vector architecture, terrain, placement, hit areas, and label anchor projection.
- `tech.css`: modern game UI, interaction feedback, responsive layouts, and overlay styling.
- `interactions.js`: direct building interaction and map keyboard navigation.
- `dialogs.js`: copied baseline hub overlay flows and isolated prototype preferences.
- `dialogs-base.css` and `legacy-art.mjs`: copied baseline styles and Persona illustrations used by overlays.
- `build.mjs`: embeds all required art, styles, and scripts into the four delivered HTML files and points the root comparison page to this iteration.

From the Tower root:

```powershell
node prototypes/hub/v03/build.mjs
node prototypes/hub/serve.mjs
```

Editing a generated HTML page directly works, but rebuilding will overwrite it. Edit the sources above for durable changes.

## Verification

Checked all three at 1440×900, 1280×720, 1024×768, 768×1024, 390×844, 360×640, and 844×390: no main-screen scrolling or obscured label/launch controls. Browser checks exercised direct building clicks, label controls, keyboard navigation, focus restoration, Persona details, future-level previews, Continue → planning → mode selection, saved preferences, and offline `file://` use. No browser JavaScript errors. Preview screenshots are in `previews/`.

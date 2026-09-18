# Circuit Garden — iteration 05

**Selected by the user on 2026-09-13: Glacier (option 2).** This is the default hub and the basis for future refinement: porcelain, steel blue, and icy cyan; numbered building markers and 1–4 shortcuts; angular controls; a right-hand Continue panel; full-screen game menus. The selection itself makes no further visual changes. Sage and Dusk remain available for comparison.

Three standalone variations of the accepted v04 campus and full-screen game menus. Open [the comparison screen](http://127.0.0.1:5186/v05/index.html), or open any delivered HTML file directly from disk.

| Variant | Visual direction | UX differences |
| --- | --- | --- |
| `01-sage.html` | Ivory, eucalyptus, and pale green; quiet daylight | Compact labels, reduced secondary text, a low centered Continue bar, lighter collection framing |
| `02-glacier.html` | Porcelain, steel blue, and icy cyan | Numbered markers, 1–4 destination shortcuts, angular controls, a right-hand Continue panel |
| `03-dusk.html` | Slate violet, illuminated blue accents, and apricot | Icon-led markers, a left-hand Continue panel, centered desktop menu headings and selections |

The footer switches directly between variants. All Variants returns to the comparison screen. Its Reference Version link opens v04.

## Decisions preserved

- The enlarged miniature campus is the main navigation. Buildings and labels are selectable.
- All destination menus use the accepted full-screen game presentation.
- No logins or profiles, no Headquarters information block, and no home-screen Analyst milestone tile.
- Modern technical/AI architecture, a circular garden, and restrained activity.
- Earlier versions remain intact.

The sample run, Persona information, visual Product growth, planning preview, keyboard navigation, reduced motion, contrast, and optional interface sounds are preserved. Each variant stores its own preferences under a distinct v05 key. The pages do not read or write real game saves or change production code/assets.

## Rebuild

```powershell
node prototypes/hub/v05/build.mjs
node prototypes/hub/serve.mjs
```

- `source/circuit-garden.html` is a frozen snapshot of the accepted v04 prototype. Rebuilding v05 does not depend on later edits to v04.
- `build.mjs` creates the standalone variants and comparison page, including SVG material palette changes. Dusk receives a separate scene-lighting treatment.
- `variants.css` contains the three layout and visual treatments.
- `variants.js` adds Glacier's numbered keyboard controls.

Every delivered HTML contains its own styles, scripts, and SVG illustrations. The comparison page also embeds its artwork; previews are not runtime dependencies.

## Review and verification

Reviewed the three desktop and phone screens, menus, comparison screen, and compact landscape layouts. Corrected Sage's compact-title spacing, adjusted Dusk's scene colors and marker contrast, and fixed focus-induced horizontal movement when resizing after closing a menu.

Checked all three at 1440×900, 2495×1272, 1280×720, 768×1024, 390×844, 360×640, and 844×390. Home controls remained unobstructed; the home screen and menus had no horizontal overflow. All four building hits and labels opened the expected menus. Resume and new-run previews retained round 4 and round 1 respectively. Glacier's 1–4 shortcuts worked, and motion preferences persisted independently between variants. No JavaScript page errors occurred in those checked flows.

Captures are in `previews/`.

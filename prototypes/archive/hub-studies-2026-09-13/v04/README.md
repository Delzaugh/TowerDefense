# Circuit Garden — refinement 04

The selected game home screen, refined through three visual review passes. Open [Circuit Garden](http://127.0.0.1:5186/v04/index.html), or open `index.html` directly from disk. The HTML is self-contained, including its SVG art, styles, interactions, and optional synthesized interface sounds. No network dependencies.

## Direction

A modern AI campus arranged around a circular garden. The miniature world is the navigation: select the Product Core, Copilot Lab, Deployment gate, or Operations building. The illustration is supported by a prominent Continue action and a small set of game utilities.

User feedback after the initial refinement: no logins or profiles; remove the Headquarters / Circuit Garden information block and the home-screen Analyst milestone tile; maximize the campus. The scene now fits both viewport dimensions without the previous fixed pixel cap. Persona unlock information remains inside its destination menus.

The refinement adds directional shading, faceted trees, beveled architecture, a hovering energy core, water glints, a maintenance drone, flowing data, and subtle pointer movement. Warm garden colors balance the white technical architecture. Destination menus now occupy the screen over the dimmed campus, with large cream headings, translucent selection rows, and pale green active states. The former rounded dialog boxes and header bars have been replaced.

## Interactions

- Click buildings or their labels; hover and keyboard focus highlight their footprints.
- Left/right arrows cycle destinations. Enter opens; SVG buildings also support Space. Escape closes menus and restores focus.
- Continue opens the sample round-4 briefing and planning preview. New run opens the round-1 preview.
- Deployment offers the current level and two future theme previews.
- Copilot Lab displays available and locked Personas, with inspectable roles and unlock conditions.
- Product Core offers three illustrative growth stages.
- Operations controls reduced motion and higher contrast. System reduced-motion preferences are also respected.
- Operations also exposes interface sound. Its large ON/OFF rows support click/tap, Space/Enter, and left/right arrows. Up/down arrows navigate menu controls; focus starts on the first control. Escape or the return control closes the menu and restores focus. The full-screen menus do not dismiss on background clicks.
- Interface sound starts off. The sound button enables short synthesized UI cues; no autoplay music.

## Scope and isolation

This is a UI prototype, not connected gameplay. The displayed save is sample progress; no actual game saves are read, created, or replaced. Motion/contrast and sound preferences use keys unique to v04. Product growth remains visual without a combat-stat bonus. Analyst unlocks after completing Level 01; Security and later levels remain future concepts. Illustration changes do not edit registered game assets or Blender sources.

Iteration 03 and all earlier concepts remain preserved. The home-screen Design History link returns to the v03 comparison menu.

## Edit and rebuild

From the repository root:

```powershell
node prototypes/hub/v04/build.mjs
node prototypes/hub/serve.mjs
```

- `worlds.mjs`: code-authored isometric SVG scene, materials, geometry, and hit regions.
- `build.mjs`: home-screen structure and standalone HTML assembly.
- `polish.css`: v04 scene, home-screen, overlay, and responsive styling.
- `game-menus.css`: full-screen destination presentation, selection states, and responsive menu layouts.
- `polish.js`: optional audio and pointer movement.
- `dialogs.js`: destination menus and sample planning flows.
- `interactions.js`: building navigation and focus handling.
- `tech.css`, `dialogs-base.css`, `legacy-art.mjs`: isolated inherited base styles and illustration helpers.

See `REVIEW.md` for the completed review passes and behavior checks. The `previews/` directory contains before, intermediate, and final captures.

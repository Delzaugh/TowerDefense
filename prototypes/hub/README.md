# Glacier hub prototype

Glacier is the only active prototype. Open [the prototype](http://127.0.0.1:5186/) or open `index.html` directly from disk.

## Develop

```powershell
node prototypes/hub/build.mjs
node prototypes/hub/serve.mjs
```

- `source/template.html`: home-screen markup, scene SVG, and menu shell.
- `source/styles.css`: Glacier's home, game-menu, and responsive styles.
- `source/app.js`: destination menus, scene preview, keyboard navigation, and preferences.
- `build.mjs`: packages these into one self-contained `index.html`.
- `serve.mjs`: serves Glacier only. The previous selected Glacier URL redirects to `/`; other historical routes and source files are not served.
- `previews/`: visual review captures, outside the server's allowed routes.

The active build has no dependency on the archive, no variant switcher, and no comparison or history links. It retains the enlarged campus, unnumbered building labels with 1–4 keyboard shortcuts, game menus, sample planning flows, reduced motion, higher contrast, and optional interface sounds. Existing Glacier preference keys are preserved so the cleanup does not reset the user's choices.

The bottom-left destination info label has been removed. The Continue card scales for larger screens with a larger title, readable supporting text, stronger contrast, and compact-screen adjustments.

No accounts or profiles. No real game saves or simulation are read or written; this remains an isolated UI prototype.

## Archive

All earlier studies, including the selected pre-cleanup Glacier snapshot, are preserved in `../archive/hub-studies-2026-09-13/`. That archive is outside the served site directory. The adjacent SHA-256 manifest records the original files for verification.

# Inspection studio and command bar — 2026-09-30

The Copilot Lab retains its expanded mint hover highlight. Its shell now also separates along surface normals so the thin foundation no longer shares depth with the paving; shell and footprint use opposing depth bias. Authored meshes, materials, hit testing, keyboard focus and click-versus-drag behavior remain intact.

Inspection renders only the selected Tower and its existing lifecycle effects over an appearance-aware radial/dotted studio. The room asset and pedestal are no longer loaded. The shared projection preserves authored metre scale; its orbit pivot follows the selected model's rest centre without scaling or refitting the model. Zoom ranges from 0.65 to 6, starts at 1.65, and is available through wheel, pinch, keyboard and explicit zoom/reset controls.

The selection roster spans both desktop columns beneath the preview and natural-height capability panel. Seven Persona cards share the row; narrow screens scroll the roster and stack the panels. Short desktop screens retain minimum preview height and scroll the workspace without overlapping the roster.

The reusable `GameTopBar` is adopted by Hub and inspection. It owns leading/context/trailing alignment, safe areas and world/surface appearance. Callers retain their real actions and state. The [command bar concept](../../docs/design/concepts/ui-primer-2026-09-30/tower-command-bar.html) explores a contextual game menu and illustrative mission layout; those future menu/gameplay behaviors are not part of this implementation.

## Verification

- Lint, dependency boundaries and all three TypeScript projects pass.
- 332 unit tests pass in 29 files, including shared model projection, close zoom/reset, highlight identity and occluded building hit tests.
- Final browser regression: 98 pass, 8 intentional platform skips. Desktop/touch inspection checks cover selection, orbit/zoom/reset, full-width roster, natural panel height, loading/recovery and model lifecycle.
- Deployment-subpath suite: 5 pass. The preview loads Tower models under `/TowerDefense/` and makes no workbench-room request.
- `inspection-studio-review.cjs`: 12 inspection layout checks across Light/Dark at 1600×900, 1280×800, 1024×685, 390×844, 844×390 and 320×568. No horizontal overflow, header overlap, runtime/shader errors or failed requests. Model viewport remains at least 210 px high; desktop roster spans both columns.
- Visually reviewed default Developer, close Developer, Tester, tall Senior Developer, both themes, phone layouts and the Lab highlight at the campus maximum zoom of 1000%. The original hover appearance remains visible and the foundation depth collision is resolved.
- The concept passes 12 separate context/layout checks and local menu/settings/back interactions. Production uses Octicons; the inline concept uses host-supplied icons.

The source and checked-in Pages snapshot are released as separate commits so `build-info.json` identifies the source revision used to build the deployable bytes. After deployment, check the live metadata, file hashes and the same UI interactions against the public URL.

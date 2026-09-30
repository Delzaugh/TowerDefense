# Primer Field kit UI release — 2026-09-30

The user approved the dark concepts and requested light equivalents, production integration through GPT-6.1 Sol agents on Medium, reusable components, and a verified GitHub Pages release.

## Ownership

- Toolkit agent: semantic light/dark tokens, reusable native React controls, persisted appearance provider, startup styling, theme tests.
- Hub agent: current campus home layout and settings integration.
- Inspection agent: live Tower inspection layout, collections, qualitative capability gauges.
- Lead: current encounter UI adoption, integration, production checks, scoped commit and Pages deployment.

## Decisions

- Use Field kit with opaque panels, restrained borders, Mona Sans, Octicons, green primary actions, and blue selection/focus.
- Keep world lighting authored; appearance affects UI surfaces and controls.
- Preserve current game behavior. Illustrative campaign actions in the concepts do not create unsupported features.
- Keep native dialogs, accessible names, keyboard input, touch input, renderer lifecycle and missing-model recovery.
- Keep simulation, balance, catalogs and models outside this UI change.
- Existing local asset/source edits are not a release staging set. Base the release on current GitHub main and copy only reviewed UI files and their documentation/tests.

## Progress

- Light toolkit and connected Hub/inspection concepts created. Both preview suites passed 36 layouts without overflow or interaction failures.
- Three requested GPT-6.1 Sol agents on Medium completed the shared toolkit, Hub and inspection modules. The lead integrated current encounter controls and reviewed all changes.
- The isolated release starts from GitHub main `10b984c`, preserving the newer published source and keeping unrelated local work outside staging.
- Desktop inspection gives the preview and heading a shared grid region, making the model larger without changing the renderer's shared display volume or model scale.

## Verification

- Lint, dependency boundaries and all three TypeScript projects passed.
- Unit suite: 331 tests passed in 29 files.
- Browser suite: 98 passed, 8 intentional platform skips. After the final preview layout adjustment, all 12 inspection regression tests passed again.
- GitHub Pages deployment-subpath suite: 4 passed, including route navigation, model loading, landscape fit and failed-download recovery.
- Dark/light review covered 1280×800, 390×844, 844×390 and 320×568 for Hub, inspection and an active encounter. The review script reported no runtime errors, failed requests or layout failures. Captures were visually inspected.
- The production build retains the existing large Three.js resource-chunk warning. No renderer, model or simulation changes are part of this release.
- Windows browser cleanup required running Playwright outside the filesystem sandbox; the completed suites exited successfully.
- Source and the generated Pages snapshot are ready for scoped commits. Final delivery includes successful Pages deployment and a check of the live appearance controls and release metadata.

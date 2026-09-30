# Code quality and mobile support pass

Scope: correct the concrete code and mobile findings from the Three.js audit. Feature milestones, campaign work and art production remain outside this pass. Existing work in the shared checkout was preserved. No public deployment was performed.

## Changes

- Campus camera now supports one-finger pan and anchored two-finger pinch/pan. Removing one finger continues panning without opening a building. Cancel, lost capture, blur, hidden document, disabled interaction and teardown clear owned contacts.
- Tower preview retains drag rotation/tilt and pinch zoom, with explicit blur/hidden-document cancellation and capture release. The diagnostic map also cancels aiming on window blur.
- Screen download and preview initialization now have 20-second deadlines. A failed cached JavaScript import offers a document reload. Model loading bounds both fetch and GLTF decode, aborts stalled requests, disposes late decoded models and permits a fresh preview attempt. Campus interaction remains available after closing the Codex.
- Mobile camera, collection and navigation controls have at least 44 CSS-pixel targets. Phone portrait and landscape layouts accommodate larger controls, roster labels and safe-area insets. Long stats remain scrollable.
- The encounter adapter reuses its published immutable snapshot for frame scheduling, avoiding validation/cloning of the full command log on idle frames. Empty event batches no longer rebuild the display log. Snapshot JSON is generated only while both diagnostic panels are open.
- Save loading reuses the encounter produced by authoritative validation rather than replaying the same command log a second time. All save compatibility, geometry, blueprint and command replay checks remain active.
- Add `?diagnostics` to the app URL to expose `window.__TOWER_DIAGNOSTICS__.campus.sample()` and `.showcase.sample()` while their scenes exist. Samples expose draw calls, triangles, geometry/texture counts, pixel ratio and camera/model state. Registry entries are cleaned up with each scene; default URLs do not expose diagnostics. Showcase render counts include its room and preview passes.
- Pages now installs dependencies, runs the verification suite and packages `game/dist` from the checked-out source before upload. Build metadata records the CI commit and file SHA-256 manifest. Browser configurations use bundled Chromium on CI and installed Edge locally.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run check:boundaries` | Passed, 149 modules / 387 dependencies |
| `npm test -- --reporter=dot` | 327 passed across 28 files |
| `npm run build` | TypeScript and production build passed |
| `npm run test:e2e` | 86 passed, 8 intentional desktop/touch-specific skips |
| Final targeted home/mobile/recovery pass | 9 passed, 1 phone-only skip; includes the two additional renderer-chunk recovery cases |
| `npm run test:deployment` | 4 passed under `/TowerDefense/` |
| `npm run build:pages` | Passed; 76 packaged files; release `75db9cee94324b21` |
| Packaged manifest verification | All 75 listed files matched byte counts and SHA-256 hashes |

The Pages metadata is preserved at [pages-build-info.json](pages-build-info.json). Its local `sourceRevision` is null; GitHub Actions supplies `GITHUB_SHA` during CI. The local preview build was then restored to its relative base for normal use at `/`.

Windows Playwright completed every case but stalled stopping its managed Vite subprocess. After the cases completed, only the Vite PID emitted by that particular test invocation was stopped; each test command then exited successfully. No unrelated preview servers were stopped.

Final phone captures and measurements are under `game/test-results/quality-final/mobileQuality-mobile-gestu-fd687-tation-and-renderer-cleanup-touch-edge/`: `showcase-390.png`, `showcase-844.png`, and `renderer-diagnostics.json`. Both captures were visually inspected; the Developer model is visible, portrait labels fit and controls remain clear in both orientations. The collection and stats panels intentionally scroll.

The recorded reduced-motion sample at DPR 2 reports campus 247 draw calls / 126,744 triangles / 61 geometries / 103 textures after pinch zoom to 1.625, and Developer showcase 8 draw calls / 9,648 triangles / 4 geometries / 7 textures at rest. These are renderer counts for the specified views, not active gameplay frame-time or hardware performance claims.

Focused regression coverage includes stalled fetch/decode deadlines, cancellation and late-resource disposal; a fresh successful load after timeout; camera pinch/pan continuity; no building activation from multi-touch; no command-history validation on idle frames; desktop/touch chunk reload and model retry; real browser multi-touch dispatch; orientation changes; touch target dimensions; renderer sampling and cleanup.

The browser suite runs against the Vite production preview. Emulated phone results establish input/layout behavior on desktop Edge, not physical phone GPU or thermal performance. The shared Three.js bundle still triggers Vite's existing 500 kB warning. GitHub Actions itself has not been run remotely during this local task.

## Skills used

`threejs-game-director`, `threejs-debug-profiler` and its debug playbook, `threejs-game-ui-designer` and its UI patterns, and `threejs-qa-release` and its release checks.

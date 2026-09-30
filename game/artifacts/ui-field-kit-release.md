# Field kit release verification

Source revision: `57d5f102300fd04781635f0022bb73bbeb36934e`.
Remote baseline: `10b984c258c9537972ea59ba8768ac43d2b50b31`.
Pages release: `c633454d4a42914a`, packaged with 75 files and the `/TowerDefense/` base.

The Hub, Tower inspection and current encounter screen use shared Primer-inspired light/dark semantic tokens and native React controls. Dark, Light and System appearance persist independently of campus motion settings. Authored world lighting, model scale, renderer behavior and simulation rules remain unchanged.

## Completed checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run check:boundaries` | Passed |
| `npm run typecheck` | All three projects passed |
| `npm run test` | 331 passed in 29 files |
| `npm run test:e2e` | 98 passed, 8 intentional platform skips |
| Inspection browser regression tests after the final preview layout change | 12 passed |
| `npm run test:deployment` after the final change | 4 passed |
| `node artifacts/ui-field-kit-review.cjs` | 16 inspection/encounter records; no runtime errors, failed requests or layout failures |
| `npm run build:pages` | Passed; all existing runtime assets packaged |
| Source diff whitespace check | Passed |

Visual review covered Hub, inspection and an active encounter in both appearances at 1280×800, 390×844, 844×390 and 320×568. The desktop preview was enlarged through layout without refitting the camera or resizing models. Preview stability, reduced motion, collections, keyboard navigation and failed-download recovery remain covered by browser tests.

The existing Three.js resource bundle still produces Vite's large-chunk warning. Browser-process cleanup on this Windows host required running the completed Playwright suites outside the filesystem sandbox. Physical-device performance was not measured.

The workflow publishes the checked-in `pages-site/` snapshot on a push to `main`. Its files preserve their packaged bytes so deployment can be verified against `build-info.json`. Final delivery is confirmed separately against the Pages workflow result, live release metadata and public appearance controls.

# Hello World Courtyard — verification

**PASS: interactive map draft, 30 September 2026.** TypeScript, production build, native simulation checks, desktop pointer input, phone touch input and measured active-play canvases pass. No unresolved functional defect was found in the tested scope.

## Functional evidence

- [Native checks](native-evidence.json): placement and Server sight, budget, permanent Personas, processed Work fraction, pause and 2× clock, round carryover, entity IDs, mode restrictions, non-stacking Tester bonus, three-round completion, no-build failure and reset.
- [Desktop/phone interaction](browser-evidence.json): actual pointer placement rejects road/Server without cost, two-specialist opening completes all three rounds, pause freezes the entire snapshot, team/budget carry over, retry resets, phone taps select a Copilot and operate camera/start/pause.
- [Production checks](production-evidence.json): three suggested Bases finish 8 Work and 7 Bugs, miss none and retain 100/100 health. No development controller is exposed. Paused speed controls are disabled. Touch zoom changes canvas pixels and Fit restores the view. A deliberate GLB request failure preserves reload feedback and disables play.

The native and browser checks both verify behavior rather than treating screenshots as proof of gameplay. Normal tested pages record zero console/page errors and zero failed requests. Deliberate asset failure is a separate test.

## Current visual evidence

The declared [capture manifest](evidence.json) uses run ID `courtyard-draft-20260930-final`. Inspector setup uses the same UI controls as a player, waits for actual gameplay at two seconds, then pauses the simulation while rendering continues. It does not manufacture a named state or modify a snapshot.

| Capture | Entropy | Edge density | Luminance contrast | Calls / triangles | Geometries / textures |
| --- | ---: | ---: | ---: | --- | --- |
| [Desktop active play](canvas-final/desktop-active-play.png) / [report](canvas-final/desktop-active-play.json) | 2.13 | 0.150 | 73.1 | 69 / 15,631 | 48 / 24 |
| [Phone active play](canvas-final/mobile-active-play.png) / [report](canvas-final/mobile-active-play.json) | 2.14 | 0.131 | 79.4 | 69 / 15,631 | 48 / 24 |

Both canvases are nonblank and within the shared starting render budgets. Measurements use Edge on an RTX 3090; phone captures emulate size, DPR and touch on that computer. These are render-cost observations, not real-phone performance or FPS claims. Mobile DPR is capped at 1.5.

Reviewed additional captures: [final planning](09-final-planning.png), [Server coverage in top view](08-server-coverage.png), [three-round completion](10-final-complete.png), and [phone with expanded map](11-final-phone.png). Responsive checks cover 1280×900, 390×844, 320×568, 667×375 and 740×375, with additional read-only panel checks at 1440×900 and 844×390. Controls remain reachable by panel scrolling and phone collapse.

## Build and reproduction

- `npm run build` from the prototype: PASS, including TypeScript.
- `node artifacts/verify-native.mjs` from the prototype: focused native assertions.
- `node artifacts/browser-qa.mjs`: development server 5189, installed Edge.
- `node artifacts/production-qa.mjs`: development 5189 and production preview 5190, installed Edge.
- `node ../prototypes/hello-world-courtyard/artifacts/canvas-qa.mjs` from `game`: shared inspector. This machine supplies `pngjs` through the bundled runtime's `NODE_PATH`; no game dependency changes were needed.

The production bundle is 768.14 kB JavaScript, 204.03 kB gzip, plus 9.99 kB CSS and nine registered GLBs totaling about 1.49 MB. Vite reports its standard 500 kB chunk warning. Keeping the small prototype in one Three.js bundle is an accepted draft tradeoff; shipping work should revisit startup loading and code splitting. Asset imports validate catalog/hash contracts, and the production preview loads every bundled asset successfully.

Harness decision: keep focused input assertions and a declared canvas inspector pass. A golden image suite and difficulty bot are deferred because this is a map geometry draft with provisional balance, rather than a release-ready campaign. Delivered animation clips play when present; no new art or clips are authored here.

## Refinements from review

Work completion uses remaining Work, not travel distance. Auto beams update color when their target changes between Work and Bugs. Paused tactical/speed controls match native command rules. Load failure messaging persists. Touch zoom/Fit is available. Per-entity progress-bar geometry and materials are disposed when an actor leaves; shared GLB materials are retained for reuse.

## Practical limits

The three rounds are forgiving layout tests. Both tested openings clear, and the early specialist team currently wins before the Server is necessary. This is evidence of viable openings, not proof of final balance or a completed tutorial.

The full Level 1 teaching sequence, Ambiguous Requirement, Technical Debt Sprint, Production Incident and Analyst unlock remain outside this draft. Product/gate/Server scenery includes proxies. Character footprint 1.45 is a prototype hypothesis. The scene uses a simple feature marker after success. Physical mobile performance and deployment at a hosted subpath are untested.
